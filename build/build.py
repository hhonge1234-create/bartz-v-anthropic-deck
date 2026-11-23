"""덱 빌드: facts.json → facts.js, 영상 포스터(마지막 프레임) 생성, matplotlib 그래프 갱신.
Manim 영상은 시간이 걸리므로 별도: manim -qm --format=mp4 build/scenes.py BookJourney OneBookInfinite
"""
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]

facts = json.loads((ROOT / "data" / "facts.json").read_text(encoding="utf-8"))
(ROOT / "data" / "facts.js").write_text(
    "window.FACTS = " + json.dumps(facts, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print("facts.js written")

import av  # noqa: E402

for mp4 in sorted((ROOT / "assets" / "video").glob("*.mp4")):
    c = av.open(str(mp4))
    last = None
    for fr in c.decode(c.streams.video[0]):
        last = fr
    last.to_image().convert("RGB").save(mp4.with_suffix(".jpg"), quality=88)
    print("poster", mp4.with_suffix(".jpg").name)

subprocess.run([sys.executable, str(ROOT / "build" / "make_figs.py")], check=True)
