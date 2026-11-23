"""Manim 설명 영상. 렌더: manim -qm --format=mp4 build/scenes.py BookJourney OneBookInfinite"""
from manim import *

config.background_color = "#f6f3ec"
FONT = "Apple SD Gothic Neo"
INK, RED, GREEN, GOLD, GRAY = "#1d2230", "#b8322a", "#2f7a55", "#b07d1a", "#9aa0aa"


def T(s, size=28, color=INK, weight=NORMAL):
    return Text(s, font=FONT, font_size=size, color=color, weight=weight)


def card(title, sub, color, w=3.6, h=1.25):
    box = RoundedRectangle(corner_radius=0.15, width=w, height=h, stroke_color=color,
                           stroke_width=3, fill_color=color, fill_opacity=0.08)
    t = T(title, 26, INK, BOLD)
    s = T(sub, 18, "#5b6070")
    txt = VGroup(t, s).arrange(DOWN, buff=0.12).move_to(box)
    return VGroup(box, txt)


def stamp(word, color):
    r = RoundedRectangle(corner_radius=0.1, width=len(word) * 0.36 + 0.5, height=0.5,
                         stroke_color=color, stroke_width=3, fill_color=color, fill_opacity=0.15)
    return VGroup(r, T(word, 20, color, BOLD).move_to(r))


def book(color):
    return Rectangle(width=0.22, height=0.3, stroke_width=0, fill_color=color, fill_opacity=1)


class BookJourney(Scene):
    def construct(self):
        title = T("책의 여정: 같은 책, 다른 판단", 34, INK, BOLD).to_edge(UP, buff=0.4)
        self.play(FadeIn(title, shift=DOWN * 0.2), run_time=0.8)

        pir = card("해적판 다운로드", "Books3 · LibGen · PiLiMi", RED).move_to([-3.6, 1.7, 0])
        pur = card("종이책 구매 후 스캔", "수백만 권 · 원본 폐기", GREEN).move_to([3.6, 1.7, 0])
        lib = card("중앙 도서관", "'세상의 모든 책'을 '영원히'", GOLD, w=4.2).move_to([0, -0.1, 0])
        unused = card("학습에 안 쓴 사본", "지우지 않고 계속 보관", GRAY).move_to([-3.6, -2.2, 0])
        train = card("학습용 복제", "선별 → 정제 → 토큰화 → 학습", GREEN).move_to([3.6, -2.2, 0])

        self.play(LaggedStart(FadeIn(pir, shift=RIGHT * 0.3), FadeIn(pur, shift=LEFT * 0.3), lag_ratio=0.3))
        a1 = Arrow(pir.get_bottom(), lib.get_top() + LEFT * 1.0, color=GRAY, buff=0.1, stroke_width=4)
        a2 = Arrow(pur.get_bottom(), lib.get_top() + RIGHT * 1.0, color=GRAY, buff=0.1, stroke_width=4)
        self.play(GrowArrow(a1), GrowArrow(a2), FadeIn(lib), run_time=0.9)

        # 책들이 흘러 들어감
        flows = []
        for i in range(6):
            b1 = book(RED).move_to(a1.get_start())
            b2 = book(GREEN).move_to(a2.get_start())
            flows += [b1, b2]
        self.play(LaggedStart(*[MoveAlongPath(b, Line(b.get_center(), lib.get_center()), rate_func=smooth)
                                for b in flows], lag_ratio=0.12), run_time=2.2)
        self.play(*[FadeOut(b) for b in flows], run_time=0.3)

        a3 = Arrow(lib.get_bottom() + LEFT * 1.0, unused.get_top(), color=GRAY, buff=0.1, stroke_width=4)
        a4 = Arrow(lib.get_bottom() + RIGHT * 1.0, train.get_top(), color=GRAY, buff=0.1, stroke_width=4)
        self.play(GrowArrow(a3), GrowArrow(a4), FadeIn(unused), FadeIn(train), run_time=1.0)
        self.wait(0.4)

        s1 = stamp("침해 → 재판", RED).next_to(pir, UP, buff=0.12).align_to(pir, LEFT)
        s2 = stamp("공정이용 (형식 변환)", GREEN).next_to(pur, UP, buff=0.12).align_to(pur, RIGHT)
        s3 = stamp("공정이용 (매우 변형적)", GREEN).next_to(train, DOWN, buff=0.12)
        s4 = stamp("별개의 이용 = 범용 도서관", RED).next_to(unused, DOWN, buff=0.12)
        title2 = T("법원은 책이 어디서 왔고 어디에 쓰였는지로 나눠 판단했다", 26, INK)
        title2.move_to(title)
        for s in [s1, s2, s3, s4]:
            self.play(FadeIn(s, scale=1.4), run_time=0.45)
        self.play(Transform(title, title2), run_time=0.8)
        self.wait(2.0)


class OneBookInfinite(Scene):
    def construct(self):
        title = T("책 한 권 값으로 무한 학습?", 36, INK, BOLD).to_edge(UP, buff=0.45)
        self.play(FadeIn(title, shift=DOWN * 0.2), run_time=0.8)

        # 왼쪽: 사람 — 1권 = 1명
        left_lbl = T("사람의 학습", 26, INK, BOLD).move_to([-4.0, 2.3, 0])
        b = book(GOLD).scale(2.2).move_to([-4.6, 0.6, 0])
        person = VGroup(Circle(radius=0.18, color=INK, fill_opacity=1),
                        Arc(radius=0.34, start_angle=PI, angle=-PI, color=INK, stroke_width=6)
                        .shift(DOWN * 0.45)).move_to([-3.2, 0.6, 0])
        eq = T("1권 = 1명", 30, INK).move_to([-4.0, -0.6, 0])
        pay = T("구매·대출로 대가 지급", 20, "#5b6070").move_to([-4.0, -1.2, 0])
        self.play(FadeIn(left_lbl), FadeIn(b), FadeIn(person), run_time=0.8)
        self.play(Write(eq), FadeIn(pay), run_time=0.9)

        # 오른쪽: LLM — 1권 → 동시 사용자 수만큼
        right_lbl = T("LLM 학습", 26, INK, BOLD).move_to([3.9, 2.3, 0])
        rb = book(GOLD).scale(2.2).move_to([0.9, 0.3, 0])
        self.play(FadeIn(right_lbl), FadeIn(rb), run_time=0.6)
        dots = VGroup(*[Dot(radius=0.06, color=RED) for _ in range(20 * 12)])
        dots.arrange_in_grid(rows=12, cols=20, buff=0.11).move_to([3.9, -0.05, 0])
        vt = ValueTracker(0)
        counter_lbl = T("명의 '직원'이 같은 책을 쓴다", 20, RED).move_to([4.75, -1.8, 0])
        counter = always_redraw(lambda: T(f"{int(round(vt.get_value())):,}", 34, RED, BOLD)
                                .next_to(counter_lbl, LEFT, buff=0.15))
        self.add(counter)
        self.play(FadeIn(counter_lbl), run_time=0.3)
        prev = 0
        for n in [1, 10, 60, 240]:
            self.play(LaggedStart(*[FadeIn(d, scale=0.3) for d in dots[prev:n]], lag_ratio=0.02),
                      vt.animate.set_value(n), run_time=0.8)
            prev = n
        inf = T("…동시 사용자 수만큼", 22, RED).next_to(dots, UP, buff=0.12)
        self.play(FadeIn(inf), run_time=0.5)

        concl = VGroup(
            T("알섭 판결대로라면: 1권 구매 → 스캔 → 학습에 사실상 무한 이용", 22, INK),
            T("논문: 대가가 책 한 권 값에 그칠 수 없다 (Texaco 사건과 비교)", 22, GOLD, BOLD),
        ).arrange(DOWN, buff=0.18).to_edge(DOWN, buff=0.45)
        self.play(FadeIn(concl[0], shift=UP * 0.2), run_time=0.7)
        self.play(FadeIn(concl[1], shift=UP * 0.2), run_time=0.7)
        self.wait(2.2)
