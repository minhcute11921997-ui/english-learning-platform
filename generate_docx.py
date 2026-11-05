# -*- coding: utf-8 -*-
"""
Script tao file DOCX: Tong hop Cong nghe va Chuc nang he thong EngLearn
Dung luong gon gang, day du, suc tich, trinh bay chuan hoc thuat/do an tot nghiep.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, border_color="CBD5E1"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_document():
    doc = docx.Document()

    # Set page margins: 2cm top/bottom, 2.2cm left/right
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Styles
    COLOR_PRIMARY = RGBColor(30, 58, 138)     # Navy #1E3A8A
    COLOR_SECONDARY = RGBColor(2, 132, 199)   # Sky/Teal #0284C7
    COLOR_TEXT = RGBColor(31, 41, 55)         # Charcoal #1F2937
    COLOR_MUTED = RGBColor(100, 116, 139)     # Slate #64748B

    # Normal style
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Arial'
    style_normal.font.size = Pt(10.5)
    style_normal.font.color.rgb = COLOR_TEXT
    style_normal.paragraph_format.line_spacing = 1.2
    style_normal.paragraph_format.space_after = Pt(4)

    # Header / Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    title_p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = title_p.add_run("BÁO CÁO TỔNG HỢP KIẾN TRÚC & ĐẶC TẢ HỆ THỐNG\n")
    run_sub.font.name = 'Arial'
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_MUTED

    run_title = title_p.add_run("ENGLEARN - NỀN TẢNG HỌC TIẾNG ANH THÔNG MINH\nCÔNG NGHỆ SỬ DỤNG VÀ DANH MỤC CHỨC NĂNG HỆ THỐNG")
    run_title.font.name = 'Arial'
    run_title.font.size = Pt(16)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    # Subtitle note box
    note_p = doc.add_paragraph()
    note_p.paragraph_format.space_after = Pt(14)
    note_p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_meta = note_p.add_run("Phiên bản: 1.0.0 (Release Master)  |  Đối tượng: Học sinh, người mất gốc, Trưởng nhóm học tập & Admin\nĐặc điểm: Liệt kê đầy đủ 100% chức năng & công nghệ theo phong cách súc tích, ngắn gọn, chuẩn đồ án.")
    r_meta.font.name = 'Arial'
    r_meta.font.size = Pt(9.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = COLOR_MUTED

    # Helper function for Headings
    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = 'Arial'
        r.font.size = Pt(13.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = 'Arial'
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_SECONDARY
        return h

    def add_bullet(p_or_text, bold_prefix="", text=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.bold = True
            r_bold.font.color.rgb = COLOR_TEXT
        if text:
            r_text = p.add_run(text)
            r_text.font.color.rgb = COLOR_TEXT
        return p

    # =========================================================================
    # PHẦN 1: CÔNG NGHỆ SỬ DỤNG & KIẾN TRÚC HỆ THỐNG
    # =========================================================================
    add_h1("PHẦN 1. TỔNG HỢP CÔNG NGHỆ & KIẾN TRÚC HỆ THỐNG (TECH STACK)")
    
    p_intro_tech = doc.add_paragraph()
    p_intro_tech.add_run(
        "Hệ thống EngLearn được xây dựng theo kiến trúc phân tầng chuẩn RESTful API, "
        "tách biệt hoàn toàn giữa Frontend (Single Page Application) và Backend API Server, "
        "đảm bảo tính độc lập, hiệu năng cao và khả năng mở rộng linh hoạt."
    )

    add_h2("1.1. Bảng công nghệ cốt lõi theo từng phân tầng")

    # Table Tech Stack
    tech_table = doc.add_table(rows=1, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_table.autofit = False
    set_table_borders(tech_table)

    col_widths = [Inches(1.5), Inches(2.2), Inches(3.3)]
    headers = ["Phân tầng", "Công nghệ / Thư viện", "Vai trò & Đặc tính kỹ thuật nổi bật"]
    
    hdr_cells = tech_table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(hdr_cells[i], "1E3A8A")
        set_cell_margins(hdr_cells[i], top=100, bottom=100)

    tech_data = [
        ("Frontend Client", "React 19, JavaScript (ESNext)", "Xây dựng giao diện tương tác người dùng dạng Single Page Application (SPA), component hóa linh hoạt."),
        ("Frontend Tooling", "Vite 6", "Build tool thế hệ mới với Hot Module Replacement (HMR) cực nhanh, tối ưu hóa bundle size production."),
        ("Giao diện & UI/UX", "Tailwind CSS v4, Heroicons, CSS Transitions", "Hệ thống Utility-first CSS xây dựng responsive đa màn hình (Mobile, Tablet, Desktop), hiệu ứng lật thẻ 3D mượt mà."),
        ("Quản lý trạng thái", "Zustand Store", "State management tập trung, cực nhẹ, lưu trữ phiên đăng nhập (Auth), từ vựng và tiến độ học tức thời."),
        ("Định tuyến Client", "React Router DOM v7", "Quản lý router linh hoạt, bảo vệ route phân quyền (Protected Routes) ngăn truy cập trái phép."),
        ("HTTP Client", "Axios", "Đóng gói request gọi API với Interceptors tự động đính kèm JWT Bearer Token và bắt lỗi mạng tập trung."),
        ("Hiển thị phản hồi", "React Hot Toast", "Hộp thông báo tương tác (toast notifications) trực quan cho các hành động học tập và báo lỗi hệ thống."),
        ("Backend Server", "Node.js (>=18), Express.js 5", "Nền tảng xử lý bất đồng bộ non-blocking I/O; Express 5 cung cấp kiến trúc RESTful API tối ưu."),
        ("Cơ sở dữ liệu", "MySQL 8.0", "Hệ quản trị CSDL quan hệ tin cậy, lưu trữ 16 bảng thực thể với ràng buộc khóa ngoại (Foreign Keys) toàn vẹn."),
        ("ORM (Ánh xạ CSDL)", "Sequelize ORM", "Định nghĩa Models, Associations, tự động sinh truy vấn an toàn chống SQL Injection bằng Parameterized Queries."),
        ("Bảo mật & Xác thực", "JWT (JSON Web Token), bcryptjs", "Xác thực không trạng thái (Stateless Authentication), mã hóa băm mật khẩu an toàn với salt rounds."),
        ("DevOps & Đóng gói", "Docker, Docker Compose, Nginx", "Đóng gói toàn bộ Backend, Frontend, MySQL vào container; Nginx đóng vai trò Reverse Proxy điều phối port."),
        ("Kiến trúc Mã nguồn", "Controller - Service - Model - Route", "Tách bạch rõ rệt giữa điều hướng (Route), kiểm soát luồng (Controller), nghiệp vụ logic (Service) và dữ liệu (Model).")
    ]

    for row_idx, row_item in enumerate(tech_data):
        row = tech_table.add_row()
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for c_idx, text in enumerate(row_item):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=80, bottom=80)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(text)
                r.font.bold = True
                r.font.size = Pt(9.5)
            elif c_idx == 1:
                r = p.add_run(text)
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = COLOR_SECONDARY
            else:
                r = p.add_run(text)
                r.font.size = Pt(9.5)

    add_h2("1.2. Các thuật toán & cơ chế kỹ thuật thông minh cốt lõi")
    add_bullet(None, "1. Thuật toán Lặp lại ngắt quãng SuperMemo 2 (SM-2): ", 
               "Tính toán ngày ôn tập tối ưu để giải quyết triệt để vấn đề 'học trước quên sau'. Sử dụng hệ số dễ Ease Factor (EF >= 1.3), tự động dời lịch ôn 1 ngày, 6 ngày hoặc theo công thức I = I_truoc * EF dựa trên chất lượng tự đánh giá q (0 đến 5). Khi đạt repetition >= 4 và khoảng cách >= 15 ngày, từ vựng tự động được công nhận 'Đã làm chủ' (Mastered).")
    add_bullet(None, "2. Thuật toán Gợi ý bài đọc thông minh (Recommendation Engine): ", 
               "Tự động đối chiếu điểm bài kiểm tra đầu vào (Level Matching) để đề xuất bài đọc đúng cấp độ (Easy, Medium, Hard); tự động lọc bỏ các bài đã hoàn thành; đồng thời phân tích khoảng trống kiến thức (Learning Gap Analysis) dựa trên tỷ lệ từ vựng chưa học ở từng chủ đề để gợi ý bài đọc bù đắp.")
    add_bullet(None, "3. Bộ sinh câu hỏi trắc nghiệm tự động (Auto Quiz Generator): ", 
               "Sinh động 10 câu hỏi trắc nghiệm từ kho từ vựng của chủ đề với 3 dạng: Nghĩa Anh-Việt, Nghĩa Việt-Anh, Điền từ vào câu ví dụ ngữ cảnh (Fill in blank); tự động trích xuất các đáp án gây nhiễu (distractors) từ các từ cùng chủ đề.")
    add_bullet(None, "4. Cơ chế bảo mật đa tầng: ", 
               "Bảo mật đề thi (chỉ gửi câu hỏi và các phương án, tuyệt đối giấu đáp án đúng ở client); Middleware RBAC phân quyền chặt chẽ; ngăn chặn SQL Injection 100% qua Sequelize; chống bấm lặp (Anti Double-Submission) và xử lý lỗi tập trung qua AppError.")

    # =========================================================================
    # PHẦN 2: MA TRẬN PHÂN QUYỀN HỆ THỐNG
    # =========================================================================
    add_h1("PHẦN 2. MA TRẬN PHÂN QUYỀN HỆ THỐNG (ROLE MATRIX)")
    p_role_intro = doc.add_paragraph()
    p_role_intro.add_run(
        "Hệ thống phân định rõ ràng quyền hạn giữa 4 vai trò tác nhân: "
        "Khách vãng lai (Guest), Học viên (Learner), Trưởng nhóm học tập (Group Owner) và Quản trị viên (Admin)."
    )

    role_table = doc.add_table(rows=1, cols=5)
    role_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    role_table.autofit = False
    set_table_borders(role_table)

    r_widths = [Inches(3.4), Inches(0.9), Inches(0.9), Inches(1.0), Inches(0.8)]
    r_headers = ["Nhóm chức năng / Hành động", "Khách (Guest)", "Học viên (Learner)", "Trưởng nhóm (Owner)", "Admin"]
    
    r_hdr_cells = role_table.rows[0].cells
    for i, title in enumerate(r_headers):
        r_hdr_cells[i].width = r_widths[i]
        p = r_hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(r_hdr_cells[i], "1E3A8A")
        set_cell_margins(r_hdr_cells[i], top=90, bottom=90)

    role_data = [
        ("Đăng ký, Đăng nhập, Xem trang chủ giới thiệu", "Có", "Có", "Có", "Có"),
        ("Làm bài kiểm tra đánh giá trình độ đầu vào", "Không", "Có", "Có", "Có"),
        ("Tra cứu & Xem danh mục từ vựng theo chủ đề", "Không", "Có", "Có", "Có"),
        ("Học Flashcard lật 3D & Làm bài tập củng cố", "Không", "Có", "Có", "Có"),
        ("Ôn tập ngắt quãng thông minh (SM-2 hàng ngày)", "Không", "Có", "Có", "Có"),
        ("Luyện đọc hiểu song ngữ & Làm trắc nghiệm bài đọc", "Không", "Có", "Có", "Có"),
        ("Nhận bài đọc gợi ý & Phân tích khoảng trống kiến thức", "Không", "Có", "Có", "Có"),
        ("Tạo nhóm học tập & Quản lý thành viên nhóm", "Không", "Không", "Có", "Có"),
        ("Tạo bộ từ vựng riêng của nhóm & Giao bài đọc nhóm", "Không", "Không", "Có", "Có"),
        ("Tham gia nhóm học tập thông qua mã mời (Invite Code)", "Không", "Có", "Có", "Có"),
        ("Gửi bài đóng góp cộng đồng (UGC) & Upvote bài hay", "Không", "Có", "Có", "Có"),
        ("Quản lý tài khoản người dùng (Khóa/Mở, Phân quyền)", "Không", "Không", "Không", "Có"),
        ("Quản lý danh mục Chủ đề, Từ vựng, Bài đọc & Câu hỏi (CMS)", "Không", "Không", "Không", "Có"),
        ("Kiểm duyệt bài viết cộng đồng (Duyệt / Từ chối)", "Không", "Không", "Không", "Có"),
        ("Xem bảng thống kê & Báo cáo tổng thể toàn hệ thống", "Không", "Không", "Không", "Có")
    ]

    for row_idx, r_item in enumerate(role_data):
        row = role_table.add_row()
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(r_item):
            cell = row.cells[c_idx]
            cell.width = r_widths[c_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=70, bottom=70)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                r = p.add_run(val)
                r.font.size = Pt(9.5)
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(val)
                r.font.size = Pt(9.5)
                if val == "Có":
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(16, 149, 74) # Green
                else:
                    r.font.color.rgb = RGBColor(156, 163, 175) # Gray

    # =========================================================================
    # PHẦN 3: DANH MỤC ĐẦY ĐỦ 13 PHÂN HỆ CHỨC NĂNG
    # =========================================================================
    add_h1("PHẦN 3. DANH MỤC CHI TIẾT 13 PHÂN HỆ CHỨC NĂNG (ĐẦY ĐỦ & NGẮN GỌN)")
    p_module_intro = doc.add_paragraph()
    p_module_intro.add_run(
        "Dưới đây là bản đặc tả đầy đủ 100% các tính năng của 13 phân hệ, được trình bày súc tích "
        "theo định hướng hành động người dùng, quy tắc xử lý hệ thống và thành phần kỹ thuật tương ứng."
    )

    modules_data = [
        {
            "id": 1,
            "name": "Phân hệ Xác thực & Quản lý Tài khoản (Authentication & Profile)",
            "goal": "Định danh an toàn, duy trì phiên làm việc Stateless JWT, cá nhân hóa mục tiêu học tập hàng ngày.",
            "features": [
                ("Đăng ký tài khoản (Register): ", "Xác thực dữ liệu đầu vào (Email chuẩn regex, mật khẩu >= 6 ký tự, username duy nhất), mã hóa mật khẩu bằng bcryptjs, tự động tạo hồ sơ học viên."),
                ("Đăng nhập an toàn (Login): ", "Kiểm tra email, mật khẩu khớp băm, kiểm tra trạng thái kích hoạt tài khoản (is_active), cấp phát JWT Access Token và lưu trữ trạng thái người dùng tại Zustand Store."),
                ("Điều hướng thông minh sau đăng nhập: ", "Tự động phát hiện nếu học viên mới chưa làm bài kiểm tra đầu vào (initial_level == null) để cưỡng chế điều hướng tới trang khảo sát; ngược lại chuyển thẳng tới Dashboard."),
                ("Đăng xuất (Logout): ", "Xóa sạch JWT token trên Client, làm rỗng state Auth Store và chuyển hướng an toàn về màn hình đăng nhập."),
                ("Hồ sơ cá nhân & Đổi thông tin (User Profile): ", "Xem Avatar, Cấp độ, Ngày tham gia; cập nhật Họ tên hiển thị; đổi mật khẩu yêu cầu xác thực mật khẩu cũ."),
                ("Cài đặt mục tiêu học tập (Daily Goal & Streak): ", "Tùy chỉnh số lượng từ vựng cần học mỗi ngày (5 - 50 từ/ngày, mặc định 10); tự động tính toán và lưu vết chuỗi ngày học liên tục (Streak Counter).")
            ],
            "api_ui": "API: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me, PUT /api/users/profile, PUT /api/users/change-password | UI: LoginPage, RegisterPage, ProfilePage"
        },
        {
            "id": 2,
            "name": "Phân hệ Đánh giá Trình độ Đầu vào (Placement Assessment Test)",
            "goal": "Khảo sát chính xác năng lực tiếng Anh ban đầu để cá nhân hóa toàn bộ tài liệu học tập ngay từ đầu.",
            "features": [
                ("Ngân hàng đề thi chuẩn hóa: ", "Bộ đề gồm 30 câu hỏi trắc nghiệm đa cấp độ bao quát ngữ pháp, từ vựng và cấu trúc câu."),
                ("Cơ chế bảo mật chống gian lận đề thi: ", "API chỉ gửi nội dung câu hỏi và danh sách phương án lựa chọn, tuyệt đối không gửi đáp án đúng và lời giải thích xuống Client trong quá trình làm bài."),
                ("Trải nghiệm làm bài trực quan: ", "Thanh tiến trình hoàn thành (x/30), cho phép linh hoạt chuyển câu, đổi đáp án trước khi nộp, cảnh báo nếu nộp bài khi còn câu chưa chọn."),
                ("Thuật toán chấm điểm & Phân cấp tự động: ", "Tự động phân loại chính xác thành 3 cấp độ: Pre-Intermediate (>= 22/30 câu đúng), Elementary (12 - 21 câu đúng), Beginner (< 12 câu đúng)."),
                ("Báo cáo phân tích kết quả chi tiết: ", "Hiển thị điểm số, phần trăm, cấp độ đạt được; đối chiếu đáp án học viên chọn với đáp án chuẩn kèm lời giải thích ngữ pháp chi tiết bằng tiếng Việt.")
            ],
            "api_ui": "API: GET /api/assessment/questions, POST /api/assessment/submit, GET /api/assessment/history | UI: AssessmentPage"
        },
        {
            "id": 3,
            "name": "Phân hệ Khám phá & Quản lý Từ vựng theo Chủ đề (Vocabulary by Topics)",
            "goal": "Cung cấp kho từ vựng thông dụng phân theo các chủ đề thiết thực, cấu trúc sư phạm trực quan.",
            "features": [
                ("7 Chủ đề học tập cốt lõi: ", "Bao gồm Daily Life, Education & Study, Travel & Holidays, Work & Business, Food & Dining, Technology & Media, Health & Sports."),
                ("Dữ liệu từ vựng chi tiết & chuẩn hóa: ", "Mỗi từ gồm: Từ gốc tiếng Anh, phiên âm quốc tế IPA, loại từ (Noun, Verb, Adj...), nghĩa tiếng Việt, phân loại độ khó (Easy, Medium, Hard), câu ví dụ ngữ cảnh song ngữ."),
                ("Bộ lọc & Tra cứu nhanh: ", "Tìm kiếm tức thời (real-time) theo từ tiếng Anh hoặc nghĩa tiếng Việt, lọc theo cấp độ khó."),
                ("Theo dõi tiến độ theo chủ đề: ", "Hiển thị thanh tiến trình trực quan số từ đã học / tổng số từ trong từng chủ đề.")
            ],
            "api_ui": "API: GET /api/topics, GET /api/topics/:id, GET /api/vocabularies, GET /api/vocabularies/:id | UI: TopicsPage, TopicDetailPage"
        },
        {
            "id": 4,
            "name": "Phân hệ Học từ vựng tương tác qua Thẻ ghi nhớ (Flashcards)",
            "goal": "Tối ưu hóa khả năng ghi nhớ thị giác thông qua thẻ học 2 mặt tương tác trực quan.",
            "features": [
                ("Giao diện thẻ Flashcard 3D lật 2 mặt: ", "Mặt trước hiển thị từ tiếng Anh, phiên âm IPA, loại từ; Mặt sau hiển thị nghĩa tiếng Việt, câu ví dụ in đậm từ khóa và bản dịch song ngữ."),
                ("Điều hướng & Phím tắt tiện lợi: ", "Hỗ trợ click/chạm để lật thẻ; hỗ trợ phím tắt bàn phím (Phím Space để lật, phím Mũi tên trái/phải để chuyển thẻ Trước/Tiếp); thanh tiến độ đếm thẻ hiện tại."),
                ("Đánh dấu học từ (Mark as Learned): ", "Ghi nhận trạng thái học vào UserVocabProgress, tự động tạo bản ghi ReviewSchedule để đưa từ vào chu trình ôn tập ngắt quãng SM-2, đồng thời cập nhật Daily Goal.")
            ],
            "api_ui": "API: POST /api/vocabularies/:id/learn | UI: FlashcardPage"
        },
        {
            "id": 5,
            "name": "Phân hệ Luyện tập & Đánh giá Củng cố Từ vựng (Exercise Generator)",
            "goal": "Tự động sinh bài tập trắc nghiệm đa dạng giúp khắc sâu kiến thức ngay sau phiên học Flashcard.",
            "features": [
                ("Bộ sinh bài tập tự động (Auto Quiz): ", "Tự động lấy ngẫu nhiên 10 từ vựng trong chủ đề vừa học để tạo bài tập, tự động trích xuất các đáp án gây nhiễu (distractors) hợp lý từ các từ khác trong chủ đề."),
                ("3 Dạng bài tập trắc nghiệm kết hợp: ", "1) Nghĩa Anh -> Việt (chọn nghĩa đúng từ 4 đáp án); 2) Nghĩa Việt -> Anh (chọn từ tiếng Anh đúng); 3) Điền từ vào câu ngữ cảnh (Fill in the blank câu ví dụ ẩn từ khóa)."),
                ("Chấm điểm & Phản hồi tức thì: ", "Hiển thị màu sắc xanh/đỏ trực quan, giải thích đáp án ngay khi chọn, thống kê số câu đúng/sai và đồng bộ số lần làm đúng/sai vào dữ liệu cá nhân.")
            ],
            "api_ui": "API: GET /api/exercises/topic/:topicId, POST /api/exercises/submit | UI: ExercisePage"
        },
        {
            "id": 6,
            "name": "Phân hệ Hệ thống Ôn tập Ngắt quãng Thông minh (Spaced Repetition SM-2)",
            "goal": "Ứng dụng thuật toán SuperMemo 2 khoa học tính toán chính xác điểm rơi trí nhớ để nhắc nhở học viên ôn tập kịp thời.",
            "features": [
                ("Thang đánh giá chất lượng phản xạ (q = 0 đến 5): ", "Học viên tự đánh giá mức độ ghi nhớ sau mỗi lần lật thẻ ôn tập: 0 (Quên hoàn toàn), 1-2 (Nhớ sai), 3 (Khó), 4 (Tốt), 5 (Rất dễ)."),
                ("Điều chỉnh Hệ số Dễ (Ease Factor - EF): ", "Tự động tính lại EF sau mỗi lần ôn: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02)), chặn dưới EF >= 1.3, mặc định khởi tạo 2.5."),
                ("Tự động tính khoảng cách ngày ôn (Interval - I): ", "Nếu q < 3: reset chuỗi lặp = 0, ôn lại sau 1 ngày; Nếu q >= 3: lần 1 = 1 ngày, lần 2 = 6 ngày, từ lần 3 trở đi I = I_truoc * EF."),
                ("Tự động công nhận Làm chủ (Mastered): ", "Từ vựng tự động chuyển trạng thái sang 'mastered' khi đạt chuỗi nhớ đúng >= 4 lần và khoảng cách ngày giãn cách >= 15 ngày."),
                ("Danh sách ôn tập hôm nay & Biểu đồ dự báo: ", "Lọc danh sách các từ có next_review_at đến hạn hôm nay; biểu đồ dự báo số lượng từ cần ôn tập trong 7 ngày tiếp theo để học viên chủ động thời gian.")
            ],
            "api_ui": "API: GET /api/reviews/today, GET /api/reviews/forecast, POST /api/reviews/answer, GET /api/reviews/stats | UI: ReviewPage"
        },
        {
            "id": 7,
            "name": "Phân hệ Luyện Kỹ năng Đọc hiểu & Trắc nghiệm Ngữ cảnh (Reading Comprehension)",
            "goal": "Ứng dụng từ vựng vào các văn bản hoàn chỉnh, rèn luyện tư duy ngữ cảnh và kỹ năng đọc hiểu thực tế.",
            "features": [
                ("Thư viện bài đọc phân cấp: ", "Kho bài đọc phân theo chủ đề và 3 mức độ (Easy, Medium, Hard), hiển thị thời gian đọc ước tính và số lượng từ."),
                ("Chế độ đọc song ngữ thông minh: ", "Giao diện hiển thị văn bản tiếng Anh chuẩn; tích hợp nút bật/tắt bản dịch tiếng Việt song song giúp học viên đối chiếu ngữ nghĩa câu khó."),
                ("Bộ câu hỏi trắc nghiệm đọc hiểu đính kèm: ", "Mỗi bài đọc có 3-5 câu hỏi trắc nghiệm kiểm tra thông tin chi tiết, ý chính và suy luận, kèm đồng hồ bấm giờ làm bài."),
                ("Chấm điểm & Lưu vết nỗ lực: ", "Chấm điểm tự động khi nộp bài, phân tích chi tiết đáp án kèm giải thích, lưu lịch sử lượt làm (UserReadingAttempt) và ghi nhận điểm số cao nhất.")
            ],
            "api_ui": "API: GET /api/readings, GET /api/readings/:id, POST /api/readings/:id/submit | UI: ReadingListPage, ReadingDetailPage"
        },
        {
            "id": 8,
            "name": "Phân hệ Thuật toán Gợi ý Bài đọc Thông minh (Recommendation Engine)",
            "goal": "Cá nhân hóa tài liệu đọc phù hợp nhất với năng lực và quá trình học tập thực tế của từng học viên.",
            "features": [
                ("Gợi ý theo Trình độ năng lực đầu vào: ", "Căn cứ điểm đánh giá ban đầu để ưu tiên bài đọc tương ứng: Điểm >= 75 gợi ý mức Hard, 50-74 gợi ý mức Medium, < 50 gợi ý mức Easy."),
                ("Tự động loại trừ bài đã hoàn thành: ", "Tự động truy vấn và loại bỏ các bài đọc học viên đã từng làm bài kiểm tra trong quá khứ, đảm bảo bài gợi ý luôn mới mẻ."),
                ("Cơ chế dự phòng linh hoạt (Fallback): ", "Nếu bài đọc đúng trình độ đã học hết, hệ thống tự động bổ sung bài đọc chưa làm ở cấp độ lân cận."),
                ("Phân tích khoảng trống kiến thức (Learning Gap Analysis): ", "Thống kê tỷ lệ từ vựng đã học trên từng chủ đề, phát hiện các chủ đề học viên còn yếu hoặc bỏ bê để đề xuất bài đọc thuộc chủ đề đó nhằm lấp đầy lỗ hổng kiến thức.")
            ],
            "api_ui": "API: GET /api/readings/recommended, GET /api/stats/gaps | UI: DashboardPage, ReadingListPage"
        },
        {
            "id": 9,
            "name": "Phân hệ Không gian Học tập Nhóm & Tương tác (Collaborative Groups)",
            "goal": "Xây dựng môi trường học tập cộng tác, kết nối bạn bè hoặc lớp học chia sẻ tài liệu học chung.",
            "features": [
                ("Tạo nhóm học tập & Mã mời độc nhất: ", "Bất kỳ học viên nào cũng có thể tạo nhóm, hệ thống tự động sinh Mã mời (Invite Code) ngẫu nhiên 8 ký tự; người tạo là Trưởng nhóm (Group Owner)."),
                ("Tham gia nhóm bằng mã mời: ", "Học viên nhập mã 8 ký tự để gia nhập nhóm ngay lập tức, ngăn chặn tham gia trùng lặp."),
                ("Quyền hạn Trưởng nhóm (Group Owner): ", "Chỉnh sửa thông tin nhóm, cấp lại mã mời mới (reset code), xem danh sách và xóa thành viên, biên soạn bộ từ vựng riêng của nhóm (Group Vocab Set), giao bài đọc cho nhóm (Assign Reading)."),
                ("Trải nghiệm của Thành viên nhóm: ", "Xem danh sách bạn cùng nhóm, học bộ từ vựng của nhóm (đồng bộ vào lịch ôn SRS cá nhân), làm bài đọc được giao, xem bảng xếp hạng thi đua nội bộ nhóm.")
            ],
            "api_ui": "API: POST /api/groups, GET /api/groups, GET /api/groups/:id, POST /api/groups/join, POST /api/groups/:id/vocab-sets, POST /api/groups/:id/readings, DELETE /api/groups/:id/members/:userId | UI: GroupsPage, GroupDetailPage"
        },
        {
            "id": 10,
            "name": "Phân hệ Diễn đàn Chia sẻ & Đóng góp Nội dung (Community UGC)",
            "goal": "Huy động sức mạnh cộng đồng học viên để cùng làm giàu kho tài liệu học tiếng Anh.",
            "features": [
                ("Đóng góp tài liệu học tập: ", "Học viên có thể tự soạn và gửi lên 2 loại nội dung: Bộ từ vựng đóng góp (từ, phiên âm, nghĩa, ví dụ) hoặc Bài đọc đóng góp (văn bản tiếng Anh, bản dịch, câu hỏi trắc nghiệm)."),
                ("Hàng đợi kiểm duyệt an toàn (Moderation Queue): ", "Tất cả nội dung đóng góp mặc định ở trạng thái Chờ duyệt (Pending), hoàn toàn chưa hiển thị công khai cho đến khi được Admin duyệt."),
                ("Khám phá tài liệu & Học tập cộng đồng: ", "Học viên xem các tài liệu đã được duyệt, lọc theo loại nội dung, học từ vựng và làm bài đọc trực tiếp."),
                ("Bình chọn yêu thích (Upvote System): ", "Học viên có thể bấm Upvote cho tài liệu hay; hệ thống tự động xếp hạng các tài liệu có lượt Upvote cao nhất lên đầu."),
                ("Quản lý bài đóng góp cá nhân: ", "Theo dõi danh sách các bài viết mình đã gửi kèm trạng thái rõ ràng: Pending, Approved, hoặc Rejected.")
            ],
            "api_ui": "API: GET /api/community, POST /api/community, POST /api/community/:id/upvote, GET /api/community/my-posts | UI: CommunityPage, CommunitySubmitPage"
        },
        {
            "id": 11,
            "name": "Phân hệ Bảng Quản trị & CMS Nội dung (Admin Control Panel)",
            "goal": "Khu vực điều hành dữ liệu trung tâm dành riêng cho tài khoản Quản trị viên (Role: admin).",
            "features": [
                ("Bảo vệ cấp đôi (Router & Server API): ", "Bọc ProtectedRoute allowedRoles=['admin'] ở client và middleware isAdmin ở server, chặn đứng mọi truy cập trái phép với mã 403 Forbidden."),
                ("Quản lý người dùng (User Management): ", "Xem danh sách toàn bộ tài khoản, tìm kiếm theo tên/email, khóa tài khoản vi phạm (is_active = false) hoặc mở khóa, nâng cấp vai trò người dùng (learner <-> admin)."),
                ("Quản trị danh mục Chủ đề & Từ vựng (Vocabulary CMS): ", "Thêm/sửa/xóa chủ đề; Thêm/sửa/xóa từ vựng kèm phiên âm IPA, loại từ, nghĩa tiếng Việt, độ khó và các câu ví dụ mẫu."),
                ("Quản trị Bài đọc hiểu & Câu hỏi (Reading CMS): ", "Đăng tải bài đọc mới kèm bản dịch song ngữ; tạo bộ câu hỏi trắc nghiệm chỉ định đáp án đúng và lời giải thích; sửa/xóa bài đọc."),
                ("Kiểm duyệt bài viết cộng đồng (Community Moderation): ", "Xem danh sách bài đóng góp chờ duyệt; duyệt bài (Approve - đưa lên bảng tin công khai) hoặc từ chối bài (Reject - loại bỏ bài không phù hợp)."),
                ("Thống kê toàn hệ thống: ", "Xem các thẻ chỉ số tổng quan: Tổng số học viên, Tổng số chủ đề, Tổng số từ vựng, Tổng số bài đọc và Số bài đang chờ duyệt.")
            ],
            "api_ui": "API: GET /api/admin/users, PATCH /api/admin/users/:id/status, PATCH /api/admin/users/:id/role, POST/PUT/DELETE /api/admin/topics, POST/PUT/DELETE /api/admin/vocabularies, POST/PUT/DELETE /api/admin/readings, GET /api/admin/community/pending, PATCH /api/admin/community/:id/approve, PATCH /api/admin/community/:id/reject, GET /api/admin/stats | UI: AdminPage"
        },
        {
            "id": 12,
            "name": "Phân hệ Báo cáo, Phân tích & Gamification (Analytics, Daily Goal, Streak)",
            "goal": "Trực quan hóa tiến độ học tập, duy trì động lực học hàng ngày thông qua cơ chế trò chơi hóa.",
            "features": [
                ("Thẻ chỉ số tổng quan trên Dashboard: ", "Hiển thị 4 chỉ số cốt lõi: Tổng số từ đã học, Số từ đã làm chủ (Mastered), Tổng số bài đọc đã hoàn thành, Điểm đọc hiểu trung bình."),
                ("Tiến độ mục tiêu ngày (Daily Goal Progress): ", "Theo dõi số từ đã học hôm nay so với mục tiêu đặt ra (VD: 8/10 từ - Đạt 80%), thanh tiến trình đổi màu sinh động khi chạm mốc 100%."),
                ("Bộ đếm chuỗi ngày học liên tục (Streak Counter): ", "Biểu tượng ngọn lửa may mắn kèm số ngày học liên tiếp; tự động cập nhật và reset nếu học viên gián đoạn việc học quá 1 ngày."),
                ("Biểu đồ phân bổ trạng thái từ vựng: ", "Hiển thị tỷ lệ trực quan giữa Từ mới (New) - Đang học (Learning) - Đã làm chủ (Mastered)."),
                ("Biểu đồ xu hướng học tập trong tuần: ", "Thống kê số lượng từ vựng và bài đọc tích lũy qua từng ngày trong 7 ngày gần nhất.")
            ],
            "api_ui": "API: GET /api/stats/dashboard, GET /api/stats/streak, GET /api/stats/gaps | UI: DashboardPage"
        },
        {
            "id": 13,
            "name": "Phân hệ Tiện ích Trải nghiệm & Cơ chế Bảo mật Hệ thống (UX & Security)",
            "goal": "Nâng cao trải nghiệm người dùng cuối, đảm bảo an toàn thông tin và tính ổn định của hệ thống.",
            "features": [
                ("Thiết kế thích ứng đa thiết bị (Responsive Design): ", "Tối ưu hóa hiển thị trên mọi kích thước màn hình (Mobile, Tablet, Desktop) qua Tailwind Grid/Flexbox và menu thanh điều hướng linh hoạt."),
                ("Hệ thống thông báo tức thời (Toast Feedback): ", "Tích hợp react-hot-toast thông báo tương tác nhanh, trực quan khi lưu từ, nộp bài thành công hoặc báo lỗi nhập liệu."),
                ("Cơ chế chống bấm lặp (Anti Double-Submission): ", "Vô hiệu hóa nút bấm và hiển thị spinner loading khi đang xử lý request, ngăn ngừa trùng lặp dữ liệu."),
                ("Trang 404 tùy biến thân thiện: ", "Giao diện báo trang không tồn tại có nút điều hướng nhanh quay lại Trang chủ hoặc Dashboard."),
                ("An ninh cơ sở dữ liệu & Xử lý lỗi tập trung: ", "Mã hóa bcryptjs, Parameterized Queries chống SQL Injection, kiểm soát ngoại lệ qua AppError và middleware errorHandler.")
            ],
            "api_ui": "Thành phần kiến trúc & Middleware toàn hệ thống"
        }
    ]

    for mod in modules_data:
        add_h2(f"3.{mod['id']}. {mod['name']}")
        
        p_goal = doc.add_paragraph()
        p_goal.paragraph_format.space_after = Pt(3)
        r_g_title = p_goal.add_run("Mục tiêu: ")
        r_g_title.font.bold = True
        r_g_title.font.size = Pt(10)
        r_g_title.font.color.rgb = COLOR_PRIMARY
        r_g_text = p_goal.add_run(mod['goal'])
        r_g_text.font.size = Pt(10)
        r_g_text.font.italic = True

        for b_prefix, b_text in mod['features']:
            add_bullet(None, b_prefix, b_text)

        p_meta = doc.add_paragraph()
        p_meta.paragraph_format.space_before = Pt(2)
        p_meta.paragraph_format.space_after = Pt(8)
        r_m_tag = p_meta.add_run("Ánh xạ kỹ thuật: ")
        r_m_tag.font.bold = True
        r_m_tag.font.size = Pt(9.5)
        r_m_tag.font.color.rgb = COLOR_MUTED
        r_m_desc = p_meta.add_run(mod['api_ui'])
        r_m_desc.font.size = Pt(9.5)
        r_m_desc.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # PHẦN 4: SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD - VISUAL PARADIGM NOTATION)
    # =========================================================================
    add_h1("PHẦN 4. SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD - VISUAL PARADIGM NOTATION)")
    p_erd_desc = doc.add_paragraph()
    p_erd_desc.add_run(
        "Mô hình dữ liệu EngLearn được thiết kế và đặc tả theo chuẩn Information Engineering "
        "(ký hiệu Crow's Foot) tương tự công cụ Visual Paradigm chuyên nghiệp. "
        "Toàn bộ 16 thực thể được phân tách thành 5 Vùng nghiệp vụ (Subject Packages) với màu sắc nhận diện riêng, "
        "giúp người đọc dễ dàng theo dõi các quan hệ 1-N, N-N và luồng dữ liệu:"
    )

    # Them anh ERD
    erd_img_path = os.path.join("docs", "erd_visual_paradigm.png")
    if os.path.exists(erd_img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(erd_img_path, width=Inches(6.6))
        
        p_caption = doc.add_paragraph()
        p_caption.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_caption.paragraph_format.space_after = Pt(10)
        r_cap = p_caption.add_run("Hình 4.1. Sơ đồ Thực thể Quan hệ (ERD) toàn hệ thống EngLearn (Visual Paradigm Style)")
        r_cap.font.size = Pt(9)
        r_cap.font.italic = True
        r_cap.font.color.rgb = COLOR_MUTED

    add_h2("4.1. Phân bổ 5 Vùng nghiệp vụ (Subject Packages) trong sơ đồ")
    add_bullet(None, "1. Package Identity & Assessment (Xanh Navy): ", "Quản lý người dùng, phân quyền (users) và lịch sử chấm điểm năng lực đầu vào (level_assessments).")
    add_bullet(None, "2. Package Vocabulary Knowledge Core (Xanh Lá): ", "Lưu trữ chủ đề (topics), kho từ vựng (vocabularies), câu ví dụ ngữ cảnh (vocab_examples) và sổ từ vựng cá nhân (user_vocab_lists, user_vocab_list_items).")
    add_bullet(None, "3. Package Spaced Repetition System - SM-2 (Cam): ", "Theo dõi tiến độ ghi nhớ theo thuật toán SM-2 (user_vocab_progress) và hàng đợi lịch hẹn ôn tập ngắt quãng (review_schedules).")
    add_bullet(None, "4. Package Reading Comprehension & Quiz (Tím): ", "Kho bài đọc hiểu phân cấp (readings), câu hỏi trắc nghiệm (questions), lịch sử làm bài (user_reading_attempts) và đáp án chi tiết (user_answers).")
    add_bullet(None, "5. Package Collaboration & Community (Xanh Teal): ", "Môi trường học nhóm (groups, group_members), tài liệu giao cho nhóm (group_vocab_sets, group_vocab_items, group_reading_sets) và diễn đàn đóng góp cộng đồng (community_posts).")

    # =========================================================================
    # PHẦN 5: TỔNG HỢP CƠ SỞ DỮ LIỆU CỐT LÕI
    # =========================================================================
    add_h1("PHẦN 5. TỔNG HỢP MÔ HÌNH DỮ LIỆU CỐT LÕI (16 MODELS / BẢNG)")
    p_db_intro = doc.add_paragraph()
    p_db_intro.add_run(
        "Cơ sở dữ liệu EngLearn được chuẩn hóa với 16 thực thể quan hệ, đảm bảo tính toàn vẹn dữ liệu, "
        "tối ưu hóa hiệu năng truy vấn và phục vụ trọn vẹn cho 13 phân hệ chức năng:"
    )

    db_table = doc.add_table(rows=1, cols=4)
    db_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    db_table.autofit = False
    set_table_borders(db_table)

    db_widths = [Inches(0.6), Inches(1.8), Inches(2.3), Inches(2.5)]
    db_headers = ["STT", "Tên Model / Bảng", "Mục đích lưu trữ dữ liệu", "Các thuộc tính chính"]

    db_hdr_cells = db_table.rows[0].cells
    for i, title in enumerate(db_headers):
        db_hdr_cells[i].width = db_widths[i]
        p = db_hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(title)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(db_hdr_cells[i], "1E3A8A")
        set_cell_margins(db_hdr_cells[i], top=90, bottom=90)

    db_data = [
        ("1", "User", "Tài khoản người dùng, hồ sơ cá nhân", "id, username, email, password, role, initial_level, daily_goal, streak, is_active"),
        ("2", "Topic", "Danh mục các chủ đề học tập cốt lõi", "id, name, name_vi, description, icon, order_index"),
        ("3", "Vocabulary", "Kho từ vựng tiếng Anh theo chủ đề", "id, topic_id, word, phonetic, part_of_speech, meaning_vi, difficulty, created_by"),
        ("4", "VocabExample", "Câu ví dụ ngữ cảnh song ngữ cho từ", "id, vocabulary_id, sentence_en, sentence_vi"),
        ("5", "UserVocabProgress", "Tiến độ học từ & thông số SM-2 cá nhân", "id, user_id, vocabulary_id, status, ease_factor, interval_days, repetition_count, next_review_at"),
        ("6", "ReviewSchedule", "Hàng đợi lịch ôn tập từ vựng ngắt quãng", "id, user_id, vocabulary_id, scheduled_date, is_completed, group_vocab_set_id"),
        ("7", "Reading", "Kho bài đọc hiểu phân cấp song ngữ", "id, topic_id, title, content_en, content_vi, difficulty, reading_time, is_approved, created_by"),
        ("8", "Question", "Bộ câu hỏi trắc nghiệm của bài đọc", "id, reading_id, question_text, options (JSON), correct_option, explanation_vi"),
        ("9", "UserReadingAttempt", "Lịch sử các lần làm bài kiểm tra đọc", "id, user_id, reading_id, score, total_questions, time_spent, completed_at"),
        ("10", "UserAnswer", "Chi tiết từng câu trả lời trong bài đọc", "id, attempt_id, question_id, selected_option, is_correct"),
        ("11", "LevelAssessment", "Lịch sử bài kiểm tra năng lực đầu vào", "id, user_id, score, total_questions, result_level, answers_detail (JSON), taken_at"),
        ("12", "Group", "Nhóm học tập cộng tác", "id, name, description, invite_code, owner_id, created_at"),
        ("13", "GroupMember", "Thành viên tham gia vào nhóm học", "id, group_id, user_id, role, joined_at"),
        ("14", "GroupVocabSet", "Bộ từ vựng riêng do nhóm biên soạn", "id, group_id, title, description, created_by"),
        ("15", "GroupVocabItem", "Các từ vựng chi tiết trong bộ từ nhóm", "id, group_vocab_set_id, word, phonetic, part_of_speech, meaning_vi, example_en, example_vi"),
        ("16", "CommunityPost", "Bài viết đóng góp từ cộng đồng (UGC)", "id, user_id, type, title, content (JSON), status, upvotes, created_at")
    ]

    for row_idx, d_item in enumerate(db_data):
        row = db_table.add_row()
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(d_item):
            cell = row.cells[c_idx]
            cell.width = db_widths[c_idx]
            set_cell_background(cell, bg_color)
            set_cell_margins(cell, top=65, bottom=65)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            if c_idx == 0:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                r = p.add_run(val)
                r.font.size = Pt(9)
            elif c_idx == 1:
                r = p.add_run(val)
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = COLOR_PRIMARY
            elif c_idx == 2:
                r = p.add_run(val)
                r.font.size = Pt(9)
            else:
                r = p.add_run(val)
                r.font.size = Pt(8.5)
                r.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # KẾT LUẬN & ĐÁNH GIÁ CHẤT LƯỢNG
    # =========================================================================
    add_h1("PHẦN 6. ĐÁNH GIÁ TỔNG QUAN & TÍNH KHẢ THI CỦA ĐỒ ÁN")
    add_bullet(None, "Tính hoàn thiện: ", "Hệ thống đáp ứng 100% các yêu cầu nghiệp vụ đã đề ra trong đề cương đồ án, hoạt động ổn định và sẵn sàng cho môi trường thực tế.")
    add_bullet(None, "Tính sư phạm khoa học: ", "Ứng dụng thành công thuật toán giãn cách SM-2 và mô hình gợi ý theo khoảng trống kiến thức, mang lại giá trị học tập thực chất cho người dùng.")
    add_bullet(None, "Khả năng mở rộng (Scalability): ", "Kiến trúc phân tầng Controller - Service - Model - Route cùng cơ sở dữ liệu quan hệ chuẩn hóa cho phép dễ dàng tích hợp thêm các kỹ năng Luyện Nghe (Listening), Luyện Nói (Speaking với AI) trong các phiên bản tiếp theo.")

    # Save document
    output_filename = "CONG_NGHE_VA_CHUC_NANG_ENGLEARN.docx"
    doc.save(output_filename)
    print(f"Successfully generated {output_filename}")

if __name__ == "__main__":
    build_document()
