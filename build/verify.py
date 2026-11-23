"""검증 루프: 모든 슬라이드를 Chrome(Playwright)으로 열어
1) 콘솔·페이지 오류  2) 무대(1600×900) 밖으로 넘친 요소  3) 글자가 서로 겹치는 SVG 텍스트
4) 캡처(static: 최종 상태 / anim: 진입 후 대기)  를 점검한다.
사용: python build/verify.py <base_url> <out_dir> [anim]
"""
import json
import sys

from playwright.sync_api import sync_playwright

base, out = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else "static"

CHECK_JS = r"""
() => {
  const stage = document.getElementById('stage');
  const sr = stage.getBoundingClientRect();
  const sc = sr.width / 1600;
  const s = document.querySelector('.slide.active');
  const issues = [];
  const tol = 2;
  s.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (r.left < sr.left - tol || r.right > sr.right + tol || r.top < sr.top - tol || r.bottom > sr.bottom + tol) {
      issues.push({type: 'overflow', tag: el.tagName, cls: el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className,
        text: (el.textContent || '').trim().slice(0, 40),
        box: [Math.round((r.left - sr.left)/sc), Math.round((r.top - sr.top)/sc), Math.round((r.right - sr.left)/sc), Math.round((r.bottom - sr.top)/sc)]});
    }
  });
  // 블록 요소 텍스트 넘침
  s.querySelectorAll('h2,h3,p,li,td,blockquote,.card,.lbl,.big').forEach(el => {
    if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible')
      issues.push({type: 'clip', tag: el.tagName, text: el.textContent.trim().slice(0, 40)});
  });
  // SVG text 겹침
  const texts = [...s.querySelectorAll('svg text')].filter(t => t.textContent.trim() && getComputedStyle(t).opacity !== '0');
  const boxes = texts.map(t => [t, t.getBoundingClientRect()]);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i][1], b = boxes[j][1];
    const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (ox > 4 && oy > 4) issues.push({type: 'svg-text-overlap', a: boxes[i][0].textContent.slice(0, 30), b: boxes[j][0].textContent.slice(0, 30)});
  }
  // SVG 내부 잘림: 텍스트가 자신이 속한 svg 영역 밖으로 나감
  s.querySelectorAll('svg text').forEach(t => {
    const sv = t.ownerSVGElement.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (!r.width || getComputedStyle(t).opacity === '0') return;
    if (r.left < sv.left - 2 || r.right > sv.right + 2 || r.top < sv.top - 2 || r.bottom > sv.bottom + 2)
      issues.push({type: 'svg-clip', text: t.textContent.trim().slice(0, 30)});
  });
  // SVG 도형 잘림
  s.querySelectorAll('svg rect, svg circle').forEach(t => {
    const sv = t.ownerSVGElement.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (!r.width) return;
    if (r.right > sv.right + 2 || r.left < sv.left - 2 || r.bottom > sv.bottom + 2) issues.push({type: 'svg-shape-clip', tag: t.tagName});
  });
  // 이미지·영상 로드
  s.querySelectorAll('img').forEach(im => { if (!im.complete || !im.naturalWidth) issues.push({type: 'img-not-loaded', src: im.src}); });
  return issues;
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
    n = pg.evaluate("window.DECK.count")
    for i in range(n):
        errors.clear()
        pg.evaluate(f"window.DECK.go({i})")
        pg.wait_for_timeout(350 if mode == "static" else 4500)
        issues = pg.evaluate(CHECK_JS)
        pg.screenshot(path=f"{out}/{mode}_{i + 1:02d}.png")
        report[i + 1] = {"issues": issues, "errors": list(errors)}
    b.close()

bad = {k: v for k, v in report.items() if v["issues"] or v["errors"]}
print(f"mode={mode} slides={len(report)} slides_with_problems={len(bad)}")
for k, v in bad.items():
    print(f"--- slide {k}")
    for e in v["errors"]:
        print("  ERR", e)
    for it in v["issues"][:8]:
        print("  ", json.dumps(it, ensure_ascii=False))
    if len(v["issues"]) > 8:
        print(f"   ... +{len(v['issues']) - 8} more")
