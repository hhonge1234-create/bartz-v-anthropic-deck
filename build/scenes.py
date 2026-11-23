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


class TrainingCopies(Scene):
    """학습 과정의 복제 4단계 (판결문 6–7쪽). 토큰 번호는 설명용 예시."""

    def construct(self):
        title = T("학습은 복제의 연속이다", 36, INK, BOLD).to_edge(UP, buff=0.4)
        self.play(FadeIn(title, shift=DOWN * 0.2), run_time=0.7)

        def page(color=INK, header=True):
            r = RoundedRectangle(corner_radius=0.08, width=1.6, height=2.1, stroke_color=color, stroke_width=3,
                                 fill_color="#fffdf9", fill_opacity=1)
            lines = VGroup(*[Line(LEFT * 0.55, RIGHT * 0.55, stroke_width=4, color="#9aa0aa") for _ in range(6)])
            lines.arrange(DOWN, buff=0.2).move_to(r)
            g = VGroup(r, lines)
            if header:
                hd = Line(LEFT * 0.55, RIGHT * 0.55, stroke_width=4, color=RED).next_to(r.get_top(), DOWN, buff=0.15)
                ft = Line(LEFT * 0.3, RIGHT * 0.3, stroke_width=4, color=RED).next_to(r.get_bottom(), UP, buff=0.15)
                lines.shift(DOWN * 0.05).scale(0.85)
                g.add(hd, ft)
            return g

        xs = [-5.2, -1.75, 1.75, 5.2]
        labels = ["① 도서관에서 복사", "② 정제", "③ 토큰화", "④ 모델 학습"]
        subs = ["학습용 '데이터 믹스'에 넣을\n작업 사본을 만든다", "머리말·꼬리말·쪽번호를\n지운 정제본", "글을 숫자 조각(토큰)으로\n바꿔 반복 복제", "모델이 작품을 거의\n그대로 '암기'"]

        src = page(GOLD).move_to([xs[0], 0.35, 0])
        cap = T(labels[0], 24, INK, BOLD).next_to(src, DOWN, buff=0.3)
        sub = T(subs[0], 17, "#5b6070").next_to(cap, DOWN, buff=0.12)
        self.play(FadeIn(src, shift=UP * 0.2), FadeIn(cap), FadeIn(sub), run_time=0.8)

        cleaned = page(INK).move_to([xs[1], 0.35, 0])
        a1 = Arrow([xs[0] + 1.0, 0.35, 0], [xs[1] - 1.0, 0.35, 0], color=GRAY, buff=0, stroke_width=5)
        self.play(GrowArrow(a1), TransformFromCopy(src, cleaned), run_time=0.9)
        # 머리말·꼬리말 제거
        self.play(*[FadeOut(m, scale=0.5) for m in cleaned[2:]], run_time=0.6)
        cap2 = T(labels[1], 24, INK, BOLD).next_to(cleaned, DOWN, buff=0.3)
        sub2 = T(subs[1], 17, "#5b6070").next_to(cap2, DOWN, buff=0.12)
        self.play(FadeIn(cap2), FadeIn(sub2), run_time=0.5)

        a2 = Arrow([xs[1] + 1.0, 0.35, 0], [xs[2] - 1.0, 0.35, 0], color=GRAY, buff=0, stroke_width=5)
        toks = VGroup(*[RoundedRectangle(corner_radius=0.06, width=0.95, height=0.38, stroke_color=BLUE_D,
                                         stroke_width=2, fill_color="#e7eefb", fill_opacity=1) for _ in range(8)])
        toks.arrange_in_grid(rows=4, cols=2, buff=0.12).move_to([xs[2], 0.35, 0])
        nums = ["3021", "88", "1405", "7", "562", "9310", "41", "2788"]
        tnums = VGroup(*[T(n, 18, INK).move_to(t) for n, t in zip(nums, toks)])
        self.play(GrowArrow(a2), run_time=0.5)
        self.play(LaggedStart(*[FadeIn(VGroup(t, n), scale=0.6) for t, n in zip(toks, tnums)], lag_ratio=0.1), run_time=1.0)
        cap3 = T(labels[2], 24, INK, BOLD).next_to(toks, DOWN, buff=0.45)
        sub3 = T(subs[2], 17, "#5b6070").next_to(cap3, DOWN, buff=0.12)
        self.play(FadeIn(cap3), FadeIn(sub3), run_time=0.5)

        a3 = Arrow([xs[2] + 1.15, 0.35, 0], [xs[3] - 1.15, 0.35, 0], color=GRAY, buff=0, stroke_width=5)
        layers = [3, 4, 3]
        nodes = []
        for li, n in enumerate(layers):
            col = VGroup(*[Circle(radius=0.13, color=GREEN, fill_opacity=0.9) for _ in range(n)]).arrange(DOWN, buff=0.32)
            col.move_to([xs[3] - 0.8 + li * 0.8, 0.35, 0])
            nodes.append(col)
        edges = VGroup(*[Line(a.get_center(), b.get_center(), stroke_width=1.5, color="#9aa0aa")
                         for i in range(len(nodes) - 1) for a in nodes[i] for b in nodes[i + 1]])
        self.play(GrowArrow(a3), run_time=0.5)
        self.play(Create(edges), *[FadeIn(c) for c in nodes], run_time=1.0)
        flying = tnums.copy()
        self.play(LaggedStart(*[f.animate.move_to(nodes[1][i % 4].get_center()).scale(0.2).set_opacity(0)
                                for i, f in enumerate(flying)], lag_ratio=0.08), run_time=1.2)
        cap4 = T(labels[3], 24, INK, BOLD).next_to(VGroup(*nodes), DOWN, buff=0.45)
        sub4 = T(subs[3], 17, "#5b6070").next_to(cap4, DOWN, buff=0.12)
        self.play(FadeIn(cap4), FadeIn(sub4), run_time=0.5)

        note = T("하지만 Claude 서비스의 입·출력 필터가 침해 결과물이 사용자에게 가는 것을 막았다", 22, GREEN, BOLD)
        note.to_edge(DOWN, buff=0.45)
        self.play(FadeIn(note, shift=UP * 0.2), run_time=0.8)
        self.wait(2.0)
