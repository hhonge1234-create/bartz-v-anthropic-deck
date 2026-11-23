"""검증 루프 v3
사용: python build/verify.py <base_url> <out_dir> [static|anim]
static: 모든 단계가 공개된 최종 상태(?static=1)를 캡처
anim  : 실제 애니메이션으로 각 장의 단계를 끝까지 넘긴 뒤 캡처
검사: 콘솔/페이지 오류, 요청 실패, 무대 넘침, SVG 잘림, 텍스트 겹침, 최소 글자 크기(24px), 화면 글자 수(260자)
"""
import json
import sys

from playwright.sync_api import sync_playwright

base, out = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else "static"
MIN_FONT, MAX_CHARS = 24, 260

CHECK_JS = r"""
([MIN_FONT, MAX_CHARS]) => {
  const stage = document.getElementById('stage'), sr = stage.getBoundingClientRect(), sc = sr.width / 1600;
  const s = document.querySelector('.slide.active');
  const issues = [];
  const visible = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05; };
  const exempt = (el) => el.closest('.src, aside.notes, #acts, #pager, video');
  // 1 무대 넘침
  s.querySelectorAll('*').forEach(el => {
    if (el.closest('aside.notes')) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (r.left < sr.left - 2 || r.right > sr.right + 2 || r.top < sr.top - 2 || r.bottom > sr.bottom + 2)
      issues.push({type: 'overflow', tag: el.tagName, text: (el.textContent || '').trim().slice(0, 30)});
  });
  // 2 SVG 잘림
  s.querySelectorAll('svg text, svg rect, svg circle').forEach(t => {
    const sv = t.ownerSVGElement.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (!r.width) return;
    if (r.left < sv.left - 2 || r.right > sv.right + 2 || r.top < sv.top - 2 || r.bottom > sv.bottom + 2)
      issues.push({type: 'svg-clip', tag: t.tagName, text: (t.textContent || '').trim().slice(0, 30)});
  });
  // 3 텍스트 리프 수집
  const leaves = [];
  const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode, el = n.parentElement;
    if (!n.textContent.trim() || !el || el.closest('aside.notes, style, script')) continue;
    if (!visible(el)) continue;
    const range = document.createRange(); range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter(r => r.width > 1 && r.height > 1);
    leaves.push({el, text: n.textContent.trim(), rects});
  }
  // 4 최소 글자 크기
  leaves.forEach(({el, text}) => {
    if (exempt(el)) return;
    let fs = parseFloat(getComputedStyle(el).fontSize);
    if (el.closest('svg')) { const sv = el.ownerSVGElement || el.closest('svg'); const vb = sv.viewBox.baseVal; fs = fs * (sv.getBoundingClientRect().width / sc) / (vb && vb.width ? vb.width : sv.getBoundingClientRect().width / sc); }
    if (fs < MIN_FONT - 0.5) issues.push({type: 'small-font', px: Math.round(fs), text: text.slice(0, 30)});
  });
  // 5 텍스트 겹침 (서로 다른 요소의 글자 상자)
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    if (leaves[i].el === leaves[j].el || leaves[i].el.contains(leaves[j].el) || leaves[j].el.contains(leaves[i].el)) continue;
    for (const a of leaves[i].rects) for (const b of leaves[j].rects) {
      const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ox > 3 && oy > 3) { issues.push({type: 'text-overlap', a: leaves[i].text.slice(0, 25), b: leaves[j].text.slice(0, 25)}); break; }
    }
  }
  // 6 글자 수
  const chars = leaves.filter(l => !exempt(l.el)).map(l => l.text).join('').replace(/\s/g, '').length;
  if (chars > MAX_CHARS && !s.hasAttribute("data-dense")) issues.push({type: 'too-dense', chars});
  // 7 이미지
  s.querySelectorAll('img').forEach(im => { if (!im.complete || !im.naturalWidth) issues.push({type: 'img-not-loaded', src: im.src}); });
  return {issues, chars};
}
"""

report = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome")
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errors = []
    pg.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.on("requestfailed", lambda r: errors.append(f"requestfailed: {r.url}"))
    q = "?static=1" if mode == "static" else ""
    pg.goto(f"{base}/index.html{q}#1", wait_until="networkidle")
    pg.wait_for_function("window.DECK && window.DECK.cur === 0")
    n = pg.evaluate("DECK.count")
    for i in range(n):
        errors.clear()
        pg.evaluate(f"DECK.go({i})")
        if mode == "static":
            pg.wait_for_timeout(300)
        else:
            pg.wait_for_timeout(1600)
            for _ in range(pg.evaluate(f"DECK.steps({i})")):
                pg.evaluate("DECK.next()")
                pg.wait_for_timeout(1500)
            pg.wait_for_timeout(2600)
        res = pg.evaluate(CHECK_JS, [MIN_FONT, MAX_CHARS])
        pg.screenshot(path=f"{out}/{mode}_{i + 1:02d}.png")
        report[i + 1] = {"issues": res["issues"], "chars": res["chars"], "errors": list(errors)}
    b.close()

bad = {k: v for k, v in report.items() if v["issues"] or v["errors"]}
print(f"mode={mode} slides={len(report)} slides_with_problems={len(bad)}  max_chars={max(v['chars'] for v in report.values())}")
for k, v in bad.items():
    print(f"--- slide {k} (chars={v['chars']})")
    for e in v["errors"]:
        print("  ERR", e)
    for it in v["issues"][:8]:
        print("  ", json.dumps(it, ensure_ascii=False))
    if len(v["issues"]) > 8:
        print(f"   ... +{len(v['issues']) - 8} more")
