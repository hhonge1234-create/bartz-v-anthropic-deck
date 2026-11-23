/* Bartz v. Anthropic 슬라이드 엔진 v3 — anime.js 3.2.2
 * → / 스페이스 / 클릭: 다음 단계(단계가 끝나면 다음 장) · ←: 이전 장
 * N: 발표자 노트 · ?static=1: 모든 단계가 공개된 최종 상태(검수용) · #n: n번째 장
 */
(() => {
  "use strict";
  const F = window.FACTS;
  const STATIC = new URLSearchParams(location.search).has("static");
  if (STATIC) document.body.classList.add("static");

  const C = { ink: "#16181d", ink2: "#3f4452", ink3: "#757a87", rule: "#dcd5c6", paper: "#f7f4ee", card: "#fffdf9",
    red: "#b8322a", green: "#2f7a55", gold: "#b07d1a", blue: "#2c5ec4", gray: "#a7abb4" };
  const TINT = { red: "rgba(184,50,42,.13)", green: "rgba(47,122,85,.14)", gold: "rgba(176,125,26,.16)",
    blue: "rgba(44,94,196,.12)", gray: "rgba(120,125,140,.14)" };

  /* ── 데이터 ───────────────────────────────────── */
  const get = (p) => p.split(".").reduce((o, k) => o[k], F).value;
  const FMT = {
    int: (v) => Math.round(v).toLocaleString("en-US"),
    usd0: (v) => "$" + Math.round(v).toLocaleString("en-US"),
    usdB: (v) => "$" + (v / 1e9).toFixed(1) + "B",
    pct: (v) => v.toFixed(1) + "%",
    raw: (v) => String(v),
  };
  const fmtOf = (el) => FMT[el.dataset.fmt || "raw"];
  document.querySelectorAll("[data-v]").forEach((el) => { el.textContent = fmtOf(el)(get(el.dataset.v)); });
  const remain = get("settlement.fund") - get("fees.awarded") - get("fees.expenses") - get("fees.cost_reserve") - get("fees.service_awards_total");
  document.querySelectorAll("#perWork").forEach((el) => { el.textContent = FMT.int(remain / get("claims.claimed_works")); });

  /* ── 애니메이션 도우미 ─────────────────────────── */
  const run = (a) => { if (STATIC) a.seek(a.duration); else a.play(); return a; };
  const A = (p) => run(anime(Object.assign({ easing: "easeOutCubic", duration: 650 }, p, { autoplay: false })));
  const TL = () => anime.timeline({ easing: "easeOutCubic", duration: 600, autoplay: false });
  const NS = "http://www.w3.org/2000/svg";
  const S = (tag, attrs, parent, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  const T = (parent, x, y, text, o = {}) => S("text", Object.assign({ x, y, fill: C.ink, "font-size": 24 }, o), parent, text);
  const arrow = (svg, id, color) => {
    const d = S("defs", {}, svg), m = S("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, d);
    S("path", { d: "M0 0L10 5L0 10z", fill: color }, m);
  };
  const once = (() => { const done = new Set(); return (k, fn) => { if (!done.has(k)) { done.add(k); fn(); } }; })();

  function counters(root) {
    root.querySelectorAll(".count[data-v]").forEach((el, i) => {
      const target = get(el.dataset.v), f = fmtOf(el), o = { v: 0 };
      if (STATIC) { el.textContent = f(target); return; }
      A({ targets: o, v: target, duration: 1500, delay: 150 + i * 150, easing: "easeOutExpo",
        update: () => { el.textContent = f(o.v); }, complete: () => { el.textContent = f(target); } });
    });
  }
  const show = (els, base = 0) => {
    if (!els.length) return;
    A({ targets: els, opacity: [0, 1], translateY: [22, 0], delay: anime.stagger(130, { start: base }), duration: 600 });
  };

  /* ── 저울 ──────────────────────────────────────── */
  function makeScale(svg) {
    const P = { x: 450, y: 120 }, L = 290, HANG = 120, SHELF = 455;
    const names = ["목적·성격", "저작물 성격", "이용한 양", "시장 영향"];
    const big = [true, false, false, true];
    const sz = (i) => (big[i] ? 70 : 54);
    S("path", { d: `M${P.x} ${P.y} L${P.x} 430 M${P.x - 70} 440 H${P.x + 70}`, stroke: C.ink2, "stroke-width": 6, fill: "none", "stroke-linecap": "round" }, svg);
    const beam = S("line", { stroke: C.ink, "stroke-width": 7, "stroke-linecap": "round" }, svg);
    S("circle", { cx: P.x, cy: P.y, r: 11, fill: C.gold }, svg);
    const mk = (color, label) => {
      const g = S("g", {}, svg);
      const s1 = S("line", { stroke: C.ink3, "stroke-width": 2 }, g), s2 = S("line", { stroke: C.ink3, "stroke-width": 2 }, g);
      const pan = S("path", { fill: TINT[color], stroke: C[color], "stroke-width": 4 }, g);
      const lab = T(g, 0, 0, label, { "text-anchor": "middle", "font-size": 27, "font-weight": 800, fill: C[color] });
      return { s1, s2, pan, lab, items: [] };
    };
    const left = mk("green", "공정이용 쪽"), right = mk("red", "저작권자 쪽");
    S("line", { x1: 60, y1: SHELF, x2: 840, y2: SHELF, stroke: C.rule, "stroke-width": 3 }, svg);
    const shelfX = [150, 350, 550, 750];
    const W = names.map((n, i) => {
      const g = S("g", { class: "wt" }, svg), s = sz(i);
      const r = S("rect", { x: -s / 2, y: -s, width: s, height: s, rx: 8, fill: C.ink2 }, g);
      T(g, 0, -s / 2 + 10, String(i + 1), { "text-anchor": "middle", "font-size": 30, "font-weight": 900, fill: "#fff" });
      const lab = T(svg, shelfX[i], SHELF + 36, names[i], { "text-anchor": "middle", "font-size": 27, "font-weight": 700, fill: C.ink2 });
      return { g, r, lab, i, x: shelfX[i], y: SHELF, s, side: null };
    });
    const st = { a: 0 };
    const ends = () => { const r = (st.a * Math.PI) / 180;
      return { lx: P.x - L * Math.cos(r), ly: P.y - L * Math.sin(r), rx: P.x + L * Math.cos(r), ry: P.y + L * Math.sin(r) }; };
    const slot = (k, n, cx, cy) => ({ x: cx + (k - (n - 1) / 2) * 76, y: cy - 2 });
    const place = (w) => w.g.setAttribute("transform", `translate(${w.x},${w.y})`);
    function render() {
      const e = ends();
      beam.setAttribute("x1", e.lx); beam.setAttribute("y1", e.ly); beam.setAttribute("x2", e.rx); beam.setAttribute("y2", e.ry);
      [[left, e.lx, e.ly], [right, e.rx, e.ry]].forEach(([p, x, y]) => {
        const py = y + HANG;
        p.s1.setAttribute("x1", x); p.s1.setAttribute("y1", y); p.s1.setAttribute("x2", x - 120); p.s1.setAttribute("y2", py);
        p.s2.setAttribute("x1", x); p.s2.setAttribute("y1", y); p.s2.setAttribute("x2", x + 120); p.s2.setAttribute("y2", py);
        p.pan.setAttribute("d", `M${x - 130} ${py} Q${x} ${py + 46} ${x + 130} ${py} Z`);
        p.lab.setAttribute("x", x); p.lab.setAttribute("y", py + 62);
        p.items.forEach((w, k) => { const s = slot(k, p.items.length, x, py); w.x = s.x; w.y = s.y; place(w); });
      });
      W.forEach((w) => { if (!w.side) place(w); });
    }
    const target = () => {
      const val = (p) => p.items.reduce((s, w) => s + (big[w.i] ? 1.5 : 1), 0);
      return Math.max(-14, Math.min(14, (val(right) - val(left)) * 5));
    };
    render();
    return {
      drop(i, side) {
        const w = W[i];
        if (side === "n") {
          w.r.setAttribute("fill", C.gray); w.lab.textContent = names[i] + " · 중립"; w.lab.setAttribute("fill", C.ink3); return;
        }
        const pan = side === "g" ? left : right;
        w.r.setAttribute("fill", side === "g" ? C.green : C.red);
        w.lab.setAttribute("fill", side === "g" ? C.green : C.red);
        const e = ends(), cx = side === "g" ? e.lx : e.rx, cy = (side === "g" ? e.ly : e.ry) + HANG;
        const dest = slot(pan.items.length, pan.items.length + 1, cx, cy);
        const finish = () => {
          w.side = side; pan.items.push(w);
          if (STATIC) { st.a = target(); render(); return; }
          const o = { a: st.a };
          anime({ targets: o, a: target(), duration: 900, easing: "easeOutElastic(1, .6)", update: () => { st.a = o.a; render(); } });
        };
        if (STATIC) { finish(); return; }
        const o = { x: w.x, y: w.y };
        anime({ targets: o, x: dest.x, y: dest.y, duration: 650, easing: "easeInOutQuad",
          update: () => { w.x = o.x; w.y = o.y; place(w); }, complete: finish });
      },
      highlight(idx) { idx.forEach((i) => A({ targets: W[i].r, fill: [C.ink2, C.gold], duration: 500 })); },
    };
  }

  /* ── 슬라이드별 연출: enter(s) / step(s, k) ───────── */
  const ANIM = {
    cover: { enter(s) {
      const svg = s.querySelector("#spines");
      once("spines", () => {
        const cols = [C.gold, C.ink, C.green, C.ink2, C.red, C.gold, C.ink, C.green, C.red, C.ink2, C.gold, C.ink, C.red, C.green, C.ink2, C.gold, C.ink, C.red];
        cols.forEach((c, i) => { const h = 170 + ((i * 41) % 120);
          S("rect", { class: "spine", x: 4 + i * 26, y: 330 - h, width: 20, height: h, rx: 3, fill: c, opacity: 0.9 }, svg); });
      });
      A({ targets: svg.querySelectorAll(".spine"), translateY: [360, 0], delay: anime.stagger(50), duration: 900, easing: "easeOutBack" });
    } },

    scaleIntro: {
      enter(s) { if (!s._sc) s._sc = makeScale(s.querySelector("svg.scale")); },
      step(s, k) { if (k === 1) s._sc.highlight([0, 3]); },
    },

    verdict: {
      enter(s) {
        const svg = s.querySelector("svg.scale");
        svg.innerHTML = "";
        s._sc = makeScale(svg);
      },
      step(s, k) { const v = s.dataset.verdicts.split(","); if (k >= 1 && k <= 4) s._sc.drop(k - 1, v[k - 1]); },
    },

    pirate: { enter(s) {
      const svg = s.querySelector("#pirateSvg"), base = 410, H = 330, max = 5400000;
      const data = [["Books3", "pirated.books3", "2021.1–2", false], ["LibGen", "pirated.libgen", "2021.6", true], ["PiLiMi", "pirated.pilimi", "2022.7", true]];
      once("pirate", () => {
        data.forEach(([n, key, d, plus], i) => {
          const v = get(key), x = 70 + i * 260, h = (v / max) * H;
          S("rect", { class: "bar", x, y: base - h, width: 180, height: h, rx: 6, fill: C.red }, svg);
          T(svg, x + 90, base - h - 16, FMT.int(v) + (plus ? "+" : ""), { class: "bl", "text-anchor": "middle", "font-size": 30, "font-weight": 900 });
          T(svg, x + 90, base + 40, n, { "text-anchor": "middle", "font-size": 28, "font-weight": 800 });
          T(svg, x + 90, base + 74, d, { "text-anchor": "middle", "font-size": 24, fill: C.ink3 });
        });
        svg.querySelectorAll(".bar").forEach((b) => { b.style.transformOrigin = `0 ${base}px`; b.style.transformBox = "view-box"; });
      });
      A({ targets: svg.querySelectorAll(".bar"), scaleY: [0, 1], delay: anime.stagger(250), duration: 1100, easing: "easeOutQuart" });
      A({ targets: svg.querySelectorAll(".bl"), opacity: [0, 1], delay: anime.stagger(250, { start: 800 }), duration: 400 });
    } },

    library: { enter(s) {
      const svg = s.querySelector("#libSvg"), cols = 70, rows = 40, c = 11;
      once("library", () => {
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++)
          S("rect", { class: "cell", x: q * c, y: r * c, width: c - 2, height: c - 2, fill: C.red, opacity: 0 }, svg);
      });
      const cells = svg.querySelectorAll(".cell");
      if (STATIC) { cells.forEach((e) => e.setAttribute("opacity", 0.85)); return; }
      cells.forEach((e) => e.setAttribute("opacity", 0));
      anime({ targets: cells, opacity: [0, 0.85], duration: 200, delay: anime.stagger(1, { grid: [cols, rows], from: "first" }), easing: "linear" });
    } },

    split: {
      enter(s) {
        const svg = s.querySelector("#splitSvg");
        once("split", () => {
          arrow(svg, "spA", C.ink3);
          const g = S("g", { class: "one" }, svg);
          S("rect", { x: 354, y: 10, width: 700, height: 100, rx: 16, fill: TINT.gold, stroke: C.gold, "stroke-width": 3 }, g);
          T(g, 704, 72, "앤트로픽: 모두 ‘학습’이라는 하나의 이용", { "text-anchor": "middle", "font-size": 30, "font-weight": 800 });
          [["학습용 사본", "새 글을 만드는 LLM 학습", "green"], ["구매본 스캔", "종이 → 디지털 형식 변환", "green"], ["해적판 도서관", "‘모든 책’을 ‘영원히’ 보관", "red"]].forEach(([n, d, c], i) => {
            const x = 4 + i * 470;
            S("path", { class: "lk", d: `M704 110 C704 180, ${x + 200} 170, ${x + 200} 236`, fill: "none", stroke: C.ink3, "stroke-width": 3, "marker-end": "url(#spA)" }, svg);
            const b = S("g", { class: "three" }, svg);
            S("rect", { x, y: 244, width: 400, height: 140, rx: 16, fill: TINT[c], stroke: C[c], "stroke-width": 3 }, b);
            T(b, x + 200, 304, `${"①②③"[i]} ${n}`, { "text-anchor": "middle", "font-size": 32, "font-weight": 900 });
            T(b, x + 200, 350, d, { "text-anchor": "middle", "font-size": 24, fill: C.ink2 });
          });
        });
        svg.querySelectorAll(".lk,.three").forEach((e) => { e.style.opacity = STATIC ? 1 : 0; });
        A({ targets: svg.querySelector(".one"), opacity: [0, 1], scale: [0.92, 1], duration: 600 });
      },
      step(s, k) {
        if (k !== 1) return;
        const svg = s.querySelector("#splitSvg"), tl = TL();
        tl.add({ targets: svg.querySelectorAll(".lk"), opacity: [0, 1], strokeDashoffset: [anime.setDashoffset, 0], delay: anime.stagger(150), duration: 700 })
          .add({ targets: svg.querySelectorAll(".three"), opacity: [0, 1], translateY: [24, 0], delay: anime.stagger(150) }, "-=300");
        run(tl);
      },
    },

    board: { enter(s) {
      const cells = s.querySelectorAll("td[data-c]");
      cells.forEach((td) => { td.style.background = "transparent"; td.style.color = C.ink3; });
      A({ targets: cells, backgroundColor: (el) => TINT[el.dataset.c], color: (el) => C[el.dataset.c], delay: anime.stagger(80, { start: 300 }), duration: 450 });
    } },

    video: { enter(s) {
      const v = s.querySelector("video");
      if (STATIC) { v.pause(); return; }
      v.currentTime = 0; v.play().catch(() => {});
      if (!v.dataset.bound) { v.dataset.bound = 1; v.addEventListener("click", (e) => { e.stopPropagation(); v.currentTime = 0; v.play(); }); }
    } },

    timeline: {
      enter(s) {
        const svg = s.querySelector("#tlSvg");
        const ev = [
          ["2024.8", "집단소송 제기", C.ink],
          ["2025.6.23", "공정이용 판결", C.gold],
          ["2025.7.17", "집단 인증", C.ink],
          ["2025.9.25", "합의 예비승인", C.gold],
          ["2025.12.31", "알섭 판사 물러남 → 새 판사", C.blue],
          ["2026.7.20", "최종승인·종결", C.gold],
        ];
        once("timeline", () => {
          const y = 230, x0 = 120, x1 = 1280, step = (x1 - x0) / (ev.length - 1);
          S("line", { class: "axis", x1: x0, y1: y, x2: x1, y2: y, stroke: C.ink, "stroke-width": 5, "stroke-linecap": "round" }, svg);
          ev.forEach(([d, label, c], i) => {
            const x = x0 + i * step, up = i % 2 === 0, g = S("g", { class: "ev" }, svg);
            S("circle", { cx: x, cy: y, r: 16, fill: c === C.ink ? C.paper : c, stroke: c, "stroke-width": 5 }, g);
            const ty = up ? y - 92 : y + 72;
            T(g, x, ty, d, { "text-anchor": "middle", "font-size": 26, "font-weight": 900, fill: c === C.ink ? C.ink : c });
            label.split(" → ").forEach((w, j) => T(g, x, ty + 36 + j * 32, (j ? "→ " : "") + w, { "text-anchor": "middle", "font-size": 24, "font-weight": 700, fill: C.ink2 }));
          });
        });
        svg.querySelectorAll(".ev").forEach((e) => { e.style.opacity = STATIC ? 1 : 0; });
        A({ targets: svg.querySelector(".axis"), strokeDashoffset: [anime.setDashoffset, 0], duration: 1200, easing: "easeInOutSine" });
        A({ targets: [...svg.querySelectorAll(".ev")].slice(0, 3), opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(220, { start: 500 }) });
      },
      step(s, k) {
        const evs = [...s.querySelectorAll("#tlSvg .ev")];
        if (k === 1) A({ targets: evs.slice(3), opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(260) });
      },
    },

    donut: { enter(s) {
      const svg = s.querySelector("#donutSvg"), r = 150, cx = 200, cy = 200, L = 2 * Math.PI * r, p = get("claims.claim_rate") / 100;
      once("donut", () => {
        S("circle", { cx, cy, r, fill: "none", stroke: "#e6e0d4", "stroke-width": 46 }, svg);
        S("circle", { class: "arc", cx, cy, r, fill: "none", stroke: C.green, "stroke-width": 46, "stroke-dasharray": `${L} ${L}`,
          "stroke-dashoffset": L, transform: `rotate(-90 ${cx} ${cy})` }, svg);
        T(svg, cx, cy + 6, FMT.pct(get("claims.claim_rate")), { "text-anchor": "middle", "font-size": 60, "font-weight": 900, fill: C.green });
        T(svg, cx, cy + 66, "작품 청구율", { "text-anchor": "middle", "font-size": 24, fill: C.ink2 });
      });
      A({ targets: svg.querySelector(".arc"), strokeDashoffset: [L, L * (1 - p)], duration: 1600, easing: "easeOutCubic" });
    } },
  };

  /* ── 엔진 ──────────────────────────────────────── */
  const stage = document.getElementById("stage");
  const slides = [...document.querySelectorAll(".slide")];
  const pager = document.getElementById("pager"), bar = document.getElementById("bar"), notes = document.getElementById("notes"), acts = document.getElementById("acts");
  const ACTS = ["도입", "배경지식", "당사자·사실", "청구", "판단", "진행·결말", "비교·정리"];
  ACTS.forEach((a) => { const sp = document.createElement("span"); sp.textContent = a; acts.appendChild(sp); });
  const stepsOf = (s) => Math.max(+(s.dataset.steps || 0), ...[...s.querySelectorAll("[data-step]")].map((e) => +e.dataset.step));
  let cur = -1, step = 0;

  function fit() { stage.style.transform = `scale(${Math.min(innerWidth / 1600, innerHeight / 900)})`; }
  addEventListener("resize", fit); fit();

  function doStep(s, k) {
    const els = [...s.querySelectorAll(`[data-step="${k}"]`)];
    show(els);
    els.forEach((e) => counters(e));
    const an = ANIM[s.dataset.anim];
    if (an && an.step) an.step(s, k);
  }

  function go(i, full) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (cur >= 0) { slides[cur].classList.remove("active"); slides[cur].querySelectorAll("video").forEach((v) => v.pause()); }
    cur = i; step = 0;
    const s = slides[i];
    anime.remove(s.querySelectorAll("*"));
    if (!STATIC) s.querySelectorAll("[data-step],[data-in]").forEach((e) => { e.style.opacity = 0; });
    s.classList.add("active");
    const an = ANIM[s.dataset.anim];
    if (an && an.enter) an.enter(s);
    const ins = s.querySelectorAll("[data-in]");
    show(ins, 150);
    ins.forEach((e) => counters(e));
    if (STATIC || full) while (step < stepsOf(s)) { step++; doStep(s, step); }
    const a = parseInt(s.dataset.act, 10);
    [...acts.children].forEach((sp, j) => sp.classList.toggle("on", j === a));
    acts.classList.toggle("hide", isNaN(a));
    pager.textContent = `${i + 1} / ${slides.length}`;
    bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    const n = s.querySelector("aside.notes");
    notes.innerHTML = `<h4>발표자 노트 · ${i + 1}</h4>` + (n ? n.innerHTML : "");
    if (location.hash !== `#${i + 1}`) history.replaceState(null, "", `#${i + 1}`);
  }
  function next() {
    const s = slides[cur];
    if (step < stepsOf(s)) { step++; doStep(s, step); } else if (cur < slides.length - 1) go(cur + 1);
  }
  const prev = () => { if (cur > 0) go(cur - 1, true); };

  addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "n" || e.key === "N") notes.classList.toggle("on");
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(slides.length - 1, true);
  });
  stage.addEventListener("click", (e) => {
    const r = stage.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.25) prev(); else next();
  });
  let tx = null;
  addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", (e) => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) (d < 0 ? next : prev)(); tx = null; });

  window.DECK = { go, next, count: slides.length, get cur() { return cur; }, get step() { return step; }, steps: (i) => stepsOf(slides[i]) };
  const start = () => { const n = parseInt(location.hash.slice(1), 10); go(isNaN(n) ? 0 : n - 1, !isNaN(n) && n > 1); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
