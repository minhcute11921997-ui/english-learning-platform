# -*- coding: utf-8 -*-
"""
Script sinh 11 so do va bieu do thuan den trang (300 DPI)
cho Bao cao Do an Tot nghiep chuan PTIT - He thong EngLearn v2.0.
Tat ca hinh anh su dung nen trang (#FFFFFF), net den (#000000),
khong dung mau sac, phan biet chuoi du lieu bang net dut va hoa tiet hatch.
"""

import os
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Ellipse

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "report", "figures_bw")
os.makedirs(OUT_DIR, exist_ok=True)

plt.rcParams["font.family"] = "Times New Roman"
plt.rcParams["font.size"] = 10
plt.rcParams["text.color"] = "#000000"
plt.rcParams["axes.edgecolor"] = "#000000"
plt.rcParams["axes.labelcolor"] = "#000000"
plt.rcParams["xtick.color"] = "#000000"
plt.rcParams["ytick.color"] = "#000000"


def save_bw(fig, filename):
    path = os.path.join(OUT_DIR, filename)
    fig.savefig(path, dpi=300, bbox_inches="tight", facecolor="#FFFFFF", edgecolor="none")
    plt.close(fig)
    # Ep ve anh xam thuan tuy (mode 'L') de dam bao 100% khong co kenh mau
    with Image.open(path) as im:
        bw = im.convert("L")
        bw.save(path)
    print(f"Generated BW diagram: {path}")


def draw_box(ax, x, y, w, h, text, fontsize=9.5, bold=False, lw=1.1, ls="-", align="center", valign="center", pad=0.02):
    rect = FancyBboxPatch(
        (x, y), w, h,
        boxstyle=f"round,pad={pad},rounding_size=0.08",
        facecolor="#FFFFFF", edgecolor="#000000", linewidth=lw, linestyle=ls
    )
    ax.add_patch(rect)
    weight = "bold" if bold else "normal"
    tx = x + w / 2 if align == "center" else x + 0.15
    ty = y + h / 2 if valign == "center" else y + h - 0.15
    ax.text(tx, ty, text, ha=align, va=valign, fontsize=fontsize, fontweight=weight, color="#000000", family="Times New Roman")
    return rect


def draw_actor(ax, x, y, label):
    # Head
    head = Circle((x, y + 0.45), 0.16, facecolor="#FFFFFF", edgecolor="#000000", linewidth=1.2)
    ax.add_patch(head)
    # Body
    ax.plot([x, x], [y + 0.29, y - 0.15], color="#000000", linewidth=1.2)
    # Arms
    ax.plot([x - 0.22, x + 0.22], [y + 0.15, y + 0.15], color="#000000", linewidth=1.2)
    # Legs
    ax.plot([x, x - 0.18], [y - 0.15, y - 0.45], color="#000000", linewidth=1.2)
    ax.plot([x, x + 0.18], [y - 0.15, y - 0.45], color="#000000", linewidth=1.2)
    ax.text(x, y - 0.68, label, ha="center", va="top", fontsize=9.5, fontweight="bold", family="Times New Roman")


def draw_usecase(ax, x, y, w, h, label, fontsize=9):
    ell = Ellipse((x, y), w, h, facecolor="#FFFFFF", edgecolor="#000000", linewidth=1.1)
    ax.add_patch(ell)
    ax.text(x, y, label, ha="center", va="center", fontsize=fontsize, family="Times New Roman")


def draw_arrow(ax, x1, y1, x2, y2, ls="-", label="", lpos=(0, 0), fontsize=8.5):
    ax.annotate(
        "", xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle="-|>", color="#000000", lw=1.0, ls=ls, shrinkA=0, shrinkB=0)
    )
    if label:
        mx = (x1 + x2) / 2 + lpos[0]
        my = (y1 + y2) / 2 + lpos[1]
        ax.text(mx, my, label, ha="center", va="center", fontsize=fontsize, family="Times New Roman",
                bbox=dict(boxstyle="square,pad=0.1", facecolor="#FFFFFF", edgecolor="none"))


# ==============================================================================
# 1. Hinh 1.1: Duong cong quen lang Ebbinghaus & SRS
# ==============================================================================
def gen_fig_1_1():
    fig, ax = plt.subplots(figsize=(7.2, 4.0))
    t = np.linspace(0, 30, 400)
    # Khong on tap (S = 2.2)
    r_no = 100 * np.exp(-t / 2.2)
    ax.plot(t, r_no, color="#000000", linestyle=":", linewidth=1.6, label="Không ôn tập (đường cong Ebbinghaus gốc)")

    # On tap SM-2 tai ngay 1, 6, 15
    t_all = []
    r_all = []
    segments = [
        (0, 1, 2.2, 100),
        (1, 6, 7.5, 100),
        (6, 15, 18.0, 100),
        (15, 30, 45.0, 100),
    ]
    for idx, (t0, t1, s, r0) in enumerate(segments):
        ts = np.linspace(t0, t1, 100)
        rs = r0 * np.exp(-(ts - t0) / s)
        t_all.extend(ts)
        r_all.extend(rs)
        if idx < len(segments) - 1:
            ax.plot([t1, t1], [rs[-1], 100], color="#000000", linestyle="--", linewidth=1.1)

    ax.plot(t_all, r_all, color="#000000", linestyle="-", linewidth=2.0, label="Ôn tập ngắt quãng theo thuật toán SM-2")
    ax.axhline(65, color="#000000", linestyle="-.", linewidth=0.9, label="Ngưỡng duy trì trí nhớ mục tiêu (65%)")

    for day, txt in [(1, "Ôn lần 1\n(I=1 ngày)"), (6, "Ôn lần 2\n(I=6 ngày)"), (15, "Ôn lần 3\n(I=15 ngày)")]:
        ax.scatter([day], [100], color="#000000", s=24, zorder=5)
        ax.annotate(txt, xy=(day, 100), xytext=(day + 0.6, 104), fontsize=8.5, ha="left")

    ax.set_xlim(0, 30)
    ax.set_ylim(0, 118)
    ax.set_xlabel("Thời gian (ngày)", fontsize=10.5)
    ax.set_ylabel("Tỷ lệ ghi nhớ kiến thức R (%)", fontsize=10.5)
    ax.set_title("Mô phỏng đường cong quên lãng Ebbinghaus và tác động của thuật toán SM-2", fontsize=11, fontweight="bold", pad=10)
    ax.grid(True, linestyle=":", linewidth=0.5, color="#888888")
    ax.legend(loc="lower right", frameon=True, edgecolor="#000000", facecolor="#FFFFFF", fontsize=9)
    save_bw(fig, "fig_1_1_ebbinghaus_srs.png")


# ==============================================================================
# 2. Hinh 2.1: So do Use Case tong quat
# ==============================================================================
def gen_fig_2_1():
    fig, ax = plt.subplots(figsize=(8.2, 5.4))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis("off")

    # System boundary
    boundary = patches.Rectangle((2.2, 0.3), 5.6, 6.4, facecolor="#FFFFFF", edgecolor="#000000", linewidth=1.3)
    ax.add_patch(boundary)
    ax.text(5.0, 6.38, "HỆ THỐNG HỌC TỪ VỰNG TIẾNG ANH CHUYÊN NGÀNH\nMỸ THUẬT VÀ THỦ CÔNG MỸ NGHỆ", ha="center", va="center", fontsize=8.8, fontweight="bold")

    # Actors
    draw_actor(ax, 1.0, 5.1, "Khách vãng lai")
    draw_actor(ax, 1.0, 2.3, "Học viên\n(Learner)")
    draw_actor(ax, 9.0, 3.6, "Quản trị viên\n(Admin)")

    # Use cases
    ucs = [
        (5.0, 5.75, 3.4, 0.65, "Đăng ký / Đăng nhập / Google OAuth"),
        (5.0, 4.85, 3.4, 0.65, "Quản lý hồ sơ & Mục tiêu học tập"),
        (5.0, 3.95, 3.4, 0.65, "Học từ vựng theo chủ đề & Flashcard 3D"),
        (5.0, 3.05, 3.4, 0.65, "Làm bài tập củng cố 4 dạng câu hỏi"),
        (5.0, 2.15, 3.4, 0.65, "Ôn tập ngắt quãng SM-2 & Sổ từ cá nhân"),
        (5.0, 1.25, 3.4, 0.65, "Nhận diện ảnh tác phẩm bằng AI Vision"),
        (5.0, 0.55, 3.4, 0.52, "Quản trị người dùng, kho từ & Audit Log"),
    ]
    for cx, cy, cw, ch, lbl in ucs:
        draw_usecase(ax, cx, cy, cw, ch, lbl, fontsize=9)

    # Guest links
    ax.plot([1.25, 3.3], [5.15, 5.75], color="#000000", lw=1.0)
    # Learner links
    for cy in [5.75, 4.85, 3.95, 3.05, 2.15, 1.25]:
        ax.plot([1.25, 3.3], [2.4, cy], color="#000000", lw=0.95)
    # Admin links
    for cy in [5.75, 4.85, 0.55]:
        ax.plot([8.75, 6.7], [3.65, cy], color="#000000", lw=0.95)

    save_bw(fig, "fig_2_1_usecase_overview.png")


# ==============================================================================
# 3. Hinh 2.2: Use Case phan ra Hoc tap SM-2 & AI Vision
# ==============================================================================
def gen_fig_2_2():
    fig, ax = plt.subplots(figsize=(8.2, 5.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.4)
    ax.axis("off")

    boundary = patches.Rectangle((2.0, 0.3), 6.0, 5.8, facecolor="#FFFFFF", edgecolor="#000000", linewidth=1.3)
    ax.add_patch(boundary)
    ax.text(5.0, 5.85, "PHÂN HỆ HỌC TẬP SM-2 & NHẬN DIỆN AI VISION", ha="center", va="center", fontsize=10.5, fontweight="bold")

    draw_actor(ax, 0.9, 3.2, "Học viên")
    draw_actor(ax, 9.1, 1.8, "AI Vision\nMicroservice")

    draw_usecase(ax, 3.7, 5.0, 2.5, 0.65, "Học Flashcard 3D\n& phát âm IPA", fontsize=8.8)
    draw_usecase(ax, 6.5, 5.0, 2.3, 0.65, "Đánh dấu đã học\n(Tạo lịch SM-2)", fontsize=8.8)
    draw_usecase(ax, 3.7, 3.8, 2.5, 0.65, "Ôn tập từ đến hạn\nhôm nay", fontsize=8.8)
    draw_usecase(ax, 6.5, 3.8, 2.3, 0.65, "Tính EF', Interval\n(SM-2 Transaction)", fontsize=8.8)
    draw_usecase(ax, 3.7, 2.5, 2.5, 0.65, "Tải ảnh tác phẩm\nđể nhận diện AI", fontsize=8.8)
    draw_usecase(ax, 6.5, 2.5, 2.4, 0.65, "Phân loại SigLIP +\nDINOv2 & Lọc OOD", fontsize=8.8)
    draw_usecase(ax, 3.7, 1.15, 2.5, 0.65, "Xem thống kê & biểu đồ\nxu hướng học tập", fontsize=8.8)
    draw_usecase(ax, 6.5, 1.15, 2.4, 0.65, "Gửi phản hồi sửa nhãn\n(Closed-loop Feedback)", fontsize=8.5)

    for cy in [5.0, 3.8, 2.5, 1.15]:
        ax.plot([1.15, 2.45], [3.25, cy], color="#000000", lw=1.0)

    ax.plot([8.8, 7.7], [1.9, 2.5], color="#000000", lw=1.0)
    ax.plot([8.8, 7.7], [1.7, 1.15], color="#000000", lw=1.0)

    draw_arrow(ax, 4.95, 5.0, 5.35, 5.0, ls="--", label="<<include>>", lpos=(0, 0.25), fontsize=8)
    draw_arrow(ax, 4.95, 3.8, 5.35, 3.8, ls="--", label="<<include>>", lpos=(0, 0.25), fontsize=8)
    draw_arrow(ax, 4.95, 2.5, 5.30, 2.5, ls="--", label="<<include>>", lpos=(0, 0.25), fontsize=8)
    draw_arrow(ax, 6.5, 1.48, 6.5, 2.17, ls="--", label="<<extend>>", lpos=(0.7, 0), fontsize=8)

    save_bw(fig, "fig_2_2_usecase_learning_ai.png")


# ==============================================================================
# Helper cho Sequence Diagram
# ==============================================================================
def draw_sequence_diagram(filename, participants, messages, height=5.4):
    fig, ax = plt.subplots(figsize=(8.4, height))
    n = len(participants)
    xs = np.linspace(1.1, 8.9, n)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, height + 0.6)
    ax.axis("off")

    top_y = height + 0.1
    bot_y = 0.25
    for x, p_name in zip(xs, participants):
        draw_box(ax, x - 0.9, top_y - 0.35, 1.8, 0.55, p_name, fontsize=8.8, bold=True, pad=0.01)
        ax.plot([x, x], [top_y - 0.36, bot_y], color="#000000", linestyle="--", linewidth=0.9)

    y_step = (top_y - 0.7 - bot_y) / max(1, len(messages))
    for i, (src_idx, dst_idx, text, is_ret) in enumerate(messages):
        y = top_y - 0.65 - i * y_step
        x1, x2 = xs[src_idx], xs[dst_idx]
        ls = "--" if is_ret else "-"
        if src_idx == dst_idx:
            # Self-call
            ax.plot([x1, x1 + 0.55, x1 + 0.55, x1], [y, y, y - 0.22, y - 0.22], color="#000000", lw=1.0)
            ax.annotate("", xy=(x1, y - 0.22), xytext=(x1 + 0.1, y - 0.22),
                        arrowprops=dict(arrowstyle="-|>", color="#000000", lw=1.0))
            ax.text(x1 + 0.62, y - 0.11, text, ha="left", va="center", fontsize=8.3)
        else:
            draw_arrow(ax, x1, y, x2, y, ls=ls, label=text, lpos=(0, 0.16), fontsize=8.3)

    save_bw(fig, filename)


def gen_fig_2_3():
    participants = ["Client\n(React SPA)", "AuthController\n& Middleware", "AuthService", "MySQL\n(users, tokens)"]
    messages = [
        (0, 1, "1. POST /api/auth/login (email, password)", False),
        (1, 2, "2. login({ email, password })", False),
        (2, 3, "3. Kiểm tra User, is_active, locked_until", False),
        (3, 2, "4. Trả về bản ghi User", True),
        (2, 2, "5. comparePassword()\n(Lockout 5 lần sai)", False),
        (2, 3, "6. Lưu SHA-256 hash vào refresh_tokens", False),
        (2, 0, "7. Trả Access Token (JWT) + Refresh Token", True),
        (0, 1, "8. POST /api/auth/refresh (token cũ hết hạn)", False),
        (1, 2, "9. Kiểm tra revoked_at & expires_at", False),
        (2, 3, "10. Thu hồi cũ (replaced_by_hash) + cấp mới", False),
        (2, 0, "11. Trả về cặp Access + Refresh Token mới", True),
    ]
    draw_sequence_diagram("fig_2_3_seq_auth.png", participants, messages, height=6.0)


def gen_fig_2_4():
    participants = ["ReviewPage\n(React)", "ReviewController", "SrsService", "MySQL InnoDB\n(Transaction)"]
    messages = [
        (0, 1, "1. POST /api/reviews/:vocabId/answer (quality: 0..5)", False),
        (1, 2, "2. recordReviewAnswer(userId, vocabId, quality)", False),
        (2, 3, "3. BEGIN TRANSACTION + SELECT users FOR UPDATE", False),
        (2, 3, "4. SELECT user_vocab_progress FOR UPDATE", False),
        (3, 2, "5. Dữ liệu EF, interval_days, repetition_count", True),
        (2, 2, "6. calculateSM2(): cập nhật EF', I(n), status", False),
        (2, 3, "7. SAVE user_vocab_progress (last_reviewed_at)", False),
        (2, 3, "8. Xóa lịch cũ & INSERT review_schedules mới", False),
        (2, 3, "9. INSERT review_events (ghi log lịch sử ôn)", False),
        (3, 2, "10. COMMIT TRANSACTION", True),
        (2, 0, "11. Trả JSON tiến độ & ngày ôn tiếp theo", True),
    ]
    draw_sequence_diagram("fig_2_4_seq_sm2.png", participants, messages, height=6.0)


def gen_fig_2_5():
    participants = ["AiChatPage\n(Client)", "Node.js API\n(ai.controller)", "FastAPI Queue\n(Micro-batch)", "SigLIP + DINOv2\n& Probe/OOD"]
    messages = [
        (0, 1, "1. POST /api/ai/identify (Upload ảnh JPG/PNG)", False),
        (1, 2, "2. Forward ảnh tới cổng 8001 (/predict)", False),
        (2, 2, "3. Gom micro-batch (<=16 ảnh, chờ <=15ms)", False),
        (2, 3, "4. Trích xuất SigLIP (Global + Center Crop 70%)", False),
        (3, 3, "5. Kiểm tra độ mơ hồ -> kích hoạt DINOv2", False),
        (3, 3, "6. Trộn Logits + GBDT + Conformal & OOD Reject", False),
        (3, 2, "7. Top-K thuật ngữ, confidence, emb_id (Ring Buffer)", True),
        (2, 1, "8. JSON dự đoán + cờ is_ood", True),
        (1, 0, "9. Trả kết quả gợi ý từ vựng cho học viên", True),
        (0, 1, "10. POST /api/ai/feedback (Lưu bảng ai_feedback)", False),
    ]
    draw_sequence_diagram("fig_2_5_seq_ai_vision.png", participants, messages, height=5.8)


# ==============================================================================
# 7. Hinh 2.6: Activity Diagram Bai tap 4 dang
# ==============================================================================
def gen_fig_2_6():
    fig, ax = plt.subplots(figsize=(7.6, 6.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8.2)
    ax.axis("off")

    # Start node
    start = Circle((5.0, 7.8), 0.16, facecolor="#000000", edgecolor="#000000")
    ax.add_patch(start)
    draw_arrow(ax, 5.0, 7.64, 5.0, 7.22)

    draw_box(ax, 2.7, 6.62, 4.6, 0.58, "Yêu cầu tạo đề (GET /api/exercises/vocab/:topicId)", fontsize=9)
    draw_arrow(ax, 5.0, 6.62, 5.0, 6.18)

    # Decision: co attemptId hop le?
    diamond1 = patches.Polygon([[5.0, 6.18], [6.6, 5.63], [5.0, 5.08], [3.4, 5.63]],
                               facecolor="#FFFFFF", edgecolor="#000000", lw=1.1)
    ax.add_patch(diamond1)
    ax.text(5.0, 5.63, "Có attemptId\nhợp lệ?", ha="center", va="center", fontsize=8.8)

    # Yes -> Khôi phục
    draw_arrow(ax, 6.6, 5.63, 7.45, 5.63, label="Có", lpos=(0, 0.2))
    draw_box(ax, 7.45, 5.28, 2.2, 0.7, "Khôi phục đề cũ\n(ẩn correct_option)", fontsize=8.5)
    ax.plot([8.55, 8.55, 7.35], [5.28, 3.65, 3.65], color="#000000", lw=1.0)
    draw_arrow(ax, 7.45, 3.65, 7.35, 3.65)

    # No -> Sinh de moi
    draw_arrow(ax, 5.0, 5.08, 5.0, 4.65, label="Không", lpos=(0.45, 0))
    draw_box(ax, 2.2, 4.05, 5.6, 0.58, "Sinh 10 câu (4 dạng: Ảnh, Anh-Việt, Việt-Anh, Điền từ)\nLưu UUID vào bảng exercise_attempts (hết hạn 24h)", fontsize=8.6)
    draw_arrow(ax, 5.0, 4.05, 5.0, 3.65)

    draw_box(ax, 2.65, 3.05, 4.7, 0.58, "Học viên làm bài, tự động lưu nháp & bấm Nộp bài", fontsize=9)
    draw_arrow(ax, 5.0, 3.05, 5.0, 2.65)

    # Decision: Da cham hoac het han?
    diamond2 = patches.Polygon([[5.0, 2.65], [6.8, 2.1], [5.0, 1.55], [3.2, 2.1]],
                               facecolor="#FFFFFF", edgecolor="#000000", lw=1.1)
    ax.add_patch(diamond2)
    ax.text(5.0, 2.1, "Đã nộp trước đó\n(Idempotent)?", ha="center", va="center", fontsize=8.5)

    draw_arrow(ax, 6.8, 2.1, 7.45, 2.1, label="Có", lpos=(0, 0.2))
    draw_box(ax, 7.45, 1.75, 2.2, 0.7, "Trả lại kết quả\nđã lưu (không ghi đúp)", fontsize=8.3)
    ax.plot([8.55, 8.55, 6.9], [1.75, 0.5, 0.5], color="#000000", lw=1.0)

    draw_arrow(ax, 5.0, 1.55, 5.0, 1.15, label="Chưa", lpos=(0.4, 0))
    draw_box(ax, 2.2, 0.55, 5.6, 0.58, "Chấm điểm server & Transaction cập nhật SM-2 (q=4 / q=1)\nLưu attempt.result & trả giải thích chi tiết", fontsize=8.5)
    draw_arrow(ax, 5.0, 0.55, 5.0, 0.26)

    # End node
    end_outer = Circle((5.0, 0.14), 0.13, facecolor="#FFFFFF", edgecolor="#000000", lw=1.1)
    end_inner = Circle((5.0, 0.14), 0.08, facecolor="#000000", edgecolor="#000000")
    ax.add_patch(end_outer)
    ax.add_patch(end_inner)

    save_bw(fig, "fig_2_6_act_exercise.png")


# ==============================================================================
# 8. Hinh 2.7: Kien truc tong the he thong
# ==============================================================================
def gen_fig_2_7():
    fig, ax = plt.subplots(figsize=(8.4, 4.8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.8)
    ax.axis("off")

    draw_box(ax, 0.3, 3.8, 2.4, 1.5,
             "Tầng Client (SPA)\n\n• React 19 + Vite\n• Tailwind CSS v4\n• Zustand Store\n• Axios Interceptors",
             fontsize=8.8, bold=False)

    draw_box(ax, 3.3, 3.8, 1.9, 1.5,
             "Reverse Proxy\n\n• Nginx\n• Điều phối /api/*\n• Static & Uploads\n• Gzip & Security",
             fontsize=8.8)

    draw_box(ax, 5.8, 3.3, 3.8, 2.1,
             "Tầng Ứng dụng Backend (Node.js / Express 5)\n\n• Routes & Middlewares (JWT, RBAC, Rate Limit)\n• 10 Controllers (Auth, Vocab, Exercise, Review, AI, Admin)\n• Services (SrsService SM-2, AuthService, VisionService)\n• Sequelize ORM v6 (13 Models + Transactions)",
             fontsize=8.5)

    draw_box(ax, 5.8, 0.4, 3.8, 2.0,
             "Tầng Dữ liệu (MySQL 8.0 - InnoDB)\n\n• 13 bảng thực thể chuẩn 3NF\n• Khóa ngoại toàn vẹn & Composite Indexes\n• Lưu trữ users, refresh_tokens, vocabularies,\n  user_vocab_progress, exercise_attempts, ai_feedback",
             fontsize=8.4)

    draw_box(ax, 0.3, 0.4, 4.9, 2.2,
             "Dịch vụ AI Vision Microservice (Python FastAPI - Cổng 8001)\n\n• Dynamic Micro-batching Queue (batch <= 16, wait <= 15ms)\n• Dual-Backbone: SigLIP (so400m) + DINOv2 (base) trên CUDA FP16\n• Multi-Facet Linear Probe + GBDT/MoE Router + Conformal Set\n• OOD Rejection & Ring Buffer Closed-loop Feedback",
             fontsize=8.4)

    draw_arrow(ax, 2.72, 4.55, 3.28, 4.55, label="HTTPS", lpos=(0, 0.22), fontsize=8)
    draw_arrow(ax, 5.22, 4.55, 5.78, 4.55, label="HTTP", lpos=(0, 0.22), fontsize=8)
    draw_arrow(ax, 7.7, 3.28, 7.7, 2.42, label="SQL / ACID", lpos=(0.65, 0), fontsize=8)
    draw_arrow(ax, 5.78, 3.7, 4.5, 2.62, label="REST / Multipart", lpos=(-0.7, 0.15), fontsize=8)

    save_bw(fig, "fig_2_7_architecture.png")


# ==============================================================================
# 9. Hinh 2.8: So do ERD 13 bang thuc te
# ==============================================================================
def gen_fig_2_8():
    fig, ax = plt.subplots(figsize=(10.0, 6.8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8.2)
    ax.axis("off")

    def draw_entity(x, y, w, h, title, fields):
        # Header box
        rect = patches.Rectangle((x, y), w, h, facecolor="#FFFFFF", edgecolor="#000000", lw=1.0)
        ax.add_patch(rect)
        hh = 0.32
        ax.plot([x, x + w], [y + h - hh, y + h - hh], color="#000000", lw=1.0)
        ax.text(x + w / 2, y + h - hh / 2, title, ha="center", va="center", fontsize=8.3, fontweight="bold")
        ax.text(x + 0.08, y + h - hh - 0.08, "\n".join(fields), ha="left", va="top", fontsize=7.2, linespacing=1.22)

    # Column 1: Identity & Admin
    draw_entity(0.2, 5.2, 2.4, 2.5, "users", [
        "PK id (INT)",
        "username, email (UQ)",
        "password_hash, full_name",
        "role (learner | admin)",
        "email_verified, is_active",
        "failed_login_attempts",
        "locked_until, google_id",
        "learning_goal, avatar_url"
    ])
    draw_entity(0.2, 2.8, 2.4, 1.7, "refresh_tokens", [
        "PK id (INT)",
        "FK user_id -> users.id",
        "token_hash (UQ)",
        "expires_at, revoked_at",
        "replaced_by_hash"
    ])
    draw_entity(0.2, 0.5, 2.4, 1.7, "admin_audit_logs", [
        "PK id (INT)",
        "FK admin_id -> users.id",
        "action, target_type",
        "target_id, details (JSON)",
        "ip_address, created_at"
    ])

    # Column 2: Lists, Progress, AI
    draw_entity(3.2, 6.1, 2.6, 1.6, "user_vocab_lists", [
        "PK id (INT)",
        "FK user_id -> users.id",
        "name, description",
        "color"
    ])
    draw_entity(3.2, 4.1, 2.6, 1.4, "user_vocab_list_items", [
        "PK id (INT)",
        "FK list_id -> user_vocab_lists.id",
        "FK vocabulary_id -> vocabularies.id"
    ])
    draw_entity(3.2, 1.9, 2.6, 1.7, "ai_feedback", [
        "PK id (INT)",
        "FK user_id -> users.id",
        "image_hash, predicted_word",
        "corrected_word, is_correct",
        "tier, confidence"
    ])
    draw_entity(3.2, 0.2, 2.6, 1.35, "exercise_attempts", [
        "PK id (UUID)",
        "FK user_id, FK topic_id",
        "questions (JSON), result (JSON)",
        "expires_at"
    ])

    # Column 3: SM-2 Core
    draw_entity(6.4, 5.1, 2.6, 2.6, "user_vocab_progress", [
        "PK id (INT)",
        "FK user_id -> users.id",
        "FK vocabulary_id -> vocabularies.id",
        "status (new|learning|mastered)",
        "correct_count, incorrect_count",
        "ease_factor, interval_days",
        "repetition_count",
        "last_reviewed_at, next_review_at"
    ])
    draw_entity(6.4, 2.7, 2.6, 1.7, "review_schedules", [
        "PK id (INT)",
        "FK user_id -> users.id",
        "FK vocabulary_id -> vocabularies.id",
        "scheduled_at, is_completed",
        "source (personal)"
    ])
    draw_entity(6.4, 0.5, 2.6, 1.6, "review_events", [
        "PK id (INT)",
        "FK user_id -> users.id",
        "FK vocabulary_id -> vocabularies.id",
        "quality (0..5), reviewed_at"
    ])

    # Column 4: Content Core
    draw_entity(9.5, 5.7, 2.3, 2.0, "topics", [
        "PK id (INT)",
        "name (UQ), name_vi",
        "description, icon",
        "display_order"
    ])
    draw_entity(9.5, 2.5, 2.3, 2.7, "vocabularies", [
        "PK id (INT)",
        "FK topic_id -> topics.id",
        "FK created_by -> users.id",
        "word, pronunciation",
        "part_of_speech, meaning_vi",
        "image_url, cultural_note",
        "difficulty, source_type",
        "is_approved"
    ])
    draw_entity(9.35, 0.4, 2.55, 1.5, "vocab_examples", [
        "PK id (INT)",
        "FK vocabulary_id -> vocabularies.id",
        "sentence, translation"
    ])

    # Relations (clean orthogonal lines, no crossing boxes)
    def conn(x1, y1, x2, y2, lbl="1:N"):
        ax.plot([x1, x2], [y1, y2], color="#000000", lw=0.85)
        if lbl:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mx, my, lbl, fontsize=7.0, ha="center", va="center",
                    bbox=dict(boxstyle="square,pad=0.05", facecolor="#FFFFFF", edgecolor="none"))

    conn(1.4, 5.2, 1.4, 4.5, "1:N")      # users -> refresh_tokens
    ax.plot([0.2, 0.06, 0.06, 0.2], [6.0, 6.0, 1.4, 1.4], color="#000000", lw=0.85)
    ax.text(0.06, 3.7, "1:N", fontsize=7.0, ha="center", va="center",
            bbox=dict(boxstyle="square,pad=0.05", facecolor="#FFFFFF", edgecolor="none"))
    conn(2.6, 6.9, 3.2, 6.9, "1:N")       # users -> user_vocab_lists
    conn(4.5, 6.1, 4.5, 5.5, "1:N")       # lists -> list_items
    conn(2.6, 5.9, 3.2, 2.9, "1:N")       # users -> ai_feedback
    conn(2.6, 5.5, 3.2, 1.0, "1:N")       # users -> exercise_attempts
    conn(2.6, 6.4, 6.4, 6.4, "1:N")       # users -> progress
    conn(5.8, 4.8, 9.5, 4.5, "N:1")       # list_items -> vocabularies
    conn(9.0, 6.1, 9.5, 4.8, "N:1")       # progress -> vocabularies
    conn(9.0, 3.5, 9.5, 3.5, "N:1")       # schedules -> vocabularies
    conn(9.0, 1.3, 9.5, 2.9, "N:1")       # events -> vocabularies
    conn(10.65, 5.7, 10.65, 5.2, "1:N")   # topics -> vocabularies
    conn(10.65, 2.5, 10.65, 1.9, "1:N")   # vocabularies -> vocab_examples
    # exercise_attempts -> topics routed cleanly around bottom & right edge
    ax.plot([5.8, 5.8, 11.96, 11.96, 11.8], [0.2, 0.08, 0.08, 6.7, 6.7], color="#000000", lw=0.85)
    ax.text(8.9, 0.08, "N:1 (topic_id)", fontsize=7.0, ha="center", va="center",
            bbox=dict(boxstyle="square,pad=0.05", facecolor="#FFFFFF", edgecolor="none"))

    save_bw(fig, "fig_2_8_erd_13tables.png")


# ==============================================================================
# 10. Hinh 4.1: Bieu do so sanh Benchmark AI Vision
# ==============================================================================
def gen_fig_4_1():
    fig, ax = plt.subplots(figsize=(7.6, 4.3))
    metrics = ["Zero-shot\nTop-1", "Linear Probe\nTop-1", "Linear Probe\nTop-3", "Conformal\nCoverage", "OOD\nRejection"]
    before = [54.49, 73.60, 86.52, 80.34, 100.0]
    after = [90.61, 90.70, 97.36, 91.44, 97.69]

    x = np.arange(len(metrics))
    w = 0.35

    b1 = ax.bar(x - w / 2, before, w, label="Phiên bản cơ sở (n_in = 178, n_ood = 29)",
                facecolor="#FFFFFF", edgecolor="#000000", linewidth=1.1, hatch="///")
    b2 = ax.bar(x + w / 2, after, w, label="Phiên bản hoàn thiện (n_in = 2.162, n_ood = 173)",
                facecolor="#FFFFFF", edgecolor="#000000", linewidth=1.1, hatch="...")

    for bar in b1:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, h + 1.2, f"{h:.2f}%", ha="center", va="bottom", fontsize=8.5)
    for bar in b2:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, h + 1.2, f"{h:.2f}%", ha="center", va="bottom", fontsize=8.5, fontweight="bold")

    ax.set_xticks(x)
    ax.set_xticklabels(metrics, fontsize=9.5)
    ax.set_ylim(0, 114)
    ax.set_ylabel("Tỷ lệ đạt (%)", fontsize=10.5)
    ax.set_title("So sánh chỉ số đánh giá AI Vision trước và sau tối ưu mô hình", fontsize=11, fontweight="bold", pad=10)
    ax.grid(axis="y", linestyle=":", linewidth=0.5, color="#888888")
    ax.legend(loc="lower right", frameon=True, edgecolor="#000000", facecolor="#FFFFFF", fontsize=9)
    save_bw(fig, "fig_4_1_ai_benchmark.png")


# ==============================================================================
# 11. Hinh 4.2: Bieu do Per-Facet & Gold Benchmark
# ==============================================================================
def gen_fig_4_2():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(8.4, 4.1))

    # Panel 1: Per-facet
    facets = ["Chất liệu & Kỹ thuật\n(Medium, n=727)", "Thủ công mỹ nghệ\n(Craft, n=1.435)"]
    g_top1 = [84.87, 93.66]
    w_top1 = [86.24, 94.36]
    g_top3 = [95.19, 98.47]
    x1 = np.arange(len(facets))
    w1 = 0.25

    r1 = ax1.bar(x1 - w1, g_top1, w1, label="Global Top-1", facecolor="#FFFFFF", edgecolor="#000000", hatch="///")
    r2 = ax1.bar(x1, w_top1, w1, label="Within-Facet Top-1", facecolor="#FFFFFF", edgecolor="#000000", hatch="xxx")
    r3 = ax1.bar(x1 + w1, g_top3, w1, label="Global Top-3", facecolor="#FFFFFF", edgecolor="#000000", hatch="...")
    for bars in [r1, r2, r3]:
        for b in bars:
            h = b.get_height()
            ax1.text(b.get_x() + b.get_width() / 2, h + 1.0, f"{h:.1f}%", ha="center", va="bottom", fontsize=7.8)
    ax1.set_xticks(x1)
    ax1.set_xticklabels(facets, fontsize=9)
    ax1.set_ylim(50, 116)
    ax1.set_ylabel("Độ chính xác (%)", fontsize=10)
    ax1.set_title("Độ chính xác theo khía cạnh (Per-Facet)", fontsize=10, fontweight="bold")
    ax1.grid(axis="y", linestyle=":", linewidth=0.5, color="#888888")
    ax1.legend(loc="upper left", ncol=2, frameon=True, edgecolor="#000000", facecolor="#FFFFFF", fontsize=7.8)

    # Panel 2: Gold benchmark by source
    sources = ["Cleveland CMA\n(n=58)", "V&A London\n(n=13)", "Wikimedia\n(n=13)", "Tổng Gold\n(n=87)"]
    gold_t1 = [82.76, 76.92, 84.62, 81.61]
    gold_t3 = [98.28, 92.31, 100.0, 97.70]
    x2 = np.arange(len(sources))
    w2 = 0.34

    g1 = ax2.bar(x2 - w2 / 2, gold_t1, w2, label="Probe Top-1", facecolor="#FFFFFF", edgecolor="#000000", hatch="///")
    g2 = ax2.bar(x2 + w2 / 2, gold_t3, w2, label="Probe Top-3", facecolor="#FFFFFF", edgecolor="#000000", hatch="...")
    for bars in [g1, g2]:
        for b in bars:
            h = b.get_height()
            ax2.text(b.get_x() + b.get_width() / 2, h + 1.0, f"{h:.1f}%", ha="center", va="bottom", fontsize=7.8)
    ax2.set_xticks(x2)
    ax2.set_xticklabels(sources, fontsize=8.5)
    ax2.set_ylim(50, 116)
    ax2.set_title("Đánh giá trên tập Gold Benchmark độc lập", fontsize=10, fontweight="bold")
    ax2.grid(axis="y", linestyle=":", linewidth=0.5, color="#888888")
    ax2.legend(loc="upper left", ncol=2, frameon=True, edgecolor="#000000", facecolor="#FFFFFF", fontsize=8)

    fig.tight_layout(pad=1.5)
    save_bw(fig, "fig_4_2_ai_facet_gold.png")


if __name__ == "__main__":
    gen_fig_1_1()
    gen_fig_2_1()
    gen_fig_2_2()
    gen_fig_2_3()
    gen_fig_2_4()
    gen_fig_2_5()
    gen_fig_2_6()
    gen_fig_2_7()
    gen_fig_2_8()
    gen_fig_4_1()
    gen_fig_4_2()
    print("All 11 black-and-white diagrams generated successfully!")
