const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const main = document.getElementById("main");
let plates = [];
let pointer = { x: 0.5, y: 0.5, hot: 0 };

async function boot() {
  plates = await fetch("/plates.json").then(r => r.json());
  addEventListener("popstate", render);
  document.body.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || a.origin !== location.origin) return;
    if (a.pathname.startsWith("/p/") || a.pathname === "/" || a.pathname === "/archive") {
      e.preventDefault();
      history.pushState({}, "", a.pathname);
      render();
    }
  });
  render();
}
function render() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll("[data-nav]").forEach(a => a.removeAttribute("aria-current"));
  if (path === "/archive") {
    document.querySelector("[data-nav=archive]").setAttribute("aria-current", "page");
    return archive();
  }
  document.querySelector("[data-nav=index]").setAttribute("aria-current", "page");
  if (!path.startsWith("/p/")) return list();
  const plate = plates.find(p => p.id === path.slice(3)) || plates[0];
  sheet(plate);
}
function list() {
  document.title = "Plates";
  main.innerHTML = `<h1 class="large">Plates</h1><p class="sub">Metanomicon · ${plates.length}</p><div class="group">${plates.map(p => `
    <a class="row" href="/p/${p.id}"><span class="mark" data-id="${p.id}"></span><span><b>${p.family}</b><small>${p.id} · ${p.status}</small></span><span class="chev">›</span></a>`).join("")}</div>`;
  main.querySelectorAll(".mark").forEach(el => {
    const p = plates.find(x => x.id === el.dataset.id);
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    el.appendChild(c);
    draw(c, p, 4000);
  });
}
function archive() {
  document.title = "Archive";
  const families = ["all", ...new Set(plates.map(p => p.family))];
  main.innerHTML = `<h1 class="large">Archive</h1><div class="seg">${families.map((f,i) => `<button data-fam="${f}" aria-pressed="${i===0}">${f}</button>`).join("")}</div><div class="group" id="rows">${rows("all")}</div>`;
  main.querySelectorAll("button").forEach(btn => btn.onclick = () => {
    main.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b===btn));
    main.querySelector("#rows").innerHTML = rows(btn.dataset.fam);
  });
}
function rows(fam) {
  return plates.filter(p => fam==="all" || p.family===fam).map(p =>
    `<a class="row" href="/p/${p.id}"><span><b>${p.id}</b><small>${p.family} · ${p.a}, ${p.b}, ${p.c}, ${p.d}</small></span><span class="chev">›</span></a>`
  ).join("");
}
function sheet(p) {
  document.title = p.family;
  const edge = Math.min(720, Math.floor((innerWidth - 32) * (window.devicePixelRatio || 1)));
  main.innerHTML = `<section class="sheet">
    <div class="navline"><a class="back" href="/">‹ Plates</a><span>${p.family}</span></div>
    <canvas id="plate" width="${edge}" height="${edge}" aria-label="${p.family}"></canvas>
    <p class="law">${p.eq}</p>
    <p class="meta">${p.id} · ${p.status} · a ${p.a} b ${p.b} c ${p.c} d ${p.d}</p>
    <div class="progress" aria-hidden="true"><span></span></div>
  </section>`;
  draw(document.getElementById("plate"), p, reduce ? 12000 : 80000);
}
function sample(p, n, total, state) {
  if (p.family === "superformula") {
    const phi = (n / Math.max(1, total)) * Math.PI * 2;
    const m = p.a || 5;
    const n1 = Math.abs(p.b) + 0.4;
    const n2 = Math.abs(p.c) + 0.4;
    const n3 = Math.abs(p.d) + 0.4;
    const t1 = Math.pow(Math.abs(Math.cos(m * phi / 4)), n2);
    const t2 = Math.pow(Math.abs(Math.sin(m * phi / 4)), n3);
    let r = Math.pow(t1 + t2 + 1e-6, -1 / n1);
    if (!Number.isFinite(r)) r = 1;
    r = Math.max(0.05, Math.min(6, r));
    const ring = 1 + (n % 7) * 0.015;
    return [r * Math.cos(phi) * ring, r * Math.sin(phi) * ring];
  }
  if (p.family === "littlewood") {
    if (!state.roots) state.roots = littlewoodRoots(p);
    const root = state.roots[n % state.roots.length];
    const jitter = ((n * 17) % 9) / 90;
    return [root[0] + jitter, root[1] - jitter];
  }
  if (p.family === "dejong") {
    const nx = Math.sin(p.a * state.y) - Math.cos(p.b * state.x);
    const ny = Math.sin(p.c * state.x) - Math.cos(p.d * state.y);
    state.x = nx; state.y = ny;
    return [nx, ny];
  }
  const nx = Math.sin(p.a * state.y) + p.c * Math.cos(p.a * state.x);
  const ny = Math.sin(p.b * state.x) + p.d * Math.cos(p.b * state.y);
  state.x = nx; state.y = ny;
  return [nx, ny];
}
function littlewoodRoots(p) {
  const deg = Math.max(6, Math.min(16, Math.round(Math.abs(p.a)) || 12));
  const eps = [];
  let s = 2166136261 ^ deg;
  for (let k = 0; k <= deg; k++) {
    s = Math.imul(s ^ (k + 17), 16777619);
    eps.push((s & 1) ? 1 : -1);
  }
  eps[0] = 1; eps[deg] = p.c < 0 ? -1 : 1;
  const roots = [];
  for (let k = 0; k < deg; k++) {
    const ang = (k + 0.5) / deg * Math.PI * 2;
    roots.push([0.6 * Math.cos(ang), 0.6 * Math.sin(ang)]);
  }
  const evalP = (re, im) => {
    let pr = eps[deg], pi = 0;
    for (let k = deg - 1; k >= 0; k--) {
      const nr = pr * re - pi * im;
      const ni = pr * im + pi * re;
      pr = nr + eps[k]; pi = ni;
    }
    return [pr, pi];
  };
  for (let iter = 0; iter < 18; iter++) {
    for (let k = 0; k < deg; k++) {
      const [re, im] = roots[k];
      const [pr, pi] = evalP(re, im);
      let dr = 1, di = 0;
      for (let j = 0; j < deg; j++) if (j !== k) {
        const ar = re - roots[j][0], ai = im - roots[j][1];
        const nr = dr * ar - di * ai, ni = dr * ai + di * ar;
        dr = nr; di = ni;
      }
      const den = dr * dr + di * di + 1e-9;
      const qr = (pr * dr + pi * di) / den;
      const qi = (pi * dr - pr * di) / den;
      roots[k][0] = Math.max(-2, Math.min(2, re - qr));
      roots[k][1] = Math.max(-2, Math.min(2, im - qi));
    }
  }
  return roots.filter(z => Number.isFinite(z[0]) && Number.isFinite(z[1]));
}
function draw(canvas, p, total) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const w = canvas.width, h = canvas.height;
  const bins = new Uint16Array(w * h);
  const state = { x: 0.1, y: 0.1 };
  const pts = [];
  const probeN = Math.min(total, p.family === "littlewood" ? 800 : 1500);
  for (let i = 0; i < probeN; i++) {
    const xy = sample(p, i, total, state);
    if (Number.isFinite(xy[0]) && Number.isFinite(xy[1])) pts.push(xy[0], xy[1]);
  }
  if (pts.length < 4) { ctx.fillStyle = "#0C0B09"; ctx.fillRect(0, 0, w, h); return; }
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    minx = Math.min(minx, pts[i]); maxx = Math.max(maxx, pts[i]);
    miny = Math.min(miny, pts[i+1]); maxy = Math.max(maxy, pts[i+1]);
  }
  const spanx = (maxx - minx) || 1, spany = (maxy - miny) || 1;
  const plot = (x, y) => {
    const ix = ((x - minx) / spanx) * (w - 12) + 6 | 0;
    const iy = ((y - miny) / spany) * (h - 12) + 6 | 0;
    if (ix >= 0 && iy >= 0 && ix < w && iy < h) bins[iy * w + ix] = Math.min(65535, bins[iy * w + ix] + 1);
  };
  for (let i = 0; i < pts.length; i += 2) plot(pts[i], pts[i+1]);
  let n = probeN;
  const paint = () => {
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < bins.length; i++) {
      const k = Math.min(1, Math.log1p(bins[i]) / Math.log1p(p.family === "littlewood" ? 6 : 24));
      const px = (i % w) / w, py = (i / w | 0) / h;
      const react = pointer.hot ? Math.max(0, 1 - Math.hypot(px - pointer.x, py - pointer.y) * 2.2) * 0.4 : 0;
      const ink = k + react * k;
      const o = i * 4;
      img.data[o] = 12 + ink * 200;
      img.data[o+1] = 11 + ink * 162;
      img.data[o+2] = 9 + ink * 70;
      img.data[o+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const bar = document.querySelector(".progress span");
    if (bar) bar.style.width = (n / total * 100) + "%";
  };
  const chunk = w < 200 ? total : 2500;
  function tick() {
    if (!canvas.isConnected) return;
    const end = Math.min(total, n + chunk);
    for (; n < end; n++) {
      const xy = sample(p, n, total, state);
      if (Number.isFinite(xy[0]) && Number.isFinite(xy[1])) plot(xy[0], xy[1]);
    }
    paint();
    if (n < total) requestAnimationFrame(tick);
  }
  canvas.onpointermove = canvas.onpointerdown = e => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width;
    pointer.y = (e.clientY - r.top) / r.height;
    pointer.hot = 1;
    paint();
  };
  canvas.onpointerup = canvas.onpointerleave = () => { pointer.hot = 0; paint(); };
  tick();
}
boot();
