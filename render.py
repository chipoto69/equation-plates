#!/usr/bin/env python3
"""Deterministic equation plates. Seed is the work id."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

def seed_floats(seed: str, n: int = 4):
    h = hashlib.sha256(seed.encode()).digest()
    out = []
    for i in range(n):
        chunk = int.from_bytes(h[i*4:(i+1)*4], "big") / 2**32
        # map into [-2.4,-0.6] U [0.6,2.4]
        mag = 0.6 + chunk * 1.8
        sign = -1 if (h[16+i] % 2) else 1
        out.append(round(sign * mag, 3))
    return out

def clifford(a, b, c, d, n=400000, burn=1000):
    x = y = 0.1
    xs = np.empty(n); ys = np.empty(n)
    for i in range(burn):
        x, y = np.sin(a*y) + c*np.cos(a*x), np.sin(b*x) + d*np.cos(b*y)
    for i in range(n):
        x, y = np.sin(a*y) + c*np.cos(a*x), np.sin(b*x) + d*np.cos(b*y)
        xs[i], ys[i] = x, y
    return xs, ys

def dejong(a, b, c, d, n=400000, burn=1000):
    x = y = 0.1
    xs = np.empty(n); ys = np.empty(n)
    for i in range(burn):
        x, y = np.sin(a*y) - np.cos(b*x), np.sin(c*x) - np.cos(d*y)
    for i in range(n):
        x, y = np.sin(a*y) - np.cos(b*x), np.sin(c*x) - np.cos(d*y)
        xs[i], ys[i] = x, y
    return xs, ys

def superformula(m, n1, n2, n3, steps=4000):
    phi = np.linspace(0, 2*np.pi, steps)
    r = (np.abs(np.cos(m*phi/4))**n2 + np.abs(np.sin(m*phi/4))**n3) ** (-1/n1)
    return r*np.cos(phi), r*np.sin(phi)

def littlewood(seed, degree=18):
    rng = np.random.default_rng(int(hashlib.sha256(seed.encode()).hexdigest()[:8], 16))
    coef = rng.choice([-1.0, 1.0], size=degree+1)
    roots = np.roots(coef)
    return roots.real, roots.imag, coef.tolist()

def score(xs, ys, bins=240):
    H, _, _ = np.histogram2d(xs, ys, bins=bins)
    mass = H.sum()
    if mass == 0:
        return {"ok": False, "fill": 0, "peak": 1}
    fill = float((H > 0).mean())
    peak = float(H.max() / mass)
    return {"ok": 0.05 < fill < 0.85 and peak < 0.08, "fill": round(fill, 4), "peak": round(peak, 4)}

def save_plate(xs, ys, path, title):
    fig, ax = plt.subplots(figsize=(8, 8), facecolor="black")
    ax.set_facecolor("black")
    ax.hist2d(xs, ys, bins=720, cmap="bone_r")
    ax.set_aspect("equal"); ax.axis("off")
    fig.savefig(path, dpi=120, facecolor="black", bbox_inches="tight", pad_inches=0.05)
    plt.close()

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--family", default="clifford", choices=["clifford", "dejong", "superformula", "littlewood"])
    p.add_argument("--seed", default="20261004")
    p.add_argument("--out", default="plates")
    args = p.parse_args()
    out = Path(args.out); out.mkdir(exist_ok=True)
    a, b, c, d = seed_floats(args.seed)
    eq = {
        "clifford": "x' = sin(a*y) + c*cos(a*x); y' = sin(b*x) + d*cos(b*y)",
        "dejong": "x' = sin(a*y) - cos(b*x); y' = sin(c*x) - cos(d*y)",
        "superformula": "r(phi) = (|cos(m*phi/4)|^n2 + |sin(m*phi/4)|^n3)^(-1/n1)",
        "littlewood": "p(z) = sum eps_k z^k, eps in {-1,+1}",
    }[args.family]
    if args.family == "clifford":
        xs, ys = clifford(a, b, c, d)
    elif args.family == "dejong":
        xs, ys = dejong(a, b, c, d)
    elif args.family == "superformula":
        m = [3, 4, 5, 6, 8][int(abs(a)*10) % 5]
        xs, ys = superformula(m, abs(b), abs(c)+0.4, abs(d)+0.4)
        a, b, c, d = m, abs(b), abs(c)+0.4, abs(d)+0.4
    else:
        xs, ys, coef = littlewood(args.seed)
    meta = {
        "series": "equation-plates",
        "family": args.family,
        "seed": args.seed,
        "params": {"a": a, "b": b, "c": c, "d": d},
        "iterate_count": int(len(xs)),
        "burn_in": 1000,
        "bins": 720,
        "colormap": "ink",
        "equation": eq,
        "renderer": "numpy-hist2d-v1",
        "filename": f"{args.family}_{args.seed}.png",
        "score": score(xs, ys),
    }
    png = out / meta["filename"]
    save_plate(xs, ys, png, args.family)
    (out / f"{args.family}_{args.seed}.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta))

if __name__ == "__main__":
    main()
