const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const main = document.getElementById("main");
let plates = [];
let job = 0;

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
  main.innerHTML = `<h1 class="large">Plates</h1><p class="sub">Metanomicon \u00b7 ${plates.length}</p><div class="group">${plates.map(p => `
    <a class="row" href="/p/${p.id}"><span class="mark" data-id="${p.id}"></span><span><b>${p.family}</b><small>${p.id} \u00b7 ${p.status}</small></span><span class="chev">\u203a</span></a>`).join("")}</div>`;
  main.querySelectorAll(".mark").forEach(el => {
    const p = plates.find(x => x.id === el.dataset.id);
    const c = document.createElement("canvas");
    c.width = 72; c.height = 72;
    el.appendChild(c);
    animate(c, p, true);
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
    `<a class="row" href="/p/${p.id}"><span><b>${p.id}</b><small>${p.family} \u00b7 ${p.a}, ${p.b}, ${p.c}, ${p.d}</small></span><span class="chev">\u203a</span></a>`
  ).join("");
}
function sheet(p) {
  document.title = p.family;
  const edge = Math.min(800, Math.max(320, Math.floor(innerWidth * (devicePixelRatio || 1))));
  main.innerHTML = `<section class="sheet">
    <div class="navline"><a class="back" href="/">\u2039 Plates</a><span>${p.family}</span></div>
    <canvas id="plate" width="${edge}" height="${edge}" aria-label="${p.family}"></canvas>
    <p class="law">${p.eq}</p>
    <p class="meta">${p.id} \u00b7 ${p.status} \u00b7 a ${p.a} b ${p.b} c ${p.c} d ${p.d}</p>
    <div class="progress" aria-hidden="true"><span></span></div>
  </section>`;
  animate(document.getElementById("plate"), p, false);
}
function superPoint(m, n1, n2, n3, phi) {
  const r = Math.pow(Math.abs(Math.cos(m * phi / 4)) ** n2 + Math.abs(Math.sin(m * phi / 4)) ** n3 + 1e-4, -1 / n1);
  const rr = Math.max(0.12, Math.min(4.2, r));
  return [rr * Math.cos(phi), rr * Math.sin(phi)];
}
function dustRoots() {
  const roots = [];
  let s = 2166136261;
  for (let k = 0; k < 72; k++) {
    s = Math.imul(s ^ (k + 9), 16777619);
    const ang = (k / 72) * Math.PI * 2 + ((s & 15) / 30);
    const rad = 0.22 + ((s >>> 4) & 31) / 26;
    roots.push([rad * Math.cos(ang), rad * Math.sin(ang), k]);
  }
  return roots;
}
function animate(canvas, p, glyph) {
  const token = ++job;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const roots = p.family === "littlewood" ? dustRoots() : null;
  const herd = [0, 1, 2, 3].map(i => ({ x: 0.1 + i * 0.07, y: 0.1, trail: [] }));
  const bend = { x: 0, y: 0 };
  if (!glyph) {
    canvas.onpointermove = e => {
      const r = canvas.getBoundingClientRect();
      bend.x = (e.clientX - r.left) / r.width - 0.5;
      bend.y = (e.clientY - r.top) / r.height - 0.5;
    };
    canvas.onpointerleave = () => { bend.x = 0; bend.y = 0; };
  }
  function attract(s) {
    const wobble = glyph ? 0 : Math.sin(performance.now() / 2800) * 0.08;
    if (p.family === "dejong") {
      s.x = Math.sin((p.a + wobble) * s.y) - Math.cos(p.b * s.x);
      s.y = Math.sin(p.c * s.x) - Math.cos((p.d - wobble) * s.y);
    } else {
      s.x = Math.sin(p.a * s.y) + (p.c + wobble) * Math.cos(p.a * s.x);
      s.y = Math.sin(p.b * s.x) + p.d * Math.cos(p.b * s.y);
    }
  }
  function frame(t) {
    if (token !== job || !canvas.isConnected) return;
    ctx.fillStyle = "rgba(12,11,9,0.18)";
    ctx.fillRect(0, 0, w, h);
    if (p.family === "superformula") {
      const spin = reduce ? 0 : t * 0.00035;
      const breath = 0.86 + Math.sin(t / 900) * 0.08;
      const rings = glyph ? 2 : 4;
      for (let ring = 0; ring < rings; ring++) {
        const m = (p.a || 5) + ring * 0.35;
        const n2 = Math.abs(p.c) + 0.4 + Math.sin(t / 1400 + ring) * 0.55;
        const n3 = Math.abs(p.d) + 0.4 + Math.cos(t / 1600 + ring) * 0.55;
        ctx.beginPath();
        for (let i = 0; i <= 480; i++) {
          const phi = i / 480 * Math.PI * 2 + spin * (1 + ring * 0.15);
          const [sx, sy] = superPoint(m, Math.abs(p.b) + 0.4, n2, n3, phi);
          const px = w / 2 + (sx * breath + bend.x * 0.4) * w * (0.12 + ring * 0.025);
          const py = h / 2 + (sy * breath + bend.y * 0.4) * h * (0.12 + ring * 0.025);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.lineWidth = glyph ? 1.2 : 1.6 + ring * 0.4;
        ctx.strokeStyle = ring === rings - 1 ? "#C8A24B" : "rgba(233,229,220," + (0.28 + ring * 0.12) + ")";
        ctx.stroke();
      }
    } else if (p.family === "littlewood") {
      const spin = reduce ? 0 : t * 0.0003;
      const pts = roots.map((z, i) => {
        const ang = Math.atan2(z[1], z[0]) + spin * (0.7 + (i % 5) * 0.08);
        const rad = Math.hypot(z[0], z[1]) * (1 + Math.sin(t / 1100 + i) * 0.06);
        return [w / 2 + Math.cos(ang) * rad * w * 0.36 + bend.x * 18, h / 2 + Math.sin(ang) * rad * h * 0.36 + bend.y * 18];
      });
      ctx.lineWidth = glyph ? 0.6 : 1;
      for (let i = 0; i < pts.length; i += 3) {
        const a = pts[i], b = pts[(i + 5) % pts.length];
        ctx.strokeStyle = "rgba(200,162,75,0.28)";
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      const pulse = Math.floor((t / 180) % pts.length);
      pts.forEach((q, i) => {
        ctx.beginPath();
        ctx.fillStyle = i === pulse ? "#C8A24B" : "#E9E5DC";
        ctx.arc(q[0], q[1], glyph ? 1.4 : (i === pulse ? 5 : 2.4), 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      const count = glyph ? 1 : 4;
      herd.slice(0, count).forEach((s, i) => {
        const steps = glyph ? 12 : 28;
        ctx.beginPath();
        for (let k = 0; k < steps; k++) {
          attract(s);
          const px = ((s.x + 2.5) / 5) * (w - 20) + 10 + bend.x * 12;
          const py = ((s.y + 2.5) / 5) * (h - 20) + 10 + bend.y * 12;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          s.trail.push(px, py);
          if (s.trail.length > 80) s.trail.splice(0, 2);
        }
        ctx.strokeStyle = i === 0 ? "#C8A24B" : "rgba(233,229,220,0.55)";
        ctx.lineWidth = i === 0 ? (glyph ? 1.2 : 1.8) : 1;
        ctx.stroke();
      });
    }
    const bar = document.querySelector(".progress span");
    if (bar) bar.style.width = "100%";
    if (!reduce) requestAnimationFrame(frame);
  }
  ctx.fillStyle = "#0C0B09";
  ctx.fillRect(0, 0, w, h);
  requestAnimationFrame(frame);
}
boot();
