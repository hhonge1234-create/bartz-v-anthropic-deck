/* Bartz v. Anthropic 슬라이드 엔진 — anime.js 3.2.2
 * ?static=1 : 애니메이션 없이 최종 상태로 즉시 표시 (검수·캡처용)
 * #n        : n번째 슬라이드(1부터)
 */
(() => {
  "use strict";
  const F = window.FACTS;
  const STATIC = new URLSearchParams(location.search).has("static");
  if (STATIC) document.body.classList.add("static");

  const C = { ink: "#1d2230", ink2: "#4a5061", ink3: "#7b8090", rule: "#d9d2c3", paper: "#f6f3ec",
    red: "#b8322a", green: "#2f7a55", gold: "#b07d1a", blue: "#2c5ec4", gray: "#9aa0aa" };
  const TINT = { red: "rgba(184,50,42,.12)", green: "rgba(47,122,85,.13)", gold: "rgba(176,125,26,.15)",
    blue: "rgba(44,94,196,.12)", gray: "rgba(120,125,140,.12)" };

  /* ── 데이터 ─────────────────────────────────────────────── */
  const get = (path) => path.split(".").reduce((o, k) => o[k], F).value;
  const FMT = {
    int: (v) => Math.round(v).toLocaleString("en-US"),
    usd0: (v) => "$" + Math.round(v).toLocaleString("en-US"),
    usdB: (v) => "$" + (v / 1e9).toFixed(1) + "B",
    raw: (v) => String(v),
  };
  const fmtOf = (el) => FMT[el.dataset.fmt || "raw"];

  /* ── 애니메이션 도우미 ─────────────────────────────────── */
  const run = (a) => { if (STATIC) { a.seek(a.duration); } else { a.play(); } return a; };
  const A = (p) => run(anime(Object.assign({ easing: "easeOutCubic", duration: 700 }, p, { autoplay: false })));
  const TL = (p) => anime.timeline(Object.assign({ easing: "easeOutCubic", duration: 600 }, p, { autoplay: false }));
  const NS = "http://www.w3.org/2000/svg";
  const S = (tag, attrs, parent, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  const T = (parent, x, y, text, o = {}) => S("text", Object.assign({ x, y, fill: C.ink, "font-size": 20,
    "font-family": "Noto Sans KR, Apple SD Gothic Neo, sans-serif" }, o), parent, text);
  const arrowDefs = (svg, id, color) => {
    const d = S("defs", {}, svg);
    const m = S("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, d);
    S("path", { d: "M0 0L10 5L0 10z", fill: color }, m);
  };
  const built = new Set();
  const once = (key, fn) => { if (!built.has(key)) { built.add(key); fn(); } };

  /* ── 슬라이드 공통: 숫자 채우기 ────────────────────────── */
  document.querySelectorAll(".txt[data-v]").forEach((el) => { el.textContent = fmtOf(el)(get(el.dataset.v)); });
  document.querySelectorAll(".count[data-v]").forEach((el) => { el.textContent = fmtOf(el)(get(el.dataset.v)); });

  function counters(slide) {
    slide.querySelectorAll(".count[data-v]").forEach((el, i) => {
      const target = get(el.dataset.v), f = fmtOf(el), o = { v: 0 };
      A({ targets: o, v: target, duration: 1600, delay: 250 + i * 180, easing: "easeOutExpo",
        update: () => { el.textContent = f(o.v); }, complete: () => { el.textContent = f(target); } });
    });
  }
  function reveal(slide, base = 0) {
    const els = slide.querySelectorAll("[data-hide]");
    if (!els.length) return;
    A({ targets: els, opacity: [0, 1], translateY: [18, 0], delay: anime.stagger(140, { start: base }), duration: 650 });
  }

  /* ── 슬라이드별 연출 ──────────────────────────────────── */
  const ANIM = {
    reveal: (s) => { counters(s); reveal(s); },

    cover(s) {
      counters(s);
      const svg = s.querySelector("#spines");
      once("spines", () => {
        const cols = [C.gold, C.ink, C.green, C.ink2, C.red, C.gold, C.ink, C.green, C.red, C.ink2, C.gold, C.ink,
          C.red, C.green, C.ink2, C.gold, C.ink, C.red, C.green, C.ink];
        cols.forEach((c, i) => {
          const h = 150 + ((i * 37) % 110), w = 16;
          S("rect", { class: "spine", x: 6 + i * 20.5, y: 300 - h, width: w, height: h, rx: 2, fill: c, opacity: 0.88 }, svg);
        });
      });
      A({ targets: svg.querySelectorAll(".spine"), translateY: [320, 0], delay: anime.stagger(55), duration: 900, easing: "easeOutBack" });
    },

    hook(s) {
      counters(s);
      reveal(s);
      const line = s.querySelector("#strikeLine"), word = s.querySelector("#strike");
      line.setAttribute("x2", 0);
      const w = word.getBoundingClientRect().width / (document.getElementById("stage").getBoundingClientRect().width / 1600);
      const tl = TL({});
      tl.add({ targets: line, x2: [0, w], duration: 600, delay: 2300, easing: "easeInOutQuad" })
        .add({ targets: s.querySelector("#realReason"), opacity: [0, 1], translateX: [-10, 0], duration: 600 });
      run(tl);
    },

    factors(s) {
      reveal(s);
      A({ targets: [s.querySelector("#f1"), s.querySelector("#f4")], borderColor: ["#d9d2c3", C.gold],
        backgroundColor: ["#fffdf8", "#fbf3e0"], delay: anime.stagger(250, { start: 1500 }), duration: 600 });
    },

    history(s) {
      const svg = s.querySelector("#historySvg");
      once("history", () => {
        const ev = [
          ["1841", "Folsom v. Marsh", "스토리 대법관 — 공정이용의 원형"],
          ["1869", "Lawrence v. Dana", "‘공정이용’이라는 말이 처음 쓰임"],
          ["1976", "저작권법 제107조", "판례 법리를 성문화, 4요소는 예시"],
          ["1985", "Harper & Row", "제4요소가 “가장 중요한 요소”"],
          ["1994", "Campbell", "사안별(case-by-case) 판단"],
          ["2023", "Warhol v. Goldsmith", "변형적 이용 재정리, 객관적 판단"],
        ];
        const y0 = 235, x0 = 150, x1 = 1258, step = (x1 - x0) / (ev.length - 1);
        S("line", { class: "axis", x1: x0, y1: y0, x2: x1, y2: y0, stroke: C.ink, "stroke-width": 3 }, svg);
        ev.forEach(([yr, name, desc], i) => {
          const x = x0 + i * step, up = i % 2 === 0, g = S("g", { class: "ev" }, svg);
          S("line", { x1: x, y1: y0, x2: x, y2: up ? y0 - 58 : y0 + 58, stroke: C.rule, "stroke-width": 2 }, g);
          S("circle", { cx: x, cy: y0, r: 13, fill: i === 5 ? C.gold : C.paper, stroke: i === 5 ? C.gold : C.ink, "stroke-width": 3 }, g);
          const ty = up ? y0 - 150 : y0 + 92;
          T(g, x, ty, yr, { "text-anchor": "middle", "font-size": 34, "font-weight": 800, fill: C.gold,
            "font-family": "Noto Serif KR, serif" });
          T(g, x, ty + 34, name, { "text-anchor": "middle", "font-size": 21, "font-weight": 700 });
          T(g, x, ty + 62, desc, { "text-anchor": "middle", "font-size": 17, fill: C.ink2 });
        });
      });
      const axis = svg.querySelector(".axis");
      const tl = TL({});
      tl.add({ targets: axis, strokeDashoffset: [anime.setDashoffset, 0], duration: 1400, easing: "easeInOutSine" })
        .add({ targets: svg.querySelectorAll(".ev"), opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(230) }, 300);
      run(tl);
    },

    stages(s) {
      const svg = s.querySelector("#stageSvg");
      once("stages", () => {
        arrowDefs(svg, "stA", C.ink3);
        const items = [["수집", "학습 데이터를 모으는 단계", "해적판 다운로드 · 구매본 스캔", C.red],
          ["훈련", "골라서 모델을 학습시키는 단계", "학습 과정의 반복 복제", C.gold],
          ["생성(출력)", "사용자 지시에 따라 결과를 내는 단계", "원고가 주장하지 않음", C.gray]];
        const w = 360, h = 150, gap = 104, y = 70;
        items.forEach(([n, d, e, c], i) => {
          const x = 40 + i * (w + gap), g = S("g", { class: "st" }, svg);
          S("rect", { x, y, width: w, height: h, rx: 14, fill: i === 2 ? "#efece5" : TINT[i === 0 ? "red" : "gold"],
            stroke: c, "stroke-width": 3, "stroke-dasharray": i === 2 ? "10 8" : "none" }, g);
          T(g, x + w / 2, y + 50, n, { "text-anchor": "middle", "font-size": 32, "font-weight": 800, fill: i === 2 ? C.ink3 : C.ink });
          T(g, x + w / 2, y + 88, d, { "text-anchor": "middle", "font-size": 18, fill: C.ink2 });
          T(g, x + w / 2, y + 120, e, { "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: c });
          if (i < 2) S("line", { class: "st", x1: x + w + 14, y1: y + h / 2, x2: x + w + gap - 14, y2: y + h / 2, stroke: C.ink3,
            "stroke-width": 3, "marker-end": "url(#stA)" }, svg);
        });
        const br = S("g", { class: "br" }, svg);
        S("path", { d: `M40 52 V36 H${40 + 2 * w + gap} V52`, fill: "none", stroke: C.red, "stroke-width": 3 }, br);
        T(br, 40 + w + gap / 2, 26, "이 사건의 범위", { "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: C.red });
        const stp = S("g", { class: "stp" }, svg);
        S("rect", { x: 40 + 2 * (w + gap) + 84, y: y + h + 8, width: 212, height: 40, rx: 8, fill: "#fff", stroke: C.ink3, "stroke-width": 2 }, stp);
        T(stp, 40 + 2 * (w + gap) + 190, y + h + 35, "이 사건에서 다투지 않음", { "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: C.ink3 });
      });
      const tl = TL({});
      tl.add({ targets: svg.querySelectorAll(".st"), opacity: [0, 1], translateX: [-20, 0], delay: anime.stagger(180) })
        .add({ targets: svg.querySelector(".br"), opacity: [0, 1], duration: 500 })
        .add({ targets: svg.querySelector(".stp"), opacity: [0, 1], scale: [1.4, 1], duration: 450, easing: "easeOutBack" });
      run(tl);
      reveal(s, 1700);
    },

    pirate(s) {
      const svg = s.querySelector("#pirateSvg");
      const data = [["Books3", get("pirated.books3"), false], ["LibGen", get("pirated.libgen"), true], ["PiLiMi", get("pirated.pilimi"), true]];
      const max = 5500000, H = 380, base = 450, bw = 150;
      once("pirate", () => {
        [0, 1e6, 2e6, 3e6, 4e6, 5e6].forEach((v) => {
          const y = base - (v / max) * H;
          S("line", { x1: 90, y1: y, x2: 800, y2: y, stroke: "#e4ded2", "stroke-width": 1 }, svg);
          T(svg, 80, y + 6, v === 0 ? "0" : (v / 1e6) + "00만", { "text-anchor": "end", "font-size": 15, fill: C.ink3 });
        });
        data.forEach(([n, v, atLeast], i) => {
          const x = 150 + i * 220;
          S("rect", { class: "bar", x, y: base, width: bw, height: 0, fill: C.red, rx: 4, "data-h": (v / max) * H }, svg);
          const lbl = T(svg, x + bw / 2, base - 10, "", { class: "bl", "text-anchor": "middle", "font-size": 26, "font-weight": 800,
            "data-v": v, "data-plus": atLeast ? "1" : "" });
          lbl.textContent = "0";
          T(svg, x + bw / 2, base + 34, n, { "text-anchor": "middle", "font-size": 22, "font-weight": 700 });
          T(svg, x + bw / 2, base + 60, ["2021.1–2", "2021.6", "2022.7"][i], { "text-anchor": "middle", "font-size": 16, fill: C.ink3 });
        });
      });
      const bars = svg.querySelectorAll(".bar"), lbls = svg.querySelectorAll(".bl");
      bars.forEach((b, i) => {
        const h = +b.dataset.h, o = { h: 0 }, l = lbls[i], v = +l.dataset.v;
        if (STATIC) {
          b.setAttribute("y", base - h); b.setAttribute("height", h); l.setAttribute("y", base - h - 12);
          l.textContent = FMT.int(v) + (l.dataset.plus ? "+" : ""); return;
        }
        A({ targets: o, h, duration: 1300, delay: 300 + i * 260, easing: "easeOutQuart", update: () => {
          b.setAttribute("y", base - o.h); b.setAttribute("height", o.h);
          l.setAttribute("y", base - o.h - 12);
          l.textContent = FMT.int((o.h / h) * v) + (l.dataset.plus ? "+" : "");
        } });
      });
      reveal(s, 1200);
    },

    video(s) {
      const v = s.querySelector("video");
      if (!v) return;
      if (STATIC) { v.pause(); return; }
      v.currentTime = 0; v.play().catch(() => {});
      if (!v.dataset.bound) {
        v.dataset.bound = 1;
        v.addEventListener("click", (e) => { e.stopPropagation(); v.currentTime = 0; v.play(); });
      }
    },

    split(s) {
      const svg = s.querySelector("#splitSvg");
      once("split", () => {
        arrowDefs(svg, "spA", C.ink3);
        const g0 = S("g", { class: "one" }, svg);
        S("rect", { x: 404, y: 10, width: 600, height: 110, rx: 14, fill: TINT.gold, stroke: C.gold, "stroke-width": 3 }, g0);
        T(g0, 704, 56, "앤트로픽: “모든 복제는 LLM 학습이라는", { "text-anchor": "middle", "font-size": 22, "font-weight": 700 });
        T(g0, 704, 90, "하나의 이용이다”", { "text-anchor": "middle", "font-size": 22, "font-weight": 700 });
        const items = [["① 학습용 사본", "새 텍스트를 만드는 LLM 학습", C.green, "green"],
          ["② 구매본 스캔 사본", "종이 → 디지털 형식 변환", C.green, "green"],
          ["③ 해적판 도서관 사본", "‘모든 책’을 ‘영원히’ 보관", C.red, "red"]];
        items.forEach(([n, d, c, t], i) => {
          const x = 40 + i * 456, g = S("g", { class: "three" }, svg);
          S("path", { class: "link", d: `M704 120 C704 190, ${x + 196} 180, ${x + 196} 250`, fill: "none", stroke: C.ink3,
            "stroke-width": 2.5, "marker-end": "url(#spA)" }, svg);
          S("rect", { x, y: 256, width: 392, height: 130, rx: 14, fill: TINT[t], stroke: c, "stroke-width": 3 }, g);
          T(g, x + 196, 306, n, { "text-anchor": "middle", "font-size": 26, "font-weight": 800 });
          T(g, x + 196, 344, d, { "text-anchor": "middle", "font-size": 19, fill: C.ink2 });
        });
        T(svg, 704, 214, "알섭 판사: 이용마다 따로 본다", { class: "lab", "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: C.red });
      });
      const tl = TL({});
      tl.add({ targets: svg.querySelector(".one"), opacity: [0, 1], scale: [0.9, 1], duration: 600 })
        .add({ targets: svg.querySelectorAll(".link"), strokeDashoffset: [anime.setDashoffset, 0], delay: anime.stagger(150), duration: 700 }, "+=500")
        .add({ targets: svg.querySelector(".lab"), opacity: [0, 1], duration: 400 }, "-=400")
        .add({ targets: svg.querySelectorAll(".three"), opacity: [0, 1], translateY: [24, 0], delay: anime.stagger(180) }, "-=300");
      run(tl);
      reveal(s, 2600);
    },

    heatmap(s) {
      const cells = s.querySelectorAll("td[data-c]");
      cells.forEach((td) => { td.style.backgroundColor = "rgba(0,0,0,0)"; td.style.color = C.ink3; });
      A({ targets: cells, backgroundColor: (el) => TINT[el.dataset.c], color: (el) => C[el.dataset.c],
        delay: anime.stagger(90, { start: 400 }), duration: 450, easing: "easeOutQuad" });
      cells.forEach((td) => { td.style.fontWeight = 700; });
      reveal(s, 1800);
    },

    timeline(s) {
      const svg = s.querySelector("#tlSvg");
      const t0 = Date.parse("2020-09-01"), t1 = Date.parse("2026-12-01"), X = (d) => 40 + ((Date.parse(d) - t0) / (t1 - t0)) * 1330;
      const y0 = 300;
      once("timeline", () => {
        const phases = [["2021-01-01", "2024-08-01", "취득·축적", TINT.red], ["2024-08-01", "2025-08-01", "소송·판결", TINT.gold],
          ["2025-08-01", "2026-08-15", "합의·종결", TINT.green]];
        phases.forEach(([a, b, n, c]) => {
          const g = S("g", { class: "ph" }, svg);
          S("rect", { x: X(a), y: 40, width: X(b) - X(a), height: 500, fill: c }, g);
          T(g, (X(a) + X(b)) / 2, 66, n, { "text-anchor": "middle", "font-size": 20, "font-weight": 800, fill: C.ink2 });
        });
        S("line", { class: "axis", x1: 40, y1: y0, x2: 1370, y2: y0, stroke: C.ink, "stroke-width": 3 }, svg);
        for (let yr = 2021; yr <= 2026; yr++) {
          const x = X(`${yr}-01-01`);
          S("line", { x1: x, y1: y0 - 8, x2: x, y2: y0 + 8, stroke: C.ink, "stroke-width": 2 }, svg);
          T(svg, x, y0 + 32, String(yr), { "text-anchor": "middle", "font-size": 17, fill: C.ink3, "font-weight": 700 });
        }
        const ev = [
          ["2021-01-15", "Books3 다운로드", C.red, -1, 1],
          ["2021-06-15", "LibGen 500만+", C.red, 1, 1],
          ["2022-07-15", "PiLiMi 200만+", C.red, -1, 1],
          ["2023-03-15", "Claude 공개", C.ink3, 1, 1],
          ["2024-02-15", "구매·스캔으로 전환", C.green, -1, 2],
          ["2024-08-15", "집단소송 제기", C.ink, 1, 2],
          ["2025-06-23", "★ 공정이용 판결", C.gold, -1, 3],
          ["2025-07-17", "집단 인증", C.ink, 1, 1],
          ["2025-09-25", "예비승인 $1.5B", C.gold, 1, 3],
          ["2026-02-09", "제외신청 마감", C.ink3, -1, 1],
          ["2026-07-20", "★ 최종승인·종결", C.gold, -1, 2],
        ];
        ev.forEach(([d, label, c, side, lvl]) => {
          const x = X(d), g = S("g", { class: "tev" }, svg), ly = y0 + side * (40 + lvl * 52);
          S("line", { x1: x, y1: y0, x2: x, y2: ly - side * 6, stroke: c, "stroke-width": 1.5, "stroke-dasharray": "3 3" }, g);
          S("circle", { cx: x, cy: y0, r: 8, fill: c }, g);
          T(g, x, ly + (side > 0 ? 16 : 0), label, { "text-anchor": "middle", "font-size": 18, "font-weight": 700, fill: c === C.ink3 ? C.ink2 : c });
          T(g, x, ly + (side > 0 ? 38 : 22), d.slice(0, 7).replace("-", "."), { "text-anchor": "middle", "font-size": 14, fill: C.ink3 });
        });
      });
      const tl = TL({});
      tl.add({ targets: svg.querySelectorAll(".ph"), opacity: [0, 1], duration: 500, delay: anime.stagger(150) })
        .add({ targets: svg.querySelector(".axis"), strokeDashoffset: [anime.setDashoffset, 0], duration: 1300, easing: "easeInOutSine" }, 200)
        .add({ targets: svg.querySelectorAll(".tev"), opacity: [0, 1], translateY: [8, 0], delay: anime.stagger(150) }, 700);
      run(tl);
    },

    alloc(s) {
      reveal(s);
      const remain = get("settlement.fund") - get("fees.awarded") - get("fees.expenses") - get("fees.cost_reserve") - get("fees.service_awards_total");
      const per = remain / get("claims.claimed_works"), el = s.querySelector("#perWork"), o = { v: 0 };
      A({ targets: o, v: per, duration: 1500, delay: 600, easing: "easeOutExpo", update: () => { el.textContent = FMT.int(o.v); },
        complete: () => { el.textContent = FMT.int(per); } });
    },

    funnel(s) {
      const svg = s.querySelector("#funnelSvg");
      once("funnel", () => {
        const W = 560, groups = [
          ["권리자 기준", 60, [["직접 통지 대상", get("notice.potential_members"), C.ink2],
            ["통지 도달 (반송 없음)", get("notice.delivered_members"), C.ink2],
            ["제외신청", get("claims.optouts"), C.red]]],
          ["작품 기준", 760, [["대상 작품 (Works List)", get("settlement.works_list"), C.gold],
            ["청구된 작품", get("claims.claimed_works"), C.green],
            ["제외신청 작품", get("claims.optout_works"), C.red]]],
        ];
        groups.forEach(([title, x0, rows]) => {
          T(svg, x0, 34, title, { "font-size": 24, "font-weight": 800 });
          const top = rows[0][1];
          rows.forEach(([n, v, c], i) => {
            const y = 70 + i * 128, w = Math.max(6, (v / top) * W), g = S("g", { class: "fr" }, svg);
            S("rect", { class: "fb", x: x0, y, width: w, height: 64, rx: 6, fill: c, opacity: 0.9, "data-w": w }, g);
            T(g, x0, y + 92, n, { "font-size": 18, fill: C.ink2 });
            const big = T(g, w > 200 ? x0 + 18 : x0 + w + 14, y + 43, FMT.int(v), { "font-size": 28, "font-weight": 800,
              fill: w > 200 ? "#fff" : c });
            if (i === 1 && title === "작품 기준") T(g, x0 + w + 14, y + 43, `${get("claims.claim_rate")}%`, { "font-size": 28, "font-weight": 800, fill: C.green });
            void big;
          });
        });
        const g = S("g", { class: "fr" }, svg);
        S("rect", { x: 60, y: 450, width: 1260, height: 56, rx: 10, fill: TINT.gold, stroke: C.gold, "stroke-width": 2 }, g);
        T(g, 690, 486, `이의·의견 ${get("claims.objections")}건 — 모두 기각 · 제외신청 ${get("claims.optouts")}건은 전체의 극히 일부`,
          { "text-anchor": "middle", "font-size": 21, "font-weight": 700 });
      });
      svg.querySelectorAll(".fb").forEach((r) => r.setAttribute("width", 0));
      const tl = TL({});
      tl.add({ targets: svg.querySelectorAll(".fr"), opacity: [0, 1], delay: anime.stagger(120), duration: 400 })
        .add({ targets: svg.querySelectorAll(".fb"), width: (el) => +el.dataset.w, delay: anime.stagger(160), duration: 900, easing: "easeOutQuart" }, 200);
      run(tl);
    },

    compare(s) {
      reveal(s);
      A({ targets: s.querySelectorAll("#cmp tr"), opacity: [0, 1], translateX: [-24, 0], delay: anime.stagger(220, { start: 300 }) });
    },

    theories(s) {
      reveal(s);
      A({ targets: s.querySelectorAll(".stamp"), opacity: [0, 1], scale: [1.8, 1], rotate: [-8, -2],
        delay: anime.stagger(380, { start: 1100 }), duration: 450, easing: "easeOutBack" });
    },

    loops(s) {
      const svg = s.querySelector("#loopSvg");
      once("loops", () => {
        arrowDefs(svg, "lpR", C.red); arrowDefs(svg, "lpB", C.blue);
        const loop = (cx, color, mk, title, nodes, cls) => {
          T(svg, cx, 26, title, { class: cls, "text-anchor": "middle", "font-size": 24, "font-weight": 800, fill: color });
          const r = 160, cy = 228, ang = [-90, 30, 150].map((a) => (a * Math.PI) / 180);
          const pts = ang.map((a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
          for (let i = 0; i < 3; i++) {
            const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % 3];
            const a1 = ang[i] + 0.42, a2 = ang[(i + 1) % 3] - 0.42 + (i === 2 ? 2 * Math.PI : 0);
            const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)], p2 = [cx + r * Math.cos(a2), cy + r * Math.sin(a2)];
            void x1; void y1; void x2; void y2;
            S("path", { class: "arc " + cls, d: `M${p1[0]} ${p1[1]} A${r} ${r} 0 0 1 ${p2[0]} ${p2[1]}`, fill: "none", stroke: color,
              "stroke-width": 4, "marker-end": `url(#${mk})` }, svg);
          }
          nodes.forEach((n, i) => {
            const [x, y] = pts[i], g = S("g", { class: "nd " + cls }, svg);
            S("rect", { x: x - 105, y: y - 28, width: 210, height: 56, rx: 12, fill: "#fffdf8", stroke: color, "stroke-width": 2.5 }, g);
            T(g, x, y + 7, n, { "text-anchor": "middle", "font-size": 19, "font-weight": 700 });
          });
        };
        loop(330, C.red, "lpR", "라이선스 시장을 늘 인정하면", ["라이선스 시장 존재", "사용료 상실 = 손해", "제4요소 → 원고 승"], "L");
        loop(1080, C.blue, "lpB", "라이선스 시장을 늘 부정하면", ["변형적 이용", "잃은 시장 없음", "제4요소 → 피고 승"], "R");
        const g = S("g", { class: "fix" }, svg);
        S("rect", { x: 284, y: 410, width: 840, height: 100, rx: 14, fill: TINT.gold, stroke: C.gold, "stroke-width": 3 }, g);
        T(g, 704, 450, "논문의 해법: 심리를 거쳐 ‘전통적이거나 합리적이거나", { "text-anchor": "middle", "font-size": 23, "font-weight": 800 });
        T(g, 704, 486, "개발될 개연성이 있는 시장’만 잠재적 시장으로 인정 (Texaco)", { "text-anchor": "middle", "font-size": 23, "font-weight": 800 });
        T(svg, 704, 250, "vs", { class: "vs", "text-anchor": "middle", "font-size": 40, "font-weight": 900, fill: C.ink3,
          "font-family": "Noto Serif KR, serif" });
      });
      const tl = TL({});
      tl.add({ targets: svg.querySelectorAll(".L"), opacity: [0, 1], duration: 400, delay: anime.stagger(80) })
        .add({ targets: svg.querySelectorAll(".arc.L"), strokeDashoffset: [anime.setDashoffset, 0], duration: 600, delay: anime.stagger(300) }, "-=300")
        .add({ targets: svg.querySelector(".vs"), opacity: [0, 1], duration: 300 })
        .add({ targets: svg.querySelectorAll(".R"), opacity: [0, 1], duration: 400, delay: anime.stagger(80) })
        .add({ targets: svg.querySelectorAll(".arc.R"), strokeDashoffset: [anime.setDashoffset, 0], duration: 600, delay: anime.stagger(300) }, "-=300")
        .add({ targets: svg.querySelector(".fix"), opacity: [0, 1], translateY: [20, 0], duration: 600 }, "+=200");
      run(tl);
    },

    cases(s) {
      reveal(s, 2400);
      A({ targets: s.querySelectorAll("#abt tr"), opacity: [0, 1], translateY: [16, 0], delay: anime.stagger(420, { start: 200 }) });
    },

    korea(s) {
      reveal(s);
      const hl = s.querySelector(".hl");
      hl.style.backgroundImage = "linear-gradient(transparent 50%, rgba(176,125,26,.45) 50%)";
      hl.style.backgroundRepeat = "no-repeat";
      const o = { p: 0 };
      A({ targets: o, p: 100, duration: 900, delay: 1400, easing: "easeInOutQuad",
        update: () => { hl.style.backgroundSize = `${o.p}% 100%`; } });
    },
  };

  /* ── 탐색 ─────────────────────────────────────────────── */
  const stage = document.getElementById("stage");
  const slides = [...document.querySelectorAll(".slide")];
  const pager = document.getElementById("pager"), bar = document.getElementById("progress");
  let cur = -1;

  slides.forEach((s) => {
    if (s.dataset.part) {
      const k = document.createElement("div");
      k.className = "kicker";
      const [a, ...b] = s.dataset.part.split(" · ");
      k.innerHTML = `<b>${a}</b>${b.join(" · ")}`;
      s.prepend(k);
    }
  });

  function fit() {
    const sc = Math.min(innerWidth / 1600, innerHeight / 900);
    stage.style.transform = `scale(${sc})`;
  }
  addEventListener("resize", fit); fit();

  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur) return;
    if (cur >= 0) {
      const old = slides[cur];
      old.classList.remove("active");
      old.querySelectorAll("video").forEach((v) => v.pause());
    }
    cur = i;
    const s = slides[i];
    anime.remove(s.querySelectorAll("*"));
    s.classList.add("active");
    if (!STATIC) s.querySelectorAll("[data-hide]").forEach((e) => { e.style.opacity = 0; });
    (ANIM[s.dataset.anim] || ANIM.reveal)(s);
    pager.textContent = `${i + 1} / ${slides.length}`;
    bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    if (location.hash !== `#${i + 1}`) history.replaceState(null, "", `#${i + 1}`);
  }
  const fromHash = () => { const n = parseInt(location.hash.slice(1), 10); return isNaN(n) ? 0 : n - 1; };

  addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(slides.length - 1);
  });
  stage.addEventListener("click", (e) => {
    const r = stage.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.3) go(cur - 1); else go(cur + 1);
  });
  let tx = null;
  addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    tx = null;
  });
  addEventListener("hashchange", () => go(fromHash()));

  window.DECK = { go, count: slides.length, get cur() { return cur; } };
  const start = () => go(fromHash());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
