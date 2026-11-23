"""matplotlib 분석 그래프 생성 — 모든 수치는 data/facts.json 에서 읽는다."""
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

for name in ["Apple SD Gothic Neo", "AppleGothic", "NanumGothic", "Noto Sans KR"]:
    if any(f.name == name for f in font_manager.fontManager.ttflist):
        plt.rcParams["font.family"] = name
        break
plt.rcParams.update({
    "axes.unicode_minus": False,
    "svg.fonttype": "path",          # 글꼴을 경로로 저장 → 브라우저 글꼴과 무관
    "font.size": 15,
    "axes.edgecolor": "#c9c2b3",
    "axes.labelcolor": "#1d2230",
    "xtick.color": "#5b6070",
    "ytick.color": "#1d2230",
})
INK, RED, GREEN, GOLD, BLUE, GRAY = "#1d2230", "#b8322a", "#2f7a55", "#b07d1a", "#2c5ec4", "#9aa0aa"


def v(*path):
    node = F
    for p in path:
        node = node[p]
    return node["value"]


def money(x):
    if x >= 1e9:
        return f"${x / 1e9:,.2f}B"
    if x >= 1e6:
        return f"${x / 1e6:,.1f}M"
    return f"${x:,.0f}"


def clean(ax):
    for s in ["top", "right"]:
        ax.spines[s].set_visible(False)


# ── 1. 법정손해배상 노출 범위 vs 실제 합의금 (로그 축) ─────────────────────
works = v("settlement", "works_list")
rows = [
    ("선의 침해 최저액\n$200 × 작품 수", v("settlement", "statutory_innocent_min") * works, GRAY),
    ("일반 침해 최저액\n$750 × 작품 수", v("settlement", "statutory_ordinary_min") * works, GRAY),
    ("실제 합의금", v("settlement", "fund"), GOLD),
    ("통지상 최대액\n$150,000 × 작품 수", v("settlement", "statutory_max_notice") * works, RED),
]
fig, ax = plt.subplots(figsize=(11, 5.2))
ys = range(len(rows))[::-1]
for y, (label, val, c) in zip(ys, rows):
    ax.barh(y, val, color=c, height=0.62, alpha=0.95 if c != GRAY else 0.7)
    ax.text(val * 1.15, y, money(val), va="center", fontsize=17, color=INK,
            fontweight="bold" if c == GOLD else "normal")
ax.set_yticks(list(ys), [r[0] for r in rows], fontsize=14)
ax.set_xscale("log")
ax.set_xlim(5e7, 5e11)
ax.set_xlabel("달러 (로그 축)", fontsize=13)
ax.grid(axis="x", color="#e4ded2", linewidth=0.8)
ax.set_axisbelow(True)
clean(ax)
fig.tight_layout()
fig.savefig(OUT / "exposure.svg", transparent=True)
plt.close(fig)

# ── 2. 15억 달러 배분 워터폴 (단위: 백만 달러) ──────────────────────────────
fund = v("settlement", "fund")
deduct = [
    ("변호사 보수", v("fees", "awarded")),
    ("소송비용 상환", v("fees", "expenses")),
    ("향후 비용 적립", v("fees", "cost_reserve")),
    ("대표당사자 보상금", v("fees", "service_awards_total")),
]
remain = fund - sum(d for _, d in deduct)
labels = ["합의금"] + [d[0] for d in deduct] + ["배분 가능 잔액\n(추정)"]
fig, ax = plt.subplots(figsize=(11, 5.2))
level = fund
ax.bar(0, fund / 1e6, color=GOLD, width=0.6)
ax.text(0, fund / 1e6 + 25, money(fund), ha="center", fontsize=15, color=INK, fontweight="bold")
for i, (_, d) in enumerate(deduct, start=1):
    ax.bar(i, d / 1e6, bottom=(level - d) / 1e6, color=RED, width=0.6)
    ax.text(i, level / 1e6 + 25, "- " + money(d), ha="center", fontsize=13, color=RED)
    ax.plot([i - 0.7, i + 0.3], [level / 1e6] * 2, color="#c9c2b3", lw=1, ls="--")
    level -= d
ax.bar(len(labels) - 1, remain / 1e6, color=GREEN, width=0.6)
ax.text(len(labels) - 1, remain / 1e6 + 25, money(remain), ha="center", fontsize=15,
        color=GREEN, fontweight="bold")
ax.set_xticks(range(len(labels)), labels, fontsize=13)
ax.set_ylim(0, 1700)
ax.set_ylabel("백만 달러", fontsize=13)
ax.grid(axis="y", color="#e4ded2", linewidth=0.8)
ax.set_axisbelow(True)
clean(ax)
fig.tight_layout()
fig.savefig(OUT / "waterfall.svg", transparent=True)
plt.close(fig)

# ── 3. 변호사 보수: 요청 → 수정 요청 → 법원 인정 vs 로드스타 ────────────────
steps = [
    (f"최초 요청\n({F['fees']['request_initial']['pct']}%)", v("fees", "request_initial"), GRAY),
    (f"수정 요청\n({F['fees']['request_revised']['pct']}%)", v("fees", "request_revised"), GRAY),
    (f"법원 인정\n(약 {F['fees']['awarded']['pct']}%)", v("fees", "awarded"), BLUE),
]
lode = v("fees", "lodestar")
fig, ax = plt.subplots(figsize=(11, 5.2))
for i, (lab, val, c) in enumerate(steps):
    ax.bar(i, val / 1e6, color=c, width=0.55, alpha=0.9)
    ax.text(i, val / 1e6 + 8, money(val), ha="center", fontsize=16, color=INK,
            fontweight="bold" if c == BLUE else "normal")
ax.axhline(lode / 1e6, color=GOLD, lw=2, ls="--")
ax.text(2.42, 300, f"- - -  로드스타 {money(lode)}\n(합리적 투입 시간 × 시간당 보수)", ha="right", va="top",
        fontsize=13, color=GOLD)
ax.annotate(f"배수 {v('fees', 'multiplier_requested')}배", xy=(1, v('fees', 'request_revised') / 1e6 / 2),
            ha="center", fontsize=14, color="white", fontweight="bold")
ax.annotate(f"배수 {v('fees', 'multiplier_awarded')}배", xy=(2, v('fees', 'awarded') / 1e6 / 2 + 10),
            ha="center", fontsize=14, color="white", fontweight="bold")
ax.set_xticks(range(3), [s[0] for s in steps], fontsize=14)
ax.set_ylim(0, 340)
ax.set_ylabel("백만 달러", fontsize=13)
ax.grid(axis="y", color="#e4ded2", linewidth=0.8)
ax.set_axisbelow(True)
clean(ax)
fig.tight_layout()
fig.savefig(OUT / "fees.svg", transparent=True)
plt.close(fig)

print("remain", remain, "per_claimed", remain / v("claims", "claimed_works"),
      "per_list", remain / works)
for f in sorted(OUT.glob("*.svg")):
    print(f.name, f.stat().st_size)
