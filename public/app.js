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
  return Math.max(0.1, Math.min(4.4, r));
}
function dustRoots() {
  const roots = [];
  let s = 2166136261;
  for (let k = 0; k < 140; k++) {
    s = Math.imul(s ^ (k + 11), 16777619);
    const ang = (k / 140) * Math.PI * 2 * 3 + ((s & 31) / 40);
    const rad = 0.12 + ((s >>> 5) & 63) / 52;
    roots.push([ang, rad]);
  }
  return roots;
}
function animate(canvas, p, glyph) {
  const token = ++job;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const roots = p.family === "littlewood" ? dustRoots() : null;
  const herd = [0, 1, 2, 3, 4, 5].map(i => ({ x: 0.08 * i, y: 0.12, trail: [] }));
  const bend = { x: 0, y: 0 };
  if (!glyph) {
    canvas.onpointermove = canvas.onpointerdown = e => {
      const r = canvas.getBoundingClientRect();
      bend.x = (e.clientX - r.left) / r.width - 0.5;
      bend.y = (e.clientY - r.top) / r.height - 0.5;
    };
    canvas.onpointerleave = canvas.onpointerup = () => { bend.x *= 0.4; bend.y *= 0.4; };
  }
  function attract(s, wobble) {
    if (p.family === "dejong") {
      const nx = Math.sin((p.a + wobble) * s.y) - Math.cos(p.b * s.x);
      const ny = Math.sin(p.c * s.x) - Math.cos((p.d - wobble) * s.y);
      s.x = nx; s.y = ny;
    } else {
      const nx = Math.sin(p.a * s.y) + (p.c + wobble) * Math.cos(p.a * s.x);
      const ny = Math.sin(p.b * s.x) + p.d * Math.cos(p.b * s.y);
      s.x = nx; s.y = ny;
    }
  }
  function frame(t) {
    if (token !== job || !canvas.isConnected) return;
    ctx.fillStyle = glyph ? "rgba(12,11,9,0.28)" : "rgba(12,11,9,0.12)";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2 + bend.x * 16, cy = h / 2 + bend.y * 16;
    if (p.family === "superformula") {
      const spin = reduce ? 0 : t * 0.00028;
      const rings = glyph ? 3 : 7;
      const steps = glyph ? 180 : 640;
      for (let ring = 0; ring < rings; ring++) {
        const m = (p.a || 5) + Math.sin(t / 2200) * 0.8 + ring * 0.22;
        const n2 = Math.abs(p.c) + 0.35 + Math.sin(t / 1300 + ring) * 0.7;
        const n3 = Math.abs(p.d) + 0.35 + Math.cos(t / 1500 + ring) * 0.7;
        const scale = (0.07 + ring * 0.018) * (0.92 + Math.sin(t / 1000 + ring) * 0.05);
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const phi = i / steps * Math.PI * 2 + spin * (1 + ring * 0.08);
          const r = superPoint(m, Math.abs(p.b) + 0.35, n2, n3, phi);
          const px = cx + Math.cos(phi) * r * w * scale;
          const py = cy + Math.sin(phi) * r * h * scale;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.lineWidth = ring === rings - 1 ? (glyph ? 1.4 : 2.2) : 0.7;
        ctx.strokeStyle = ring === rings - 1 ? "#C8A24B" : "rgba(233,229,220," + (0.18 + ring * 0.08) + ")";
        ctx.stroke();
      }
      if (!glyph) {
        const spark = (t / 400) % 1;
        for (let s = 0; s < 8; s++) {
          const phi = (spark + s / 8) * Math.PI * 2 + spin;
          const r = superPoint(p.a || 5, Math.abs(p.b) + 0.35, Math.abs(p.c) + 0.5, Math.abs(p.d) + 0.5, phi);
          ctx.fillStyle = "#C8A24B";
          ctx.beginPath();
          ctx.arc(cx + Math.cos(phi) * r * w * 0.16, cy + Math.sin(phi) * r * h * 0.16, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (p.family === "littlewood") {
      const spin = reduce ? 0 : t * 0.00022;
      const pts = roots.map((z, i) => {
        const ang = z[0] + spin * (0.6 + (i % 7) * 0.05);
        const rad = z[1] * (1 + Math.sin(t / 900 + i * 0.4) * 0.08);
        return [cx + Math.cos(ang) * rad * w * 0.4, cy + Math.sin(ang) * rad * h * 0.4];
      });
      ctx.beginPath();
      ctx.strokeStyle = "rgba(233,229,220,0.12)";
      ctx.arc(cx, cy, w * 0.28, 0, Math.PI * 2);
      ctx.stroke();
      const hop = 4 + Math.floor((t / 700) % 5);
      ctx.lineWidth = 0.8;
      for (let i = 0; i < pts.length; i += glyph ? 6 : 2) {
        const a = pts[i], b = pts[(i + hop) % pts.length];
        const dx = a[0] - b[0], dy = a[1] - b[1];
        if (dx * dx + dy * dy > w * w * 0.08) continue;
        ctx.strokeStyle = i % 11 === 0 ? "rgba(200,162,75,0.45)" : "rgba(233,229,220,0.22)";
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      const pulse = Math.floor((t / 120) % pts.length);
      pts.forEach((q, i) => {
        const near = Math.abs(i - pulse) < 4 || Math.abs(i - pulse) > pts.length - 4;
        ctx.fillStyle = near ? "#C8A24B" : "#E9E5DC";
        ctx.beginPath();
        ctx.arc(q[0], q[1], glyph ? 1.2 : (near ? 3.4 : 1.6), 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      const wobble = glyph ? 0 : Math.sin(t / 2400) * 0.12;
      const count = glyph ? 2 : 6;
      herd.slice(0, count).forEach((s, i) => {
        const steps = glyph ? 10 : 36;
        for (let k = 0; k < steps; k++) {
          attract(s, wobble);
          const px = ((s.x + 2.6) / 5.2) * (w - 24) + 12 + bend.x * 20;
          const py = ((s.y + 2.6) / 5.2) * (h - 24) + 12 + bend.y * 20;
          s.trail.push(px, py);
        }
        const cap = glyph ? 40 : 220;
        if (s.trail.length > cap) s.trail.splice(0, s.trail.length - cap);
        for (let k = 2; k < s.trail.length; k += 2) {
          const a = (k / s.trail.length);
          ctx.strokeStyle = i === 0 ? "rgba(200,162,75," + a + ")" : "rgba(233,229,220," + (a * 0.55) + ")";
          ctx.lineWidth = i === 0 ? 1.6 : 0.8;
          ctx.beginPath();
          ctx.moveTo(s.trail[k - 2], s.trail[k - 1]);
          ctx.lineTo(s.trail[k], s.trail[k + 1]);
          ctx.stroke();
        }
        const hx = s.trail[s.trail.length - 2], hy = s.trail[s.trail.length - 1];
        ctx.fillStyle = i === 0 ? "#C8A24B" : "#E9E5DC";
        ctx.beginPath();
        ctx.arc(hx, hy, i === 0 ? 3.2 : 1.6, 0, Math.PI * 2);
        ctx.fill();
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
