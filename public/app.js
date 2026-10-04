const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const main = document.getElementById("main");
let plates = [];
let pointer = { x: 0.5, y: 0.5, hot: 0 };
let scrollT = 0;

async function boot() {
  plates = await fetch("/plates.json").then(r => r.json());
  addEventListener("pointermove", e => {
    pointer.x = e.clientX / innerWidth;
    pointer.y = e.clientY / innerHeight;
    pointer.hot = 1;
  });
  addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    scrollT = h > 0 ? scrollY / h : 0;
    const bar = document.querySelector(".progress span");
    if (bar) bar.style.width = (scrollT * 100) + "%";
  }, { passive: true });
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
  addEventListener("keydown", e => {
    if (e.target.matches("input,button")) return;
    const id = location.pathname.split("/").pop();
    const i = plates.findIndex(p => p.id === id);
    if (e.key === "j" || e.key === "ArrowDown") go(i + 1);
    if (e.key === "k" || e.key === "ArrowUp") go(i - 1);
  });
  render();
}
function go(i) {
  if (i < 0 || i >= plates.length) return;
  history.pushState({}, "", "/p/" + plates[i].id);
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
  const id = path.startsWith("/p/") ? path.slice(3) : plates[0].id;
  const plate = plates.find(p => p.id === id) || plates[0];
  if (path.startsWith("/p/") && plate.id !== id) history.replaceState({}, "", "/p/" + plate.id);
  stage(plate);
}
function stage(p) {
  main.innerHTML = `
    <div class="stage">
      <section>
        <canvas id="plate" width="1080" height="1080" aria-label="${p.family} plate"></canvas>
        <p class="law">${p.eq}</p>
        <div class="meta"><span>${p.family} · ${p.seed}</span><span>a ${p.a} · b ${p.b} · c ${p.c} · d ${p.d}</span></div>
        <div class="progress" aria-hidden="true"><span></span></div>
      </section>
      <aside class="rail">
        <h1>Register</h1>
        <ol class="ledger">${plates.map(item => `
          <li><a href="/p/${item.id}" ${item.id===p.id?"aria-current=page":""}>
            <span>${item.family}</span><span>${item.status}</span>
            <small>${item.id} · ${item.a}, ${item.b}, ${item.c}, ${item.d}</small>
          </a></li>`).join("")}</ol>
      </aside>
    </div>`;
  document.title = p.family + " — Equation Plates";
  draw(document.getElementById("plate"), p);
}
function archive() {
  const families = ["all", ...new Set(plates.map(p => p.family))];
  main.innerHTML = `
    <section class="archive">
      <div class="filter">${families.map((f,i) => `<button data-fam="${f}" aria-pressed="${i===0}">${f}</button>`).join("")}</div>
      <table><thead><tr><th>Id</th><th>Family</th><th>Params</th><th>Status</th></tr></thead>
      <tbody>${rows("all")}</tbody></table>
    </section>`;
  document.title = "Archive — Equation Plates";
  main.querySelectorAll("button").forEach(btn => btn.onclick = () => {
    main.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b===btn));
    main.querySelector("tbody").innerHTML = rows(btn.dataset.fam);
  });
}
function rows(fam) {
  return plates.filter(p => fam==="all" || p.family===fam).map(p =>
    `<tr><td><a href="/p/${p.id}">${p.id}</a></td><td>${p.family}</td><td>${p.a}, ${p.b}, ${p.c}, ${p.d}</td><td>${p.status}</td></tr>`
  ).join("");
}
function draw(canvas, p) {
  const ctx = canvas.getContext("2d", { alpha:false });
  const w = canvas.width, h = canvas.height;
  const bins = new Uint32Array(w * h);
  let x = 0.1, y = 0.1, n = 0;
  const total = reduce ? 90000 : 220000;
  const step = () => {
    if (p.family === "dejong") {
      const nx = Math.sin(p.a*y) - Math.cos(p.b*x);
      const ny = Math.sin(p.c*x) - Math.cos(p.d*y);
      x = nx; y = ny;
    } else if (p.family === "superformula") {
      const phi = (n / total) * Math.PI * 2 * 6;
      const m = p.a, n1 = Math.abs(p.b)+0.2, n2 = Math.abs(p.c)+0.3, n3 = Math.abs(p.d)+0.3;
      const r = Math.pow(Math.abs(Math.cos(m*phi/4))**n2 + Math.abs(Math.sin(m*phi/4))**n3, -1/n1);
      x = r * Math.cos(phi); y = r * Math.sin(phi);
    } else if (p.family === "littlewood") {
      const t = n / total;
      x = Math.cos(t * Math.PI * 2) * (0.7 + 0.3*Math.sin(p.a * t));
      y = Math.sin(t * Math.PI * 2) * (0.7 + 0.3*Math.cos(p.a * t));
    } else {
      const nx = Math.sin(p.a*y) + p.c*Math.cos(p.a*x);
      const ny = Math.sin(p.b*x) + p.d*Math.cos(p.b*y);
      x = nx; y = ny;
    }
  };
  for (let i = 0; i < 800; i++) step();
  let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9;
  const probe = [];
  for (let i = 0; i < 4000; i++) { step(); probe.push(x,y); }
  for (let i = 0; i < probe.length; i+=2) {
    minx=Math.min(minx,probe[i]); maxx=Math.max(maxx,probe[i]);
    miny=Math.min(miny,probe[i+1]); maxy=Math.max(maxy,probe[i+1]);
  }
  const paint = () => {
    const img = ctx.createImageData(w, h);
    const hx = pointer.x, hy = pointer.y;
    for (let i = 0; i < bins.length; i++) {
      const k = Math.min(1, Math.log1p(bins[i]) / Math.log1p(28));
      const px = (i % w) / w, py = Math.floor(i / w) / h;
      const d = Math.hypot(px - hx, py - hy);
      const react = pointer.hot ? Math.max(0, 1 - d * 2.4) * 0.35 : 0;
      const ink = k * (0.75 + scrollT * 0.25) + react * k;
      const o = i * 4;
      img.data[o] = 12 + ink * 200;
      img.data[o+1] = 11 + ink * 150;
      img.data[o+2] = 9 + ink * 60;
      img.data[o+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  };
  const chunk = reduce ? total : 5000;
  function tick() {
    if (!canvas.isConnected) return;
    const end = Math.min(total, n + chunk);
    for (; n < end; n++) {
      step();
      const px = ((x - minx) / (maxx - minx + 1e-6)) * (w - 16) + 8;
      const py = ((y - miny) / (maxy - miny + 1e-6)) * (h - 16) + 8;
      const ix = px|0, iy = py|0;
      if (ix>=0 && iy>=0 && ix<w && iy<h) bins[iy*w+ix]++;
    }
    paint();
    const bar = document.querySelector(".progress span");
    if (bar) bar.style.width = Math.max(scrollT, n/total) * 100 + "%";
    if (n < total) requestAnimationFrame(tick);
    else listen();
  }
  function listen() {
    if (reduce) return;
    canvas.onpointermove = e => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width;
      pointer.y = (e.clientY - r.top) / r.height;
      pointer.hot = 1;
      paint();
    };
    canvas.onpointerleave = () => { pointer.hot = 0; paint(); };
  }
  tick();
}
boot();
