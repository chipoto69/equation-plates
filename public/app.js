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
  const edge = Math.min(900, Math.max(320, Math.floor(innerWidth * (devicePixelRatio || 1))));
  main.innerHTML = `<section class="sheet">
    <div class="navline"><a class="back" href="/">\u2039 Plates</a><span>${p.family}</span></div>
    <canvas id="plate" width="${edge}" height="${edge}" aria-label="${p.family}"></canvas>
    <p class="law">${p.eq}</p>
    <p class="meta">${p.id} \u00b7 ${p.status} \u00b7 a ${p.a} b ${p.b} c ${p.c} d ${p.d}</p>
    <div class="progress" aria-hidden="true"><span></span></div>
  </section>`;
  animate(document.getElementById("plate"), p, false);
}
function superPoint(p, phi) {
  const m = p.a || 5;
  const n1 = Math.abs(p.b) + 0.45;
  const n2 = Math.abs(p.c) + 0.45;
  const n3 = Math.abs(p.d) + 0.45;
  const r = Math.pow(Math.abs(Math.cos(m * phi / 4)) ** n2 + Math.abs(Math.sin(m * phi / 4)) ** n3 + 1e-4, -1 / n1);
  const rr = Math.max(0.15, Math.min(4, r));
  return [rr * Math.cos(phi), rr * Math.sin(phi)];
}
function dustRoots(p) {
  const deg = Math.max(8, Math.min(14, Math.round(Math.abs(p.a)) || 12));
  const roots = [];
  let s = 2166136261;
  for (let k = 0; k < 90; k++) {
    s = Math.imul(s ^ (k + 9), 16777619);
    const ang = (k / 90) * Math.PI * 2 + ((s & 15) / 40);
    const rad = 0.25 + ((s >>> 4) & 31) / 28;
    roots.push([rad * Math.cos(ang), rad * Math.sin(ang)]);
  }
  return roots;
}
function animate(canvas, p, glyph) {
  const token = ++job;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const roots = p.family === "littlewood" ? dustRoots(p) : null;
  let x = 0.1, y = 0.1, n = 0;
  const bins = new Uint16Array(w * h);
  const total = glyph ? 2500 : (reduce ? 20000 : 90000);
  function attract() {
    if (p.family === "dejong") {
      const nx = Math.sin(p.a * y) - Math.cos(p.b * x);
      const ny = Math.sin(p.c * x) - Math.cos(p.d * y);
      x = nx; y = ny;
    } else {
      const nx = Math.sin(p.a * y) + p.c * Math.cos(p.a * x);
      const ny = Math.sin(p.b * x) + p.d * Math.cos(p.b * y);
      x = nx; y = ny;
    }
    return [x, y];
  }
  function frame(t) {
    if (token !== job || !canvas.isConnected) return;
    ctx.fillStyle = "#0C0B09";
    ctx.fillRect(0, 0, w, h);
    if (p.family === "superformula") {
      const spin = reduce ? 0 : t * 0.0004;
      ctx.beginPath();
      for (let i = 0; i <= 720; i++) {
        const phi = i / 720 * Math.PI * 2 + spin;
        const [sx, sy] = superPoint(p, phi);
        const px = w / 2 + sx * w * 0.18;
        const py = h / 2 + sy * h * 0.18;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.lineWidth = glyph ? 2 : Math.max(3, w / 180);
      ctx.strokeStyle = "#C8A24B";
      ctx.stroke();
      ctx.lineWidth = glyph ? 1 : Math.max(1.5, w / 420);
      ctx.strokeStyle = "rgba(233,229,220,.55)";
      ctx.stroke();
    } else if (p.family === "littlewood") {
      const spin = reduce ? 0 : t * 0.00025;
      roots.forEach((z, i) => {
        const ang = Math.atan2(z[1], z[0]) + spin;
        const rad = Math.hypot(z[0], z[1]);
        const px = w / 2 + Math.cos(ang) * rad * w * 0.38;
        const py = h / 2 + Math.sin(ang) * rad * h * 0.38;
        const size = glyph ? 1.6 : 3 + (i % 4);
        ctx.beginPath();
        ctx.fillStyle = i % 7 === 0 ? "#C8A24B" : "#E9E5DC";
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      const add = glyph ? 400 : 1800;
      for (let i = 0; i < add && n < total; i++, n++) {
        const xy = attract();
        const px = ((xy[0] + 2.4) / 4.8) * (w - 16) + 8;
        const py = ((xy[1] + 2.4) / 4.8) * (h - 16) + 8;
        const ix = px | 0, iy = py | 0;
        if (ix >= 0 && iy >= 0 && ix < w && iy < h) bins[iy * w + ix]++;
      }
      const img = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < bins.length; i++) {
        const k = Math.min(1, Math.log1p(bins[i]) / Math.log1p(12));
        const o = i * 4;
        img.data[o] = 12 + k * 210;
        img.data[o+1] = 11 + k * 200;
        img.data[o+2] = 9 + k * 180;
        img.data[o+3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      const xy = [x, y];
      ctx.fillStyle = "#C8A24B";
      ctx.beginPath();
      ctx.arc(((xy[0] + 2.4) / 4.8) * (w - 16) + 8, ((xy[1] + 2.4) / 4.8) * (h - 16) + 8, glyph ? 1.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const bar = document.querySelector(".progress span");
    if (bar) bar.style.width = (p.family === "clifford" || p.family === "dejong" ? Math.min(100, n / total * 100) : 100) + "%";
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
boot();
