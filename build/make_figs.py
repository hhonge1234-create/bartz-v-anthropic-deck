"""matplotlib 발표용 그래프 (v2: 큰 글꼴, 적은 항목). 모든 수치는 data/facts.json."""
import json
import pathlib

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

ROOT = pathlib.Path(__file__).resolve().parents[1]
F = json.loads((ROOT / "data" / "facts.json").read_text(encoding="utf-8"))
OUT = ROOT / "assets" / "fig"
OUT.mkdir(parents=True, exist_ok=True)

for name in ["Apple SD Gothic Neo", "AppleGothic", "NanumGothic"]:
    if any(f.name == name for f in font_manager.fontManager.ttflist):
        plt.rcParams["font.family"] = name
        break
plt.rcParams.update({"axes.unicode_minus": False, "svg.fonttype": "path", "font.size": 22,
                     "axes.edgecolor": "#cfc8b8", "xtick.color": "#5b6070", "ytick.color": "#16181d"})
INK, RED, GREEN, GOLD, GRAY = "#16181d", "#b8322a", "#2f7a55", "#b07d1a", "#a7abb4"


def v(*path):
    node = F
    for p in path:
        node = node[p]
    return node["value"]


def money(x):
    if x >= 1e9:
        return f"${x / 1e9:,.1f}B" if x < 1e10 else f"${x / 1e9:,.0f}B"
    if x >= 1e6:
        return f"${x / 1e6:,.0f}M"
    return f"${x:,.0f}"


def clean(ax, keep_left=True):
    for s in ["top", "right"] + ([] if keep_left else ["left"]):
        ax.spines[s].set_visible(False)


# 1. 법정손해배상 노출액 vs 합의금 (로그 축)
works = v("settlement", "works_list")
rows = [("일반 침해 최저\n$750 × 작품 수", v("settlement", "statutory_ordinary_min") * works, GRAY),
        ("실제 합의금", v("settlement", "fund"), GOLD),
        ("최대 $150,000\n× 작품 수", v("settlement", "statutory_max_notice") * works, RED)]
fig, ax = plt.subplots(figsize=(10, 5.2))
ys = [2, 1, 0]
for y, (label, val, c) in zip(ys, rows):
    ax.barh(y, val, color=c, height=0.6)
    ax.text(val * 1.18, y, money(val), va="center", fontsize=30, color=INK, fontweight="bold")
ax.set_yticks(ys, [r[0] for r in rows], fontsize=21)
ax.set_xscale("log")
ax.set_xlim(1e8, 1e12)
ax.set_xticks([1e8, 1e9, 1e10, 1e11], ["1억 달러", "10억", "100억", "1,000억"], fontsize=17)
ax.grid(axis="x", color="#e6e0d4", linewidth=1)
ax.set_axisbelow(True)
clean(ax)
fig.tight_layout()
fig.savefig(OUT / "exposure.svg", transparent=True)
plt.close(fig)

# 2. 15억 달러 배분 워터폴 (백만 달러)
fund = v("settlement", "fund")
fee = v("fees", "awarded")
other = v("fees", "expenses") + v("fees", "cost_reserve") + v("fees", "service_awards_total")
remain = fund - fee - other
labels = ["합의금", "변호사 보수", "비용·적립 등", "작가·출판사 몫\n(추정)"]
fig, ax = plt.subplots(figsize=(10, 5.2))
ax.bar(0, fund / 1e6, color=GOLD, width=0.62)
ax.bar(1, fee / 1e6, bottom=(fund - fee) / 1e6, color=RED, width=0.62)
ax.bar(2, other / 1e6, bottom=remain / 1e6, color=RED, width=0.62, alpha=0.75)
ax.bar(3, remain / 1e6, color=GREEN, width=0.62)
for x, top, txt, c in [(0, fund, money(fund), INK), (1, fund, "-" + money(fee), RED),
                       (2, fund - fee, "-" + money(other), RED), (3, remain, money(remain), GREEN)]:
    ax.text(x, top / 1e6 + 30, txt, ha="center", fontsize=26, color=c, fontweight="bold")
for x0, lvl in [(0, fund), (1, fund - fee), (2, remain)]:
    ax.plot([x0 + 0.31, x0 + 0.69], [lvl / 1e6] * 2, color="#bdb5a3", lw=1.5, ls="--")
ax.set_xticks(range(4), labels, fontsize=20)
ax.set_ylim(0, 1750)
ax.set_yticks([0, 500, 1000, 1500], ["0", "5억", "10억", "15억 달러"], fontsize=17)
ax.grid(axis="y", color="#e6e0d4", linewidth=1)
ax.set_axisbelow(True)
clean(ax)
fig.tight_layout()
fig.savefig(OUT / "waterfall.svg", transparent=True)
plt.close(fig)

old = OUT / "fees.svg"
if old.exists():
    old.unlink()
print("remain", remain, "per_claimed", remain / v("claims", "claimed_works"))
