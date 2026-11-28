# -*- coding: utf-8 -*-
"""
Script xuat Bao cao Do an Tot nghiep chuan PTIT (Nganh Cong nghe Thong tin)
cho he thong EngLearn v2.0 (Fine Arts & Crafts Edition + AI Vision).

Tuan thu nghiem ngat quy cach:
- Khong tao trang bia (sinh vien tu lam trang bia).
- Thuan den trang 100% (#000000), bang bieu tuyet doi khong to mau (<w:shd>).
- Kho giay A4 (210x297mm), le: Tren 3.5cm, Duoi 3.0cm, Trai 3.5cm, Phai 2.0cm.
- Font chu Times New Roman toan bo tai lieu.
- Co chu binh thuong: 13pt, dan dong 1.3, can deu hai ben (Justify).
- Chuong / Phan lon (Heading 1): 18pt, in dam, viet hoa, can giua.
- Dau muc lon (Heading 2): 16pt, in dam, viet thuong dung chinh ta, can trai.
- Dau muc nho (Heading 3): 13pt, KHONG in dam (in nghieng nhe), can trai.
- Khong in dam bua bai cac cum tu trong doan van hay gach dau dong.
- Phan Section 1 (So La Ma i, ii...) va Section 2 (So A Rap 1, 2...).
- Hinh giao dien Chuong 3: de khoang cach trong + chu thich ben duoi, khong ve khung.
"""

import os
import docx
from docx.shared import Pt, Cm, Inches, Mm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_SECTION_START
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
FIG_DIR = os.path.join(ROOT_DIR, "docs", "report", "figures_bw")

BLACK = RGBColor(0, 0, 0)
FONT_NAME = "Times New Roman"


def set_run_font(run, size_pt=13, bold=False, italic=False):
    run.font.name = FONT_NAME
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = BLACK
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(attr), FONT_NAME)


def configure_style_font(style, size_pt=13, bold=False, italic=False):
    style.font.name = FONT_NAME
    style.font.size = Pt(size_pt)
    style.font.bold = bold
    style.font.italic = italic
    style.font.color.rgb = BLACK
    rPr = style._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rFonts.set(qn(attr), FONT_NAME)


def set_page_margins(section):
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Cm(3.5)
    section.bottom_margin = Cm(3.0)
    section.left_margin = Cm(3.5)
    section.right_margin = Cm(2.0)
    section.header_distance = Cm(1.5)
    section.footer_distance = Cm(1.5)


def set_section_page_number_format(section, fmt="decimal", start=1):
    sectPr = section._sectPr
    for child in list(sectPr):
        if child.tag == qn("w:pgNumType"):
            sectPr.remove(child)
    pgNumType = OxmlElement("w:pgNumType")
    pgNumType.set(qn("w:fmt"), fmt)
    pgNumType.set(qn("w:start"), str(start))
    sectPr.append(pgNumType)


def set_footer_page_number(section):
    footer = section.footer
    footer.is_linked_to_previous = False
    for p in footer.paragraphs:
        p.text = ""
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run()
    set_run_font(r, size_pt=12, bold=False, italic=False)
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls("w"))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls("w"))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls("w"))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls("w"))
    r._r.append(fldChar1)
    r._r.append(instrText)
    r._r.append(fldChar2)
    r._r.append(fldChar3)


def clear_header(section):
    header = section.header
    header.is_linked_to_previous = False
    for p in header.paragraphs:
        p.text = ""


def set_table_borders_bw(table):
    tblPr = table._tbl.tblPr
    for child in list(tblPr):
        if child.tag == qn("w:tblBorders"):
            tblPr.remove(child)
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)


def set_cell_margins(cell, top=90, bottom=90, left=110, right=110):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)


def make_row_header(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))


def make_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))


def add_toc_field(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.3
    r = p.add_run()
    set_run_font(r, size_pt=13, bold=False, italic=False)
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls("w"))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> TOC \o "1-2" \h \z \u </w:instrText>' % nsdecls("w"))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls("w"))
    t_placeholder = parse_xml(r'<w:t %s>Nhấn chuột phải chọn Update Field hoặc nhấn F9 trong Word để cập nhật mục lục tự động.</w:t>' % nsdecls("w"))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls("w"))
    r._r.append(fldChar1)
    r._r.append(instrText)
    r._r.append(fldChar2)
    r._r.append(t_placeholder)
    r._r.append(fldChar3)


def build_thesis_docx(output_path):
    doc = docx.Document()

    # Configure base styles
    s_normal = doc.styles["Normal"]
    configure_style_font(s_normal, size_pt=13, bold=False, italic=False)
    s_normal.paragraph_format.line_spacing = 1.3
    s_normal.paragraph_format.space_before = Pt(0)
    s_normal.paragraph_format.space_after = Pt(6)
    s_normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    s_normal.paragraph_format.first_line_indent = Cm(0)

    # Configure Heading 1 (18pt, Bold, Centered, UPPERCASE)
    s_h1 = doc.styles["Heading 1"]
    configure_style_font(s_h1, size_pt=18, bold=True, italic=False)
    s_h1.paragraph_format.line_spacing = 1.3
    s_h1.paragraph_format.space_before = Pt(6)
    s_h1.paragraph_format.space_after = Pt(14)
    s_h1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    s_h1.paragraph_format.keep_with_next = True
    s_h1.paragraph_format.first_line_indent = Cm(0)

    # Configure Heading 2 (16pt, Bold, Left)
    s_h2 = doc.styles["Heading 2"]
    configure_style_font(s_h2, size_pt=16, bold=True, italic=False)
    s_h2.paragraph_format.line_spacing = 1.3
    s_h2.paragraph_format.space_before = Pt(12)
    s_h2.paragraph_format.space_after = Pt(6)
    s_h2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    s_h2.paragraph_format.keep_with_next = True
    s_h2.paragraph_format.first_line_indent = Cm(0)

    # Configure Heading 3 (13pt, NOT BOLD, Italic, Left)
    s_h3 = doc.styles["Heading 3"]
    configure_style_font(s_h3, size_pt=13, bold=False, italic=True)
    s_h3.paragraph_format.line_spacing = 1.3
    s_h3.paragraph_format.space_before = Pt(8)
    s_h3.paragraph_format.space_after = Pt(4)
    s_h3.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    s_h3.paragraph_format.keep_with_next = True
    s_h3.paragraph_format.first_line_indent = Cm(0)

    # Section 1: Front Matter (Roman numerals)
    sec1 = doc.sections[0]
    set_page_margins(sec1)
    clear_header(sec1)
    set_section_page_number_format(sec1, fmt="lowerRoman", start=1)
    set_footer_page_number(sec1)

    # Helper functions
    def add_h1(text, page_break=True, include_in_toc=True):
        if page_break:
            doc.add_page_break()
        if include_in_toc:
            p = doc.add_paragraph(style="Heading 1")
        else:
            p = doc.add_paragraph()
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(14)
            p.paragraph_format.line_spacing = 1.3
            p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        set_run_font(r, size_pt=18, bold=True, italic=False)
        return p

    def add_h2(text):
        p = doc.add_paragraph(style="Heading 2")
        r = p.add_run(text)
        set_run_font(r, size_pt=16, bold=True, italic=False)
        return p

    def add_h3(text):
        p = doc.add_paragraph(style="Heading 3")
        r = p.add_run(text)
        set_run_font(r, size_pt=13, bold=False, italic=True)
        return p

    def body(text, indent=True, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.alignment = align
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.first_line_indent = Cm(1.0) if indent else Cm(0)
        r = p.add_run(text)
        set_run_font(r, size_pt=13, bold=False, italic=italic)
        return p

    def bullet(text, level=0):
        p = doc.add_paragraph()
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        left_cm = 1.0 + level * 0.6
        p.paragraph_format.left_indent = Cm(left_cm)
        p.paragraph_format.first_line_indent = Cm(-0.45)
        prefix = "- " if level == 0 else "+ "
        r = p.add_run(prefix + text)
        set_run_font(r, size_pt=13, bold=False, italic=False)
        return p

    def formula(text):
        p = doc.add_paragraph()
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.first_line_indent = Cm(0)
        r = p.add_run(text)
        set_run_font(r, size_pt=13, bold=False, italic=True)
        return p

    def code_block(code_text, caption=None):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Cm(15.5)
        set_table_borders_bw(tbl)
        cell = tbl.rows[0].cells[0]
        cell.width = Cm(15.5)
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        make_row_cant_split(tbl.rows[0])
        cp = cell.paragraphs[0]
        cp.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        cp.paragraph_format.line_spacing = 1.15
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(0)
        cp.paragraph_format.first_line_indent = Cm(0)
        r = cp.add_run(code_text.strip())
        set_run_font(r, size_pt=10.5, bold=False, italic=False)
        if caption:
            pc = doc.add_paragraph()
            pc.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pc.paragraph_format.space_before = Pt(4)
            pc.paragraph_format.space_after = Pt(8)
            pc.paragraph_format.first_line_indent = Cm(0)
            rc = pc.add_run(caption)
            set_run_font(rc, size_pt=12, bold=False, italic=True)
        else:
            ps = doc.add_paragraph()
            ps.paragraph_format.space_before = Pt(0)
            ps.paragraph_format.space_after = Pt(4)

    def add_table_bw(title, headers, rows, col_widths_cm, col_aligns=None):
        # Title above table
        pt = doc.add_paragraph()
        pt.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        pt.paragraph_format.space_before = Pt(8)
        pt.paragraph_format.space_after = Pt(4)
        pt.paragraph_format.keep_with_next = True
        pt.paragraph_format.first_line_indent = Cm(0)
        rt = pt.add_run(title)
        set_run_font(rt, size_pt=13, bold=False, italic=False)

        table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        set_table_borders_bw(table)

        # Header row: bold text, NO shading/fill
        hdr_row = table.rows[0]
        make_row_header(hdr_row)
        for i, h_text in enumerate(headers):
            cell = hdr_row.cells[i]
            cell.width = Cm(col_widths_cm[i])
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            pc = cell.paragraphs[0]
            pc.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pc.paragraph_format.space_before = Pt(0)
            pc.paragraph_format.space_after = Pt(0)
            pc.paragraph_format.line_spacing = 1.15
            pc.paragraph_format.first_line_indent = Cm(0)
            rc = pc.add_run(h_text)
            set_run_font(rc, size_pt=12, bold=True, italic=False)

        # Data rows: normal text, NO shading/fill
        for r_idx, r_data in enumerate(rows):
            row = table.rows[r_idx + 1]
            make_row_cant_split(row)
            for c_idx, val in enumerate(r_data):
                cell = row.cells[c_idx]
                cell.width = Cm(col_widths_cm[c_idx])
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                set_cell_margins(cell, top=50, bottom=50, left=85, right=85)
                pc = cell.paragraphs[0]
                pc.alignment = col_aligns[c_idx] if col_aligns else WD_ALIGN_PARAGRAPH.LEFT
                pc.paragraph_format.space_before = Pt(0)
                pc.paragraph_format.space_after = Pt(0)
                pc.paragraph_format.line_spacing = 1.12
                pc.paragraph_format.first_line_indent = Cm(0)
                rc = pc.add_run(str(val))
                set_run_font(rc, size_pt=11, bold=False, italic=False)

        ps = doc.add_paragraph()
        ps.paragraph_format.space_before = Pt(0)
        ps.paragraph_format.space_after = Pt(4)
        return table

    def add_figure(img_filename, caption, width_cm=13.2):
        img_path = os.path.join(FIG_DIR, img_filename)
        if not os.path.exists(img_path):
            raise FileNotFoundError(f"Missing diagram: {img_path}")
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(3)
        p_img.paragraph_format.keep_with_next = True
        p_img.paragraph_format.first_line_indent = Cm(0)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Cm(width_cm))

        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(6)
        p_cap.paragraph_format.first_line_indent = Cm(0)
        rc = p_cap.add_run(caption)
        set_run_font(rc, size_pt=12, bold=False, italic=True)

    def add_ui_placeholder(caption):
        # Khong ve khung, chi de khoang trong va chu thich ben duoi
        p_space = doc.add_paragraph()
        p_space.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_space.paragraph_format.space_before = Pt(4)
        p_space.paragraph_format.space_after = Pt(65)
        p_space.paragraph_format.keep_with_next = True
        p_space.paragraph_format.first_line_indent = Cm(0)

        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(4)
        p_cap.paragraph_format.first_line_indent = Cm(0)
        rc = p_cap.add_run(caption)
        set_run_font(rc, size_pt=12, bold=False, italic=True)

    # =========================================================================
    # PHẦN THỦ TỤC MỞ ĐẦU (KHÔNG CÓ TRANG BÌA, ĐÁNH SỐ LA MÃ i, ii...)
    # =========================================================================

    # 1. LỜI CAM ĐOAN
    add_h1("LỜI CAM ĐOAN", page_break=False, include_in_toc=True)
    body(
        "Tôi xin cam đoan rằng đồ án tốt nghiệp với đề tài \"Xây dựng hệ thống học từ vựng tiếng Anh "
        "chuyên ngành Mỹ thuật và Thủ công mỹ nghệ\" là công trình "
        "nghiên cứu, thiết kế và cài đặt phần mềm do chính tôi thực hiện dưới sự định hướng và hướng dẫn khoa học của "
        "Thầy [CẦN ĐIỀN: HỌC HÀM, HỌC VỊ VÀ HỌ TÊN THẦY HƯỚNG DẪN]."
    )
    body(
        "Toàn bộ mã nguồn chương trình, cấu trúc cơ sở dữ liệu, bộ dữ liệu thuật ngữ chuyên ngành, kết quả kiểm thử "
        "và các số liệu thực nghiệm được trình bày trong bản báo cáo này đều hoàn toàn trung thực, khách quan và do tôi "
        "trực tiếp triển khai kiểm chứng trên hệ thống. Các tài liệu tham khảo, định nghĩa học thuật và mã nguồn thư viện "
        "mở kế thừa trong quá trình thực hiện đều được trích dẫn đầy đủ, rõ ràng theo đúng quy định của Học viện Công nghệ "
        "Bưu chính Viễn thông."
    )
    body(
        "Tôi xin chịu hoàn toàn trách nhiệm trước Hội đồng bảo vệ đồ án tốt nghiệp và quy chế đào tạo của Nhà trường "
        "về tính chính xác, tính nguyên bản cũng như mọi nội dung khoa học đã trình bày trong đồ án này."
    )
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sig.paragraph_format.space_before = Pt(28)
    p_sig.paragraph_format.space_after = Pt(12)
    p_sig.paragraph_format.line_spacing = 1.3
    p_sig.paragraph_format.first_line_indent = Cm(0)
    r_sig = p_sig.add_run("Hà Nội, ngày ... tháng ... năm 2026\nSinh viên thực hiện\n(Ký và ghi rõ họ tên)\n\n\n\n[CẦN ĐIỀN: HỌ VÀ TÊN SINH VIÊN]")
    set_run_font(r_sig, size_pt=13, bold=False, italic=True)

    # 2. LỜI CẢM ƠN
    add_h1("LỜI CẢM ƠN", page_break=True, include_in_toc=True)
    body(
        "Để hoàn thành đồ án tốt nghiệp đại học ngành Công nghệ thông tin, trước hết em xin gửi lời cảm ơn chân thành "
        "và lòng biết ơn sâu sắc tới Ban Giám đốc Học viện Công nghệ Bưu chính Viễn thông cùng toàn thể các Thầy, Cô giáo "
        "trong Khoa Công nghệ thông tin 1. Trong suốt những năm học tập và rèn luyện tại Học viện, các Thầy, Cô đã tận tâm "
        "truyền đạt những kiến thức nền tảng vững chắc, phương pháp tư duy kỹ thuật hệ thống và tinh thần nghiêm túc trong "
        "nghiên cứu khoa học."
    )
    body(
        "Đặc biệt, em xin bày tỏ lòng biết ơn sâu sắc nhất tới Thầy [CẦN ĐIỀN: HỌC HÀM, HỌC VỊ VÀ HỌ TÊN THẦY HƯỚNG DẪN]. "
        "Trong suốt thời gian thực hiện đề tài, Thầy đã luôn tận tình chỉ bảo, định hướng kiến trúc giải pháp, góp ý chi tiết "
        "cho từng phân hệ kỹ thuật từ thuật toán lặp lại ngắt quãng đến mô hình thị giác máy tính, đồng thời động viên và tạo "
        "điều kiện thuận lợi để em hoàn thành đồ án đúng tiến độ đề ra."
    )
    body(
        "Em cũng xin gửi lời cảm ơn tới gia đình, người thân và bạn bè đã luôn bên cạnh động viên, chia sẻ khó khăn và hỗ trợ "
        "tinh thần trong suốt quá trình học tập cũng như giai đoạn thực hiện đồ án tốt nghiệp."
    )
    body(
        "Mặc dù bản thân đã cố gắng hết sức để hoàn thiện hệ thống và bản báo cáo một cách chỉn chu nhất, song do hạn chế về "
        "mặt thời gian và kinh nghiệm thực tế, đồ án khó tránh khỏi những thiếu sót nhất định. Em rất mong nhận được những ý kiến "
        "nhận xét, đánh giá và chỉ dẫn quý báu của các Thầy trong Hội đồng chấm đồ án tốt nghiệp để hệ thống ngày càng hoàn thiện hơn."
    )
    body("Em xin trân trọng cảm ơn!", indent=True, italic=True)

    # 3. MỤC LỤC TỰ ĐỘNG
    add_h1("MỤC LỤC", page_break=True, include_in_toc=False)
    add_toc_field(doc)

    # 4. DANH MỤC CÁC KÝ HIỆU VÀ CHỮ VIẾT TẮT
    add_h1("DANH MỤC CÁC KÝ HIỆU VÀ CHỮ VIẾT TẮT", page_break=True, include_in_toc=True)
    abbr_headers = ["Chữ viết tắt", "Thuật ngữ tiếng Anh đầy đủ", "Giải nghĩa tiếng Việt"]
    abbr_rows = [
        ["ACID", "Atomicity, Consistency, Isolation, Durability", "Tính chất bảo đảm giao dịch cơ sở dữ liệu tin cậy"],
        ["AI", "Artificial Intelligence", "Trí tuệ nhân tạo"],
        ["API", "Application Programming Interface", "Giao diện lập trình ứng dụng"],
        ["DINOv2", "Self-Distillation with No Labels v2", "Mô hình học biểu diễn thị giác tự giám sát thế hệ 2"],
        ["EF", "Easiness Factor", "Hệ số độ dễ trong thuật toán lặp lại ngắt quãng SM-2"],
        ["ERD", "Entity Relationship Diagram", "Sơ đồ thực thể liên kết cơ sở dữ liệu"],
        ["GBDT", "Gradient Boosted Decision Trees", "Mô hình cây quyết định tăng cường độ dốc"],
        ["JWT", "JSON Web Token", "Chuẩn mở truyền tải thông tin xác thực dạng chữ ký số"],
        ["MoE", "Mixture of Experts", "Kiến trúc kết hợp nhiều mô hình chuyên gia theo trọng số"],
        ["OOD", "Out-Of-Distribution", "Dữ liệu nằm ngoài phân phối huấn luyện của mô hình"],
        ["ORM", "Object-Relational Mapping", "Kỹ thuật ánh xạ đối tượng và bảng cơ sở dữ liệu quan hệ"],
        ["PTIT", "Posts and Telecommunications Institute of Technology", "Học viện Công nghệ Bưu chính Viễn thông"],
        ["RBAC", "Role-Based Access Control", "Kiểm soát truy cập dựa trên vai trò người dùng"],
        ["SigLIP", "Sigmoid Loss for Language Image Pre-Training", "Mô hình đa phương thức ngôn ngữ – ảnh dùng hàm Sigmoid"],
        ["SM-2", "SuperMemo 2 Algorithm", "Thuật toán lặp lại ngắt quãng SuperMemo phiên bản 2"],
    ]
    add_table_bw(
        "Bảng danh mục các ký hiệu và chữ viết tắt sử dụng trong đồ án",
        abbr_headers,
        abbr_rows,
        [2.6, 6.2, 6.7],
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    # 5. DANH MỤC CÁC BẢNG BIỂU
    add_h1("DANH MỤC CÁC BẢNG BIỂU", page_break=True, include_in_toc=True)
    list_tables = [
        "Bảng 1.1: So sánh hệ thống đề xuất với các ứng dụng hỗ trợ học tiếng Anh hiện có",
        "Bảng 1.2: Thang điểm đánh giá chất lượng phản hồi q trong thuật toán SM-2",
        "Bảng 1.3: Tổng hợp hệ sinh thái công nghệ phát triển hệ thống",
        "Bảng 2.1: Ma trận phân quyền theo vai trò tác nhân trong hệ thống",
        "Bảng 2.2: Đặc tả ca sử dụng Ôn tập từ vựng ngắt quãng theo thuật toán SM-2",
        "Bảng 2.3: Đặc tả ca sử dụng Nhận diện ảnh tác phẩm nghệ thuật bằng AI Vision",
        "Bảng 2.4: Tổng hợp 13 bảng thực thể trong cơ sở dữ liệu MySQL của hệ thống",
        "Bảng 2.5: Cấu trúc chi tiết các bảng dữ liệu trọng tâm của hệ thống",
        "Bảng 2.6: Danh mục các điểm cuối RESTful API cốt lõi theo 10 nhóm tài nguyên",
        "Bảng 3.1: Cấu hình môi trường phát triển, kiểm thử và triển khai Docker",
        "Bảng 3.2: Phân bổ kho thuật ngữ tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ",
        "Bảng 4.1: Tổng hợp kết quả chạy bộ kiểm thử tự động trước và sau hoàn thiện",
        "Bảng 4.2: Chi tiết các nhóm ca kiểm thử hồi quy, đơn vị thuật toán SM-2 và logic giao diện",
        "Bảng 4.3: Kết quả thực nghiệm đánh giá mô hình AI Vision trước và sau tối ưu",
        "Bảng 4.4: Độ chính xác AI Vision theo khía cạnh và trên tập Gold Benchmark độc lập",
    ]
    for item in list_tables:
        body(item, indent=False, space_after=3)

    # 6. DANH MỤC CÁC HÌNH VẼ VÀ SƠ ĐỒ
    add_h1("DANH MỤC CÁC HÌNH VẼ VÀ SƠ ĐỒ", page_break=True, include_in_toc=True)
    list_figs = [
        "Hình 1.1: Đường cong quên lãng Ebbinghaus và tác động của thuật toán SM-2",
        "Hình 2.1: Sơ đồ Use Case tổng quát hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ",
        "Hình 2.2: Sơ đồ Use Case phân rã phân hệ học tập SM-2 và nhận diện AI Vision",
        "Hình 2.3: Sơ đồ tuần tự luồng xác thực JWT và xoay vòng Refresh Token Rotation",
        "Hình 2.4: Sơ đồ tuần tự luồng ôn tập từ vựng SM-2 bọc trong Sequelize Transaction",
        "Hình 2.5: Sơ đồ tuần tự luồng nhận diện ảnh tác phẩm qua AI Vision Microservice",
        "Hình 2.6: Sơ đồ hoạt động quy trình sinh đề bài tập 4 dạng và chấm điểm chống nộp lặp",
        "Hình 2.7: Sơ đồ kiến trúc tổng thể hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ",
        "Hình 2.8: Sơ đồ thực thể liên kết (ERD) 13 bảng dữ liệu hệ thống",
        "Hình 3.1: Giao diện đăng nhập và đăng ký tài khoản của hệ thống",
        "Hình 3.2: Giao diện danh mục chủ đề và chi tiết thuật ngữ mỹ thuật kèm ảnh minh họa",
        "Hình 3.3: Giao diện học từ vựng bằng thẻ ghi nhớ Flashcard 3D",
        "Hình 3.4: Giao diện bài tập củng cố 4 dạng câu hỏi và xem giải thích sau nộp bài",
        "Hình 3.5: Giao diện ôn tập ngắt quãng thông minh theo thuật toán SM-2",
        "Hình 3.6: Giao diện nhận diện ảnh tác phẩm nghệ thuật bằng AI Vision và phản hồi nhãn",
        "Hình 4.1: Biểu đồ so sánh chỉ số đánh giá AI Vision trước và sau tối ưu mô hình",
        "Hình 4.2: Biểu đồ độ chính xác AI Vision theo khía cạnh và trên tập Gold Benchmark",
    ]
    for item in list_figs:
        body(item, indent=False, space_after=4)

    # =========================================================================
    # SECTION 2: NỘI DUNG CHÍNH (ĐÁNH SỐ Ả RẬP BẮT ĐẦU TỪ 1)
    # =========================================================================
    sec2 = doc.add_section(WD_SECTION_START.NEW_PAGE)
    set_page_margins(sec2)
    clear_header(sec2)
    set_section_page_number_format(sec2, fmt="decimal", start=1)
    set_footer_page_number(sec2)

    # =========================================================================
    # LỜI MỞ ĐẦU
    # =========================================================================
    add_h1("LỜI MỞ ĐẦU", page_break=False, include_in_toc=True)

    add_h2("1. Tính cấp thiết của đề tài")
    body(
        "Trong bối cảnh toàn cầu hóa và sự phát triển của các ngành công nghiệp sáng tạo, tiếng Anh chuyên ngành là công cụ "
        "thiết yếu giúp sinh viên mỹ thuật, nhà thiết kế và nghệ nhân thủ công mỹ nghệ tiếp cận nguồn học liệu quốc tế và "
        "đưa sản phẩm văn hóa ra thị trường toàn cầu. Tuy nhiên, phần lớn ứng dụng học ngoại ngữ phổ biến hiện nay mới dừng "
        "ở giao tiếp thông thường, thiếu tính chuyên biệt về chất liệu hội họa, kỹ thuật chế tác và ghi chú văn hóa. Bên cạnh đó, "
        "người học thường quên nhanh từ vựng do thiếu lịch ôn tập khoa học và chưa có công cụ nhận diện ngược từ ảnh tác phẩm thực tế."
    )
    body(
        "Xuất phát từ nhu cầu đó, đề tài \"Xây dựng hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ\" "
        "được thực hiện nhằm kết hợp kho thuật ngữ chuẩn hóa, thuật toán lặp lại ngắt quãng SM-2 và dịch vụ thị giác máy tính "
        "nhận diện tác phẩm nghệ thuật."
    )

    add_h2("2. Mục tiêu nghiên cứu của đề tài")
    bullet("Nghiên cứu đường cong quên lãng Ebbinghaus và mô hình toán học thuật toán SM-2 để lập lịch ôn tập từ vựng cá nhân hóa.")
    bullet("Nghiên cứu và triển khai dịch vụ thị giác máy tính kết hợp SigLIP và DINOv2, Linear Probe hiệu chỉnh xác suất và lọc ảnh ngoài miền (OOD) để nhận diện tác phẩm nghệ thuật.")
    bullet("Thiết kế và xây dựng hoàn chỉnh hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ (React 19, Express 5, MySQL 8.0, FastAPI), đóng gói Docker Compose và kiểm thử tự động toàn diện.")

    add_h2("3. Đối tượng, phạm vi và phương pháp nghiên cứu")
    body(
        "Đối tượng nghiên cứu gồm thuật toán SM-2, bảo mật xác thực RESTful API, mô hình đa phương thức SigLIP – DINOv2 và "
        "bộ thuật ngữ chuyên ngành Mỹ thuật và Thủ công mỹ nghệ chuẩn hóa. Phạm vi cài đặt bao quát trọn vẹn mã nguồn hiện tại: xác thực đa lớp, "
        "36 thuật ngữ thuộc 2 chủ đề kèm Flashcard 3D, bài tập 4 dạng chống nộp lặp, ôn tập SM-2, sổ từ cá nhân, AI Vision và quản trị CMS. "
        "Đề tài kết hợp phương pháp nghiên cứu tài liệu, phân tích thiết kế hướng đối tượng UML/ERD và kiểm thử định lượng thực nghiệm."
    )

    add_h2("4. Bố cục của báo cáo đồ án")
    body("Ngoài phần mở đầu thủ tục, kết luận và tài liệu tham khảo, nội dung chính của báo cáo gồm 4 chương:")
    bullet("Chương 1: Tổng quan bài toán, đánh giá giải pháp hiện có, cơ sở lý thuyết SM-2, thị giác máy tính AI và công nghệ sử dụng.")
    bullet("Chương 2: Phân tích yêu cầu, sơ đồ Use Case, tuần tự, hoạt động, kiến trúc tổng thể, CSDL 13 bảng và RESTful API.")
    bullet("Chương 3: Cài đặt chi tiết thuật toán SM-2, xác thực bảo mật, bài tập 4 dạng, dịch vụ AI Vision và minh họa giao diện.")
    bullet("Chương 4: Kết quả kiểm thử tự động 48 ca và đánh giá định lượng mô hình AI Vision trên tập dữ liệu thực nghiệm.")

    # =========================================================================
    # CHƯƠNG 1: TỔNG QUAN BÀI TOÁN VÀ CƠ SỞ LÝ THUYẾT
    # =========================================================================
    add_h1("CHƯƠNG 1: TỔNG QUAN BÀI TOÁN VÀ CƠ SỞ LÝ THUYẾT", page_break=True, include_in_toc=True)

    add_h2("1.1. Khảo sát thực trạng học tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ")
    body(
        "Trong đào tạo đại học khối ngành nghệ thuật, thiết kế và bảo tồn di sản văn hóa, khả năng đọc hiểu tài liệu kỹ thuật "
        "và giao tiếp bằng tiếng Anh chuyên ngành đóng vai trò ngày càng quan trọng. Khi tham khảo các tài liệu quốc tế từ "
        "Oxford Art Online, Tate Art Glossary hay danh mục hiện vật của các bảo tàng lớn như Bảo tàng Nghệ thuật Cleveland "
        "(CMA) và Bảo tàng Victoria & Albert (V&A London), người học thường xuyên bắt gặp khối lượng lớn thuật ngữ đặc thù "
        "không xuất hiện trong tiếng Anh phổ thông."
    )
    body(
        "Đặc thù của từ vựng Mỹ thuật và Thủ công mỹ nghệ nằm ở mối liên hệ chặt chẽ giữa từ ngữ với đặc trưng thị giác, "
        "chất liệu vật lý và bối cảnh văn hóa – lịch sử. Chẳng hạn, người học cần phân biệt rõ sự khác biệt về bản chất tạo "
        "hình giữa tranh màu nước (watercolor) có độ trong suốt cao với tranh bột màu đục (gouache), hay giữa kỹ thuật vẽ "
        "trên vữa ướt (fresco) thời Phục hưng với kỹ thuật tương phản sáng tối (chiaroscuro). Tương tự, trong nhóm ngành "
        "thủ công mỹ nghệ, các khái niệm như sơn mài (lacquerware), chạm khắc gỗ (woodcarving), thổi thủy tinh (glassblowing), "
        "ghép mảnh (mosaic) hay khảm đá (stonemasonry) đòi hỏi phải đi kèm hình ảnh trực quan, tên nghệ sĩ hoặc làng nghề "
        "tiêu biểu mới giúp người học hình dung chính xác."
    )
    body(
        "Qua khảo sát nhu cầu học tập thực tế của sinh viên chuyên ngành và người tự học, có thể nhận diện ba rào cản nổi bật "
        "của phương pháp tiếp cận truyền thống:"
    )
    bullet("Tài liệu phân tán, thiếu chuẩn hóa song ngữ: từ điển chuyên ngành thường chỉ cung cấp định nghĩa ngắn bằng tiếng Anh hoặc thiếu câu ví dụ ngữ cảnh, phiên âm IPA và ghi chú văn hóa bằng tiếng Việt.")
    bullet("Tỷ lệ quên từ vựng cao sau khi học: việc học dồn dập một danh sách dài các thuật ngữ khó phát âm khiến não bộ nhanh chóng đào thải thông tin nếu không có lịch nhắc ôn tập khoa học.")
    bullet("Thiếu công cụ tra cứu ngược từ hình ảnh thực tế: khi bắt gặp một tác phẩm tranh hoặc sản phẩm thủ công mỹ nghệ nhưng chưa biết tên gọi tiếng Anh, người học khó tra cứu chính xác bằng từ điển văn bản thông thường.")

    add_h2("1.2. Đánh giá các hệ thống hỗ trợ học tập hiện có")
    body(
        "Trên thị trường công nghệ giáo dục hiện nay có nhiều ứng dụng nổi tiếng hỗ trợ học ngoại ngữ và ghi nhớ kiến thức. "
        "Tuy nhiên, khi đặt trong bối cảnh bài toán học tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ, mỗi nền tảng đều "
        "tồn tại những khoảng trống nhất định về tính chuyên biệt, cơ chế ôn tập hoặc khả năng nhận diện thị giác."
    )
    body(
        "Duolingo mạnh về yếu tố trò chơi hóa và duy trì thói quen hàng ngày, nhưng kho nội dung được thiết kế cố định cho "
        "tiếng Anh giao tiếp phổ thông, không phục vụ thuật ngữ mỹ thuật và không cho phép quản trị viên tùy biến ngữ liệu "
        "chuyên sâu. Quizlet hỗ trợ tạo bộ thẻ ghi nhớ linh hoạt, song chế độ ôn tập lặp lại ngắt quãng khoa học bị giới hạn "
        "trong gói trả phí và hoàn toàn thiếu ngữ liệu thẩm định cùng công cụ AI nhận diện tác phẩm. Anki cài đặt tốt thuật "
        "toán SM-2 và miễn phí mã nguồn mở, nhưng giao diện thuần kỹ thuật kém thân thiện với người dùng web phổ thông, không "
        "tích hợp sẵn bài tập đố tranh đa dạng hay mô hình AI phân loại tác phẩm nghệ thuật."
    )

    add_table_bw(
        "Bảng 1.1: So sánh hệ thống đề xuất với các ứng dụng hỗ trợ học tiếng Anh hiện có",
        ["Tiêu chí đánh giá", "Duolingo", "Quizlet", "Anki", "Hệ thống đề xuất"],
        [
            ["Độ chuyên biệt chuyên ngành Mỹ thuật và Thủ công mỹ nghệ", "Rất thấp (giao tiếp chung)", "Trung bình (phụ thuộc cộng đồng)", "Thấp (tự nhập thủ công)", "Cao (chuẩn hóa ngữ liệu, IPA, ghi chú văn hóa)"],
            ["Thuật toán ôn tập ngắt quãng SM-2", "Chu kỳ cố định đơn giản", "Giới hạn ở gói trả phí", "SM-2 tiêu chuẩn", "SM-2 chuẩn hóa bọc Transaction InnoDB"],
            ["Hình ảnh minh họa và phóng to tác phẩm", "Minh họa hoạt hình chung", "Ảnh tải lên tự do", "Ảnh đính kèm thủ công", "Ảnh chuẩn hóa kèm phóng to Darkroom Modal"],
            ["Bài tập củng cố đố tranh và ngữ cảnh", "Đa dạng cho giao tiếp", "Trắc nghiệm cơ bản", "Không hỗ trợ sinh đề", "Tự động sinh 4 dạng bài tập, chống nộp lặp"],
            ["AI nhận diện ảnh tác phẩm nghệ thuật", "Không có", "Không có", "Không có", "Dual-Backbone SigLIP + DINOv2, lọc OOD"],
            ["Sổ từ cá nhân và quản trị CMS", "Không hỗ trợ sổ từ tùy biến", "Có thư mục thẻ", "Có bộ Deck cục bộ", "Sổ từ đa danh mục, Admin RBAC & Audit Log"],
        ],
        [3.7, 2.7, 2.8, 2.7, 3.6],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    body(
        "Từ bảng so sánh trên, có thể thấy việc phát triển hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ "
        "tích hợp đồng bộ ba trụ cột gồm kho ngữ liệu chuẩn hóa, động cơ lập lịch ôn tập SM-2 an toàn giao dịch và dịch vụ nhận "
        "diện ảnh tác phẩm bằng AI là hướng đi phù hợp, giải quyết trực diện các hạn chế của những nền tảng hiện hành."
    )

    add_h2("1.3. Cơ sở lý thuyết về trí nhớ và thuật toán lặp lại ngắt quãng SM-2")

    add_h3("1.3.1. Đường cong quên lãng Ebbinghaus và nguyên lý ôn tập ngắt quãng")
    body(
        "Năm 1885, nhà tâm lý học thực nghiệm người Đức Hermann Ebbinghaus đã công bố công trình kinh điển về cơ chế lưu giữ "
        "và suy giảm trí nhớ của não bộ con người thông qua đường cong quên lãng (Forgetting Curve). Nghiên cứu chỉ ra rằng "
        "lượng thông tin được lưu giữ suy giảm theo quy luật hàm số mũ âm ngay sau khi kết thúc quá trình tiếp nhận ban đầu. "
        "Mối quan hệ giữa tỷ lệ ghi nhớ và thời gian trôi qua được biểu diễn bằng công thức:"
    )
    formula("R(t) = e^(-t / S)        (1.1)")
    body(
        "Trong công thức (1.1), R(t) là tỷ lệ phần trăm kiến thức còn lưu giữ được tại thời điểm t kể từ lần học gần nhất, "
        "còn S là hệ số độ bền vững của trí nhớ (Strength of memory). Khi vừa tiếp thu một thuật ngữ mới mà không được ôn lại, "
        "hơn 70% thông tin có thể bị lãng quên chỉ trong vòng 24 đến 48 giờ đầu tiên. Tuy nhiên, mỗi lần người học chủ động "
        "truy xuất lại thông tin từ trí nhớ đúng vào thời điểm kiến thức chuẩn bị mờ nhạt, đường cong suy giảm sẽ thoải hơn "
        "đáng kể, nghĩa là độ bền vững S tăng lên qua từng chu kỳ lặp lại."
    )

    add_figure("fig_1_1_ebbinghaus_srs.png", "Hình 1.1: Đường cong quên lãng Ebbinghaus và tác động của thuật toán SM-2", width_cm=12.4)

    body(
        "Hệ thống lặp lại ngắt quãng (Spaced Repetition System – SRS) khai thác trực tiếp quy luật này bằng cách điều chỉnh "
        "khoảng thời gian giữa các lần ôn tập tăng dần theo cấp số nhân đối với những từ người học nhớ tốt, đồng thời thu hẹp "
        "khoảng cách về mức tối thiểu đối với những từ người học thường xuyên quên. Nhờ đó, người học giảm đáng kể tổng thời "
        "gian ôn tập nhưng vẫn duy trì được tỷ lệ ghi nhớ dài hạn ở mức cao."
    )

    add_h3("1.3.2. Mô hình toán học của thuật toán SuperMemo-2 (SM-2)")
    body(
        "Thuật toán SuperMemo-2 (SM-2) do nhà nghiên cứu Piotr Woźniak đề xuất vào cuối thập niên 1980 là một trong những "
        "thuật toán lặp lại ngắt quãng được kiểm chứng rộng rãi nhất trong lĩnh vực công nghệ giáo dục. Thuật toán duy trì ba "
        "tham số trạng thái cho từng cặp người học và mục từ vựng:"
    )
    bullet("Số lần lặp thành công liên tiếp n (repetition_count): đếm số lượt ôn tập liên tiếp mà người học đạt mức phản hồi từ ngưỡng đạt trở lên.")
    bullet("Hệ số độ dễ EF (ease_factor): đại diện cho mức độ dễ ghi nhớ của thuật ngữ đối với từng người học cụ thể, giá trị khởi tạo mặc định là 2,5 và bị chặn dưới ở ngưỡng tối thiểu 1,3.")
    bullet("Khoảng cách ngày ôn tập I(n) (interval_days): số ngày hệ thống hẹn lịch để từ vựng xuất hiện trở lại trong phiên ôn tập kế tiếp.")

    body(
        "Sau mỗi lần tự kiểm tra thẻ ghi nhớ, người học đánh giá mức độ phản xạ của bản thân theo thang điểm chất lượng q "
        "gồm 6 mức số nguyên từ 0 đến 5 như trình bày trong Bảng 1.2."
    )

    add_table_bw(
        "Bảng 1.2: Thang điểm đánh giá chất lượng phản hồi q trong thuật toán SM-2",
        ["Điểm q", "Nhãn đánh giá", "Mô tả mức độ ghi nhớ của học viên", "Quyết định của thuật toán"],
        [
            ["0", "Blackout", "Hoàn toàn không nhớ ra nghĩa hay ngữ cảnh của thuật ngữ", "Chưa đạt (q < 3), đặt lại n = 0, I = 1 ngày"],
            ["1", "Incorrect", "Trả lời sai, chỉ nhận ra mang máng khi xem đáp án", "Chưa đạt (q < 3), đặt lại n = 0, I = 1 ngày"],
            ["2", "Familiar", "Trả lời sai nhưng cảm thấy thuật ngữ khá quen thuộc", "Chưa đạt (q < 3), đặt lại n = 0, I = 1 ngày"],
            ["3", "Hard", "Nhớ đúng đáp án nhưng mất nhiều thời gian suy nghĩ", "Đạt (q >= 3), tăng n, tính I(n) mới"],
            ["4", "Good", "Nhớ đúng đáp án sau một khoảng do dự ngắn", "Đạt (q >= 3), tăng n, tính I(n) mới"],
            ["5", "Easy", "Phản xạ chính xác và tức thì ngay khi nhìn mặt thẻ", "Đạt (q >= 3), tăng n, tính I(n) mới"],
        ],
        [1.7, 2.6, 6.2, 5.0],
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    body(
        "Dựa trên điểm phản hồi q, thuật toán SM-2 cập nhật khoảng cách ngày ôn tập I(n) theo quy tắc phân nhánh sau:"
    )
    formula(
        "Nếu q >= 3:  I(1) = 1 ngày;   I(2) = 6 ngày;   I(n) = min(round(I(n-1) * EF), 365) với n >= 3        (1.2)\n"
        "Nếu q < 3:   n = 0;   I = 1 ngày"
    )
    body(
        "Song song với việc tính khoảng cách ôn tập, hệ số độ dễ EF được điều chỉnh theo công thức hồi quy Woźniak nhằm "
        "phản ánh độ khó thực tế của thuật ngữ đối với từng người học:"
    )
    formula("EF' = max(1.3,  EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))        (1.3)")
    body(
        "Trong cài đặt thực tế của hệ thống, để tránh trường hợp khoảng cách ôn tập bị giãn quá dài vượt quá chu kỳ một "
        "năm học, giá trị I(n) được giới hạn trần ở 365 ngày. Đồng thời, một thuật ngữ chỉ được hệ thống công nhận chuyển từ "
        "trạng thái đang học (learning) sang trạng thái đã thành thạo (mastered) khi thỏa mãn đồng thời hai điều kiện: "
        "repetition_count >= 4 và interval_days >= 15 ngày. Nếu ở một lần ôn sau đó người học đánh giá q < 3, trạng thái từ "
        "sẽ tự động hạ về learning để tăng cường ôn lại."
    )

    add_h2("1.4. Cơ sở lý thuyết thị giác máy tính đa phương thức nhận diện tác phẩm nghệ thuật")

    add_h3("1.4.1. Kiến trúc học đa phương thức SigLIP")
    body(
        "Để hỗ trợ người học nhận diện trực tiếp ảnh tác phẩm nghệ thuật hoặc sản phẩm thủ công mỹ nghệ và ánh xạ sang thuật "
        "ngữ tiếng Anh tương ứng, hệ thống sử dụng mô hình ngôn ngữ – thị giác SigLIP (Sigmoid Loss for Language Image "
        "Pre-Training), cụ thể là biến thể google/siglip-so400m-patch14-384. Khác với kiến trúc CLIP truyền thống sử dụng "
        "hàm mất mát Softmax Cross-Entropy đòi hỏi chuẩn hóa trên toàn bộ batch lớn, SigLIP sử dụng hàm mất mát Sigmoid nhị phân "
        "trên từng cặp ảnh – văn bản độc lập:"
    )
    formula("L_SigLIP = - (1 / |B|) * sum_i sum_j log( 1 / (1 + exp(-y_ij * (t * (x_i · z_j) + b))) )        (1.4)")
    body(
        "Trong đó x_i và z_j lần lượt là vector đặc trưng chuẩn hóa L2 của ảnh thứ i và mô tả văn bản thứ j, t là tham số "
        "nhiệt độ học được, b là độ lệch (bias), còn y_ij nhận giá trị +1 với cặp khớp đúng và -1 với cặp không khớp. Nhờ độ "
        "phân giải đầu vào 384 x 384 pixel cùng kích thước patch 14 x 14, SigLIP-so400m giữ lại tốt các chi tiết bề mặt tinh vi "
        "như nét cọ sơn dầu dày (impasto), độ trong của màu nước hay kết cấu vân men gốm, rất phù hợp với dữ liệu nghệ thuật."
    )

    add_h3("1.4.2. Học biểu diễn tự giám sát DINOv2 và kết hợp hai nhánh Dual-Backbone")
    body(
        "Mặc dù SigLIP rất mạnh ở khả năng căn chỉnh ngữ nghĩa văn bản – hình ảnh, một số cặp thuật ngữ mỹ thuật lại có mô tả "
        "ngữ nghĩa gần nhau nhưng khác biệt rõ rệt về cấu trúc hình học, chất liệu bề mặt hoặc bố cục không gian (ví dụ giữa "
        "chạm khắc gỗ woodcarving và chạm khắc đá stonemasonry, hoặc giữa tranh sơn mài lacquerware và tranh sơn dầu). Để giải "
        "quyết các ca nhập nhằng này, hệ thống bổ sung nhánh trích xuất đặc trưng tự giám sát DINOv2 (facebook/dinov2-base)."
    )
    body(
        "DINOv2 được huấn luyện hoàn toàn không cần nhãn văn bản bằng phương pháp chưng cất tri thức tự giám sát giữa các góc "
        "nhìn cục bộ và toàn cục của ảnh, nhờ đó vector đặc trưng đầu ra (tổng hợp cân bằng giữa token toàn cục CLS và trung "
        "bình các patch token không gian) nắm bắt rất nhạy bén kết cấu bề mặt và hình thái vật thể. Trong hệ thống học từ vựng, "
        "nhánh DINOv2 được kích hoạt thông minh cho các mẫu có độ chênh lệch logit top-2 nhỏ hoặc khi cấu hình cổng định tuyến "
        "khía cạnh sử dụng đặc trưng DINOv2, giúp tiết kiệm tài nguyên tính toán mà vẫn nâng cao độ phân biệt."
    )

    add_h3("1.4.3. Phân loại đa khía cạnh, Conformal Prediction và phát hiện ngoài miền OOD")
    body(
        "Kho từ vựng của hệ thống được tổ chức thành hai khía cạnh (facets) nghiệp vụ rõ ràng là nhóm chất liệu và kỹ thuật vẽ "
        "(medium, gồm 14 thuật ngữ) và nhóm thủ công mỹ nghệ (craft, gồm 22 thuật ngữ). Thay vì chỉ dựa vào điểm tương đồng "
        "cosine zero-shot thuần túy, tầng phân loại của AI Service thực hiện trộn tuyến tính có hiệu chỉnh nhiệt độ giữa điểm "
        "zero-shot, đầu dò tuyến tính toàn cục (Global Linear Probe), đầu dò nội khía cạnh (Intra-Facet Probe), cổng phân loại "
        "khía cạnh (Facet Gate) và mô hình cây tăng cường GBDT/MoE."
    )
    body(
        "Ngoài độ chính xác top-1, một hệ thống giáo dục tin cậy cần biết từ chối khi người dùng tải lên ảnh không thuộc lĩnh "
        "vực mỹ thuật (ví dụ ảnh hóa đơn, chân dung đời thường hoặc xe cộ) và cung cấp tập dự đoán có bảo chứng thống kê khi "
        "mẫu nằm ở vùng biên giữa hai thể loại. Hệ thống tích hợp hai cơ chế toán học bổ trợ:"
    )
    bullet(
        "Phát hiện ngoài miền (Out-Of-Distribution Rejection): lớp OOD chuyên biệt được huấn luyện cùng các lớp trong miền "
        "trong bộ phân loại tuyến tính, kết hợp với kiểm tra ngưỡng xác suất cực đại sau hiệu chỉnh nhiệt độ (cal_temp) và "
        "biên độ chênh lệch logit, giúp từ chối an toàn các ảnh ngoài miền trước khi trả kết quả học từ vựng."
    )
    bullet(
        "Dự đoán bảo chứng (Conformal Prediction): dựa trên phân vị sai số hiệu chỉnh q thu được trên tập kiểm định, hệ thống "
        "sinh ra tập ứng viên nhỏ gọn với độ bao phủ thống kê mục tiêu cao (trung bình chỉ khoảng 1,02 nhãn mỗi ảnh), giúp "
        "học viên nhận được gợi ý vừa chính xác vừa minh bạch khi tác phẩm mang tính giao thoa phong cách."
    )

    add_h2("1.5. Tổng quan công nghệ phát triển hệ thống")
    body(
        "Hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ được phát triển theo kiến trúc ứng dụng web "
        "tách biệt giữa máy khách và máy chủ kết hợp dịch vụ AI độc lập. Các công nghệ và phiên bản thực tế sử dụng trong mã "
        "nguồn dự án được tổng hợp trong Bảng 1.3."
    )

    add_table_bw(
        "Bảng 1.3: Tổng hợp hệ sinh thái công nghệ phát triển hệ thống",
        ["Phân tầng", "Công nghệ và phiên bản", "Vai trò trong hệ thống"],
        [
            ["Giao diện người dùng (Frontend)", "React 19.2, Vite 8.3, Tailwind CSS v4.3", "Xây dựng ứng dụng SPA tốc độ cao, thiết kế đáp ứng đa màn hình"],
            ["Quản lý trạng thái và định tuyến", "Zustand 5.0, React Router DOM 6.30, Axios 1.20", "Lưu trữ phiên đăng nhập, trạng thái học tập, đồng bộ interceptor làm mới token"],
            ["Máy chủ ứng dụng (Backend)", "Node.js, Express 5.2, Helmet 8.3, Rate Limit 8.7", "Cung cấp 51 điểm cuối RESTful API, bảo mật HTTP headers và chống tấn công vét cạn"],
            ["Cơ sở dữ liệu và ORM", "MySQL 8.0, Sequelize ORM 6.37, mysql2 3.24", "Quản lý 13 bảng thực thể chuẩn 3NF, hỗ trợ khóa dòng và giao dịch ACID"],
            ["Xác thực và bảo mật", "JWT 9.0, bcryptjs 3.0, Express Validator 7.3", "Ký xác thực Access/Refresh Token, băm mật khẩu, kiểm tra đầu vào"],
            ["Dịch vụ AI Vision", "Python, FastAPI 0.115+, PyTorch, Transformers 4.49+, Scikit-learn", "Chạy SigLIP + DINOv2 trên CUDA FP16 với hàng đợi micro-batching"],
            ["Kiểm thử và đóng gói", "Node test runner, Jest 30.5, Supertest 7.3, Docker Compose, Nginx", "Kiểm thử tự động 48 ca, đóng gói đa container và điều phối reverse proxy"],
        ],
        [4.0, 5.2, 6.3],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    add_h2("1.6. Kết luận chương 1")
    body(
        "Chương 1 đã phân tích rõ bối cảnh thực tiễn và những khoảng trống của các nền tảng học tiếng Anh hiện hành đối với "
        "lĩnh vực Mỹ thuật và Thủ công mỹ nghệ. Trên cơ sở đó, chương đã trình bày đầy đủ nền tảng lý thuyết toán học của "
        "thuật toán lặp lại ngắt quãng SM-2 dựa trên đường cong quên lãng Ebbinghaus, đồng thời làm rõ cơ sở kỹ thuật của "
        "mô hình thị giác máy tính đa phương thức SigLIP kết hợp DINOv2, phân loại đa khía cạnh, Conformal Prediction và "
        "phát hiện dữ liệu ngoài miền OOD. Đây là nền tảng lý thuyết và công nghệ trực tiếp phục vụ cho quá trình phân tích "
        "và thiết kế hệ thống chi tiết ở Chương 2."
    )

    # =========================================================================
    # CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
    # =========================================================================
    add_h1("CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG", page_break=True, include_in_toc=True)

    add_h2("2.1. Đặc tả yêu cầu hệ thống")

    add_h3("2.1.1. Yêu cầu chức năng")
    body(
        "Dựa trên khảo sát bài toán và thiết kế nghiệp vụ thực tế của hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ, các yêu cầu chức năng được chia thành "
        "6 phân hệ chính, bảo đảm khép kín chu trình từ tiếp nhận từ mới, củng cố bằng bài tập, duy trì trí nhớ dài hạn "
        "tới tra cứu thực tế qua hình ảnh và quản trị nội dung:"
    )
    bullet(
        "Phân hệ 1 – Xác thực và quản lý tài khoản: cho phép người dùng đăng ký tài khoản mới, đăng nhập truyền thống bằng "
        "email/mật khẩu hoặc qua Google OAuth, xác minh địa chỉ email qua liên kết token, quên và đặt lại mật khẩu, tự động "
        "xoay vòng Refresh Token khi Access Token hết hạn, cập nhật hồ sơ cá nhân, ảnh đại diện, mục tiêu học hàng ngày, "
        "xuất dữ liệu cá nhân dạng JSON và xóa tài khoản."
    )
    bullet(
        "Phân hệ 2 – Khám phá chuyên đề và học Flashcard 3D: hiển thị 2 chuyên đề mỹ thuật và thủ công mỹ nghệ cùng thanh "
        "tìm kiếm theo từ khóa và bộ lọc độ khó; cho phép học viên mở thẻ ghi nhớ lật hai mặt bằng chuột hoặc phím tắt bàn "
        "phím, nghe phát âm chuẩn qua Web Speech API, phóng to ảnh tác phẩm ở chế độ Darkroom, đọc ghi chú văn hóa – nghệ sĩ "
        "liên quan và đánh dấu đã học để đưa từ vào lịch trình SM-2."
    )
    bullet(
        "Phân hệ 3 – Bài tập củng cố và đố tranh 4 dạng: tự động tạo bộ đề từ 1 đến 50 câu hỏi thuộc chủ đề đang học với 4 "
        "dạng câu hỏi (nhìn tranh đoán thuật ngữ, chọn nghĩa Anh – Việt, chọn thuật ngữ Việt – Anh và điền từ vào câu ví dụ "
        "ngữ cảnh); hỗ trợ lưu nháp tiến trình làm bài theo mã attempt UUID trên máy chủ để khôi phục khi tải lại trang và "
        "chấm điểm tự động đồng bộ vào tiến độ SM-2."
    )
    bullet(
        "Phân hệ 4 – Ôn tập ngắt quãng SM-2 và sổ từ vựng cá nhân: cung cấp danh sách từ đến hạn ôn hôm nay, danh sách tất cả "
        "từ đang học và lịch dự báo 7 ngày tới; tiếp nhận đánh giá mức độ nhớ q để cập nhật tham số SM-2; đồng thời cho phép "
        "học viên tạo các sổ từ vựng cá nhân tùy chỉnh màu sắc, thêm từ riêng tư và đồng bộ danh sách từ nhanh chóng."
    )
    bullet(
        "Phân hệ 5 – Nhận diện ảnh tác phẩm bằng AI Vision: cho phép học viên tải lên ảnh tác phẩm tranh hoặc đồ thủ công mỹ nghệ, "
        "hệ thống trả về top các thuật ngữ dự đoán kèm độ tin cậy, tập nhãn conformal, cảnh báo ảnh ngoài miền OOD nếu không "
        "hợp lệ, thông tin từ vựng liên kết trong cơ sở dữ liệu và cho phép học viên gửi phản hồi đúng/sai để đóng vòng cải tiến mô hình."
    )
    bullet(
        "Phân hệ 6 – Thống kê học tập và bảng quản trị hệ thống: hiển thị tổng quan số từ đã học, số từ thành thạo, tỷ lệ chính "
        "xác, chuỗi ngày học liên tục và biểu đồ xu hướng; khu vực Admin cho phép phân trang tìm kiếm người dùng, khóa/mở khóa "
        "tài khoản, thay đổi vai trò, thêm/sửa/xóa thuật ngữ (có bảo vệ chống tự khóa hoặc hạ quyền Admin cuối cùng) và truy "
        "xuất nhật ký kiểm toán thao tác quản trị (Audit Log)."
    )

    add_h3("2.1.2. Yêu cầu phi chức năng")
    bullet("Tính bảo mật và an toàn xác thực: mật khẩu phải được băm bằng bcryptjs trước khi lưu; Access Token thời hạn ngắn kết hợp Refresh Token lưu dạng băm SHA-256 trong cơ sở dữ liệu có xoay vòng và thu hồi tức thời; khóa tạm thời 15 phút sau 5 lần đăng nhập sai liên tiếp; tách biệt quyền learner và admin qua middleware RBAC.")
    bullet("Tính toàn vẹn dữ liệu giao dịch: mọi thao tác cập nhật lịch ôn tập SM-2, nộp bài tập nhiều câu hỏi và đồng bộ từ vào sổ tay đều phải bọc trong Sequelize Transaction với khóa hàng bi quan (SELECT ... FOR UPDATE) theo thứ tự khóa nhất quán để loại bỏ lỗi ghi đúp hoặc deadlock khi người dùng gửi yêu cầu đồng thời.")
    bullet("Hiệu năng đáp ứng: API nghiệp vụ thông thường phản hồi dưới 200 ms nhờ bộ chỉ mục ghép (Composite Indexes) trên MySQL; dịch vụ AI Vision xử lý bằng CUDA FP16 kết hợp hàng đợi micro-batching giúp duy trì thông lượng cao khi nhiều người dùng tải ảnh cùng lúc.")
    bullet("Tính khả dụng và khả năng bảo trì: toàn bộ hệ thống đóng gói qua Docker Compose gồm các dịch vụ tách biệt (mysql, server, client, ai-service), hỗ trợ kiểm tra sức khỏe tự động (healthcheck) và cấu hình qua biến môi trường.")

    add_h3("2.1.3. Ma trận phân quyền theo vai trò tác nhân")
    body(
        "Hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ phân định rõ quyền truy cập tài nguyên cho ba vai trò tác nhân chính gồm khách vãng lai chưa "
        "đăng nhập, học viên đã xác thực (learner) và quản trị viên hệ thống (admin), được tổng hợp chi tiết trong Bảng 2.1."
    )

    add_table_bw(
        "Bảng 2.1: Ma trận phân quyền theo vai trò tác nhân trong hệ thống",
        ["Nhóm chức năng / Tài nguyên", "Khách vãng lai", "Học viên (Learner)", "Quản trị viên (Admin)"],
        [
            ["Đăng ký, đăng nhập, quên mật khẩu, đăng nhập Google", "Có", "Có", "Có"],
            ["Xem thông tin hồ sơ, đổi mật khẩu, đặt mục tiêu học", "Không", "Có", "Có"],
            ["Xem danh mục chuyên đề và tra cứu từ vựng công khai", "Không (yêu cầu đăng nhập)", "Có", "Có"],
            ["Học Flashcard 3D, nghe phát âm và đánh dấu đã học", "Không", "Có", "Có"],
            ["Tạo đề, lưu nháp và nộp bài tập củng cố 4 dạng", "Không", "Có", "Có"],
            ["Ôn tập ngắt quãng SM-2 và xem lịch dự báo 7 ngày", "Không", "Có", "Có"],
            ["Tạo sổ từ cá nhân và thêm từ vựng riêng tư", "Không", "Có (chỉ dữ liệu của mình)", "Có (chỉ dữ liệu của mình)"],
            ["Tải ảnh nhận diện AI Vision và gửi phản hồi nhãn", "Không", "Có", "Có"],
            ["Quản lý người dùng (khóa/mở khóa, đổi vai trò)", "Không", "Không", "Có (trừ tự khóa mình)"],
            ["Quản trị kho từ vựng hệ thống (thêm, sửa, xóa) và Audit Log", "Không", "Không", "Có"],
        ],
        [6.5, 3.0, 3.0, 3.0],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )

    add_h2("2.2. Mô hình hóa chức năng bằng sơ đồ Use Case")
    body(
        "Sơ đồ Use Case tổng quát (Hình 2.1) mô tả toàn cảnh tương tác giữa các tác nhân bên ngoài với 7 nhóm ca sử dụng cấp "
        "cao của hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ, làm rõ ranh giới quyền hạn giữa khách vãng lai, học viên và quản trị viên."
    )
    add_figure("fig_2_1_usecase_overview.png", "Hình 2.1: Sơ đồ Use Case tổng quát hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ", width_cm=12.0)

    body(
        "Để làm rõ mối quan hệ phụ thuộc và mở rộng giữa các nghiệp vụ trọng tâm của người học với dịch vụ trí tuệ nhân tạo, "
        "Hình 2.2 trình bày sơ đồ Use Case phân rã cho phân hệ học tập SM-2 và nhận diện ảnh AI Vision. Trong đó, ca sử dụng "
        "học Flashcard và ôn tập đến hạn bắt buộc bao hàm (include) việc cập nhật lịch trình SM-2, còn thao tác nhận diện ảnh "
        "qua AI Vision cho phép mở rộng (extend) sang ca sử dụng gửi phản hồi sửa nhãn khi người dùng muốn hiệu đính kết quả."
    )
    add_figure("fig_2_2_usecase_learning_ai.png", "Hình 2.2: Sơ đồ Use Case phân rã phân hệ học tập SM-2 và nhận diện AI Vision", width_cm=12.0)

    body(
        "Ngoài ca sử dụng đăng nhập xoay vòng Refresh Token (UC-01) và sinh đề bài tập 4 dạng chống nộp lặp (UC-03) được mô tả "
        "trực quan qua biểu đồ ở mục 2.3, Bảng 2.2 và Bảng 2.3 đặc tả chi tiết hai ca sử dụng cốt lõi gắn với thuật toán SM-2 và AI Vision:"
    )

    add_table_bw(
        "Bảng 2.2: Đặc tả ca sử dụng Ôn tập từ vựng ngắt quãng theo thuật toán SM-2",
        ["Thuộc tính đặc tả", "Nội dung chi tiết"],
        [
            ["Mã và tên Use Case", "UC-02: Ôn tập từ vựng đến hạn và cập nhật tham số SM-2"],
            ["Tác nhân", "Học viên (Learner)"],
            ["Điều kiện tiên quyết", "Học viên đã đăng nhập hợp lệ và có ít nhất một từ vựng đã khởi tạo tiến độ học"],
            ["Luồng sự kiện chính", "1. Học viên mở trang ôn tập; hệ thống gọi GET /api/reviews/due lấy các từ đến hạn.\n2. Học viên tự nhớ nghĩa, lật thẻ kiểm tra và chọn mức độ ghi nhớ q từ 0 đến 5.\n3. Máy chủ mở Sequelize Transaction, khóa bản ghi user và user_vocab_progress.\n4. Hàm calculateSM2 tính ease_factor, interval_days, repetition_count, next_review_at và trạng thái.\n5. Cập nhật user_vocab_progress, thay thế lịch review_schedules và ghi sự kiện vào review_events."],
            ["Luồng ngoại lệ", "Điểm q ngoài [0, 5] trả về lỗi 400. Lỗi ghi dữ liệu kích hoạt rollback toàn bộ giao dịch."],
        ],
        [4.0, 11.5],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    add_table_bw(
        "Bảng 2.3: Đặc tả ca sử dụng Nhận diện ảnh tác phẩm nghệ thuật bằng AI Vision",
        ["Thuộc tính đặc tả", "Nội dung chi tiết"],
        [
            ["Mã và tên Use Case", "UC-04: Nhận diện ảnh tác phẩm nghệ thuật và gửi phản hồi đóng vòng"],
            ["Tác nhân", "Học viên (Learner), AI Vision Microservice"],
            ["Điều kiện tiên quyết", "Học viên đã đăng nhập; dịch vụ FastAPI AI Vision trên cổng 8001 đã sẵn sàng"],
            ["Luồng sự kiện chính", "1. Học viên tải lên ảnh tác phẩm tranh hoặc thủ công mỹ nghệ tại trang AI Chat.\n2. Express nhận ảnh trong bộ nhớ và chuyển tiếp tới FastAPI (/predict).\n3. Hàng đợi gom micro-batch (<= 16 ảnh, <= 15 ms) chạy SigLIP 2-view và kích hoạt DINOv2 nếu mẫu nhập nhằng.\n4. Trộn điểm Linear Probe, GBDT/MoE, kiểm tra OOD và tập Conformal Prediction, lưu emb_ring.\n5. Trả top gợi ý thuật ngữ; học viên có thể xác nhận hoặc sửa nhãn vào bảng ai_feedback."],
            ["Luồng ngoại lệ", "Nếu ảnh ngoài miền nghệ thuật (is_ood = true) hệ thống cảnh báo từ chối. Quá hạn hàng đợi trả mã 503."],
        ],
        [4.0, 11.5],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    add_h2("2.3. Thiết kế hành vi hệ thống bằng biểu đồ tuần tự và hoạt động")
    body(
        "Phần thiết kế động mô tả trình tự trao đổi thông điệp theo thời gian giữa các thành phần đối với luồng xác thực JWT "
        "xoay vòng (Hình 2.3), cập nhật SM-2 giao dịch (Hình 2.4), suy luận AI Vision (Hình 2.5) và sơ đồ hoạt động cho quy trình "
        "bài tập củng cố 4 dạng (Hình 2.6)."
    )
    add_figure("fig_2_3_seq_auth.png", "Hình 2.3: Sơ đồ tuần tự luồng xác thực JWT và xoay vòng Refresh Token Rotation", width_cm=11.4)
    add_figure("fig_2_4_seq_sm2.png", "Hình 2.4: Sơ đồ tuần tự luồng ôn tập từ vựng SM-2 bọc trong Sequelize Transaction", width_cm=11.4)
    add_figure("fig_2_5_seq_ai_vision.png", "Hình 2.5: Sơ đồ tuần tự luồng nhận diện ảnh tác phẩm qua AI Vision Microservice", width_cm=11.8)
    add_figure("fig_2_6_act_exercise.png", "Hình 2.6: Sơ đồ hoạt động quy trình sinh đề bài tập 4 dạng và chấm điểm chống nộp lặp", width_cm=11.2)

    add_h2("2.4. Thiết kế kiến trúc tổng thể hệ thống")
    body(
        "Hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ được thiết kế theo mô hình kiến trúc đa tầng kết hợp microservice như minh họa tại Hình 2.7. "
        "Tầng trình diễn (React 19 SPA) giao tiếp với Backend Node.js/Express 5 thông qua Nginx Reverse Proxy điều phối /api/* "
        "và /uploads/*. Bên trong Backend, mã nguồn phân tách theo lớp Routes – Middlewares – Controllers – Services – Models "
        "làm việc với MySQL 8.0 (InnoDB), còn tác vụ suy luận thị giác máy tính GPU tách riêng sang dịch vụ Python FastAPI cổng 8001."
    )
    add_figure("fig_2_7_architecture.png", "Hình 2.7: Sơ đồ kiến trúc tổng thể hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ", width_cm=12.6)

    add_h2("2.5. Thiết kế cơ sở dữ liệu")

    add_h3("2.5.1. Sơ đồ thực thể liên kết (ERD) và tổng hợp 13 bảng dữ liệu")
    body(
        "Cơ sở dữ liệu quan hệ của hệ thống được thiết kế trên MySQL 8.0 với bộ mã ký tự utf8mb4_unicode_ci, đạt dạng chuẩn "
        "thứ 3 (3NF) và được quản lý phiên bản thông qua các tệp migration của Sequelize. Toàn bộ mô hình gồm 13 bảng thực thể "
        "liên kết chặt chẽ qua khóa ngoại toàn vẹn tham chiếu, được biểu diễn trên Hình 2.8 và tóm tắt trong Bảng 2.4."
    )
    add_figure("fig_2_8_erd_13tables.png", "Hình 2.8: Sơ đồ thực thể liên kết (ERD) 13 bảng dữ liệu hệ thống", width_cm=13.8)

    add_table_bw(
        "Bảng 2.4: Tổng hợp 13 bảng thực thể trong cơ sở dữ liệu MySQL của hệ thống",
        ["STT", "Tên bảng", "Mục đích lưu trữ nghiệp vụ", "Khóa ngoại chính"],
        [
            ["1", "users", "Tài khoản, vai trò RBAC, mục tiêu học, trạng thái khóa brute-force và Google ID", "Không có"],
            ["2", "refresh_tokens", "Bản băm SHA-256 của Refresh Token phục vụ xoay vòng và thu hồi phiên", "user_id -> users.id"],
            ["3", "admin_audit_logs", "Nhật ký thao tác quản trị (khóa tài khoản, đổi quyền, sửa kho từ)", "admin_id -> users.id"],
            ["4", "topics", "Danh mục 2 chủ đề từ vựng chuyên ngành Mỹ thuật và Thủ công mỹ nghệ", "Không có"],
            ["5", "vocabularies", "Kho từ vựng chuyên ngành kèm IPA, nghĩa Việt, ảnh minh họa, ghi chú văn hóa", "topic_id, created_by"],
            ["6", "vocab_examples", "Các câu ví dụ ngữ cảnh song ngữ bổ sung gắn với từng từ vựng", "vocabulary_id -> vocabularies.id"],
            ["7", "user_vocab_lists", "Danh sách hoặc sổ tay từ vựng cá nhân do từng học viên tự tạo", "user_id -> users.id"],
            ["8", "user_vocab_list_items", "Bảng liên kết nhiều – nhiều giữa sổ tay cá nhân và các từ vựng", "list_id, vocabulary_id"],
            ["9", "user_vocab_progress", "Trạng thái học tập và tham số thuật toán SM-2 (EF, interval, repetition)", "user_id, vocabulary_id"],
            ["10", "review_schedules", "Hàng đợi lịch hẹn ôn tập tiếp theo của từng học viên và từng từ vựng", "user_id, vocabulary_id"],
            ["11", "review_events", "Nhật ký từng lượt trả lời ôn tập kèm điểm chất lượng q và thời điểm ôn", "user_id, vocabulary_id"],
            ["12", "exercise_attempts", "Đề thi sinh ra bởi máy chủ (UUID), thời hạn 24h và kết quả chấm điểm JSON", "user_id, topic_id"],
            ["13", "ai_feedback", "Phản hồi đúng/sai của người dùng đối với dự đoán từ dịch vụ AI Vision", "user_id -> users.id"],
        ],
        [1.1, 3.6, 7.3, 3.5],
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT],
    )

    add_h3("2.5.2. Đặc tả chi tiết các bảng dữ liệu trọng tâm và chỉ mục tối ưu")
    body(
        "Bảng 2.5 tổng hợp kiểu dữ liệu, ràng buộc khóa và ý nghĩa các trường cốt lõi của nhóm bảng trọng tâm gồm users, "
        "vocabularies, user_vocab_progress, exercise_attempts, refresh_tokens, admin_audit_logs và ai_feedback."
    )

    add_table_bw(
        "Bảng 2.5: Cấu trúc chi tiết các bảng dữ liệu trọng tâm của hệ thống",
        ["Bảng", "Trường dữ liệu chính", "Kiểu dữ liệu và ràng buộc", "Mô tả ý nghĩa nghiệp vụ"],
        [
            ["users", "id, username, email, password_hash", "INT PK; VARCHAR UQ; VARCHAR(255)", "Định danh, tài khoản duy nhất và mật khẩu băm bcryptjs"],
            ["users", "role, is_active, email_verified, google_id", "ENUM('learner','admin'); BOOL; VARCHAR UQ", "Phân quyền RBAC, trạng thái kích hoạt và liên kết Google"],
            ["users", "failed_login_attempts, locked_until", "INT DEFAULT 0; DATETIME NULL", "Đếm số lần đăng nhập sai và mốc khóa tạm thời 15 phút"],
            ["vocabularies", "id, topic_id, created_by, word", "INT PK; INT FK; VARCHAR(100) IDX", "Khóa chính, chủ đề chứa từ, người tạo và thuật ngữ"],
            ["vocabularies", "pronunciation, part_of_speech, meaning_vi", "VARCHAR(200); ENUM; VARCHAR(500)", "Phiên âm IPA, từ loại và nghĩa tiếng Việt chuẩn hóa"],
            ["vocabularies", "image_url, cultural_note, related_artist", "VARCHAR; TEXT; VARCHAR(255)", "Ảnh minh họa, ghi chú văn hóa và nghệ sĩ/làng nghề"],
            ["vocabularies", "difficulty, source_type, is_approved", "ENUM; ENUM; BOOLEAN DEFAULT true", "Độ khó (easy/medium/hard), nguồn từ và duyệt hiển thị"],
            ["user_vocab_progress", "id, user_id, vocabulary_id, status", "INT PK; UQ(user_id,vocab_id); ENUM", "Tiến độ học duy nhất mỗi cặp học viên – từ (new/learning/mastered)"],
            ["user_vocab_progress", "ease_factor, interval_days, repetition_count", "FLOAT(2.5); INT(0); INT(0)", "Ba tham số cốt lõi của thuật toán SM-2"],
            ["user_vocab_progress", "correct_count, incorrect_count, next_review_at", "INT; INT; DATETIME NULL", "Số lượt đúng/sai và thời điểm đến hạn ôn kế tiếp"],
            ["exercise_attempts", "id, user_id, topic_id, questions, expires_at, result", "UUID PK; FK; JSON; DATETIME; JSON", "Đề thi ẩn đáp án tại server, hạn 24h và kết quả chống nộp lặp"],
            ["refresh_tokens", "id, user_id, token_hash, revoked_at, replaced_by_hash", "INT PK; FK; VARCHAR UQ; DATETIME", "Băm SHA-256 token, mốc thu hồi và chuỗi xoay vòng phiên"],
            ["admin_audit_logs", "id, admin_id, action, target_type, target_id, details", "INT PK; FK; VARCHAR(64); JSON", "Nhật ký thao tác quản trị và dữ liệu thay đổi"],
            ["ai_feedback", "id, user_id, image_hash, predicted_word, corrected_word, is_correct", "INT PK; FK; VARCHAR; BOOL", "Băm ảnh, nhãn AI dự đoán và nhãn hiệu đính của học viên"],
        ],
        [3.1, 4.4, 3.8, 4.2],
    )

    body(
        "Để tối ưu hiệu năng truy vấn khi dữ liệu tăng trưởng, hệ thống cài đặt ba chỉ mục ghép (Composite Indexes) trong migration: "
        "idx_review_schedules_user_completed_sched trên (user_id, is_completed, scheduled_at), idx_user_vocab_progress_user_status_next "
        "trên (user_id, status, next_review_at) và idx_vocabularies_topic_approved_diff trên (topic_id, is_approved, difficulty)."
    )

    add_h2("2.6. Thiết kế giao diện lập trình ứng dụng RESTful API")
    body(
        "Máy chủ Backend Node.js/Express cung cấp 51 điểm cuối RESTful API chia thành 10 nhóm tài nguyên dưới tiền tố /api, chuẩn hóa "
        "phản hồi qua ApiResponse và xử lý ngoại lệ qua AppError như tổng hợp trong Bảng 2.6."
    )

    add_table_bw(
        "Bảng 2.6: Danh mục các điểm cuối RESTful API cốt lõi theo 10 nhóm tài nguyên",
        ["Nhóm tài nguyên", "Phương thức và đường dẫn chính", "Phân quyền", "Chức năng xử lý"],
        [
            ["Auth (10 API)", "POST /api/auth/register, /login, /refresh, /logout, /google, /forgot-password, /reset-password, /verify-email; GET /me", "Công khai / Bearer", "Đăng ký, đăng nhập, xoay vòng Refresh Token, Google OAuth và xác minh email"],
            ["Users (6 API)", "PUT /api/users/profile, /password, /learning-goal; POST /avatar; GET /export-data; DELETE /account", "Bearer", "Quản lý hồ sơ, đổi mật khẩu, mục tiêu học, xuất dữ liệu JSON và xóa tài khoản"],
            ["Topics (2 API)", "GET /api/topics; GET /api/topics/:id", "Bearer", "Lấy danh sách 2 chuyên đề Mỹ thuật và Thủ công mỹ nghệ và thống kê tiến độ"],
            ["Vocabularies (4 API)", "GET /api/vocabularies/search, /topic/:id, /:id; POST /:id/learn", "Bearer", "Tìm kiếm thuật ngữ, lọc theo chủ đề và đánh dấu đã học để tạo lịch SM-2"],
            ["Vocab Lists (8 API)", "GET/POST /api/vocab-lists; GET/PUT/DELETE /:id; POST /words/sync", "Bearer", "Quản lý sổ từ cá nhân, đồng bộ đa danh mục và tạo từ riêng tư"],
            ["Exercises (2 API)", "GET /api/exercises/vocab/:topicId; POST /api/exercises/vocab/submit", "Bearer", "Sinh đề hoặc khôi phục attempt theo UUID; chấm điểm chống nộp lặp"],
            ["Reviews (5 API)", "GET /api/reviews/due, /learning, /upcoming, /stats; POST /:vocabId/answer", "Bearer", "Truy vấn từ đến hạn hôm nay, lịch 7 ngày và cập nhật SM-2 Transaction"],
            ["Stats (3 API)", "GET /api/stats/overview, /my-progress, /learning-trends", "Bearer", "Thống kê tổng quan, chuỗi ngày học Streak và xu hướng theo ngày"],
            ["AI Vision (4 API)", "GET /api/ai/health, /refine/:jobId; POST /api/ai/identify, /feedback", "Bearer", "Kiểm tra dịch vụ AI, nhận diện ảnh tác phẩm và lưu phản hồi nhãn"],
            ["Admin (7 API)", "GET /api/admin/users, /audit-logs; PUT /users/:id/role, /status; POST/PUT/DELETE /vocabularies", "Admin", "Quản trị người dùng, khóa/đổi vai trò, CRUD kho từ và nhật ký Audit Log"],
        ],
        [2.7, 5.7, 2.0, 5.1],
    )

    add_h2("2.7. Kết luận chương 2")
    body(
        "Chương 2 đã hoàn thành quá trình phân tích yêu cầu và thiết kế chi tiết toàn bộ hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ. Các mô hình "
        "hóa Use Case, sơ đồ tuần tự, sơ đồ hoạt động, kiến trúc tổng thể cùng thiết kế 13 bảng cơ sở dữ liệu chuẩn 3NF và "
        "51 điểm cuối RESTful API đã tạo thành bản thiết kế kỹ thuật chặt chẽ, bảo đảm tính nhất quán cho giai đoạn cài đặt "
        "và triển khai thực nghiệm ở Chương 3."
    )

    # =========================================================================
    # CHƯƠNG 3: CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG
    # =========================================================================
    add_h1("CHƯƠNG 3: CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG", page_break=True, include_in_toc=True)

    add_h2("3.1. Môi trường phát triển và cấu hình triển khai")
    body(
        "Hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ được xây dựng và kiểm thử trong môi trường phát triển đa nền tảng, hỗ trợ chạy trực tiếp trên "
        "máy cục bộ cho phát triển hoặc đóng gói đồng bộ qua Docker Compose gồm 4 dịch vụ mysql, server, client và hồ sơ mở "
        "rộng ai-service. Chi tiết cấu hình môi trường được thống kê trong Bảng 3.1."
    )

    add_table_bw(
        "Bảng 3.1: Cấu hình môi trường phát triển, kiểm thử và triển khai Docker",
        ["Thành phần hệ thống", "Thông số môi trường thực nghiệm", "Cổng dịch vụ và ghi chú triển khai"],
        [
            ["Hệ điều hành phát triển", "Windows 11 64-bit / Container Linux (Docker)", "Hỗ trợ triển khai đồng nhất qua Dockerfile"],
            ["Nền tảng Node.js và Frontend", "Node.js v24.13.0, npm, Vite 8.3, React 19.2", "Frontend dev cổng 5173; bản Nginx production cổng 5173 và 8080"],
            ["Máy chủ Backend API", "Express 5.2.1, Sequelize 6.37.8, mysql2 3.24.4", "Lắng nghe cổng 3000, endpoint kiểm tra /api/health"],
            ["Hệ quản trị cơ sở dữ liệu", "MySQL 8.0-debian (bộ mã utf8mb4_unicode_ci)", "Cổng nội bộ container 3306, ánh xạ host 127.0.0.1:3307"],
            ["Dịch vụ AI Vision Microservice", "Python 3.13, FastAPI, PyTorch CUDA FP16, SigLIP + DINOv2", "Lắng nghe cổng 8001, VRAM sử dụng khoảng 2,6 GB"],
            ["Công cụ kiểm thử và kiểm định", "Node test runner, Jest 30.5, Supertest 7.3, Oxlint 1.81", "Chạy kiểm thử đơn vị, hồi quy và kiểm định chất lượng mã nguồn"],
        ],
        [4.2, 5.8, 5.5],
    )

    add_h2("3.2. Cấu trúc tổ chức mã nguồn dự án")
    body(
        "Mã nguồn của dự án được phân tách rõ ràng theo từng phân hệ chức năng nhằm dễ bảo trì, kiểm thử và mở rộng độc lập. "
        "Cấu trúc thư mục thực tế của kho lưu trữ dự án học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ được tổ chức như sau:"
    )
    code_block(
        "do_an/\n"
        "├── client/                         # Ứng dụng Frontend SPA (React 19, Vite, Tailwind CSS v4)\n"
        "│   ├── public/images/vocab/        # Kho ảnh minh họa thuật ngữ mỹ thuật và thủ công mỹ nghệ\n"
        "│   └── src/pages/                  # Auth, Dashboard, Topics, Flashcard, Exercise, Review, AiChat, Admin\n"
        "├── server/                         # Máy chủ Backend RESTful API (Node.js, Express 5, Sequelize)\n"
        "│   └── src/\n"
        "│       ├── controllers/            # 10 Controllers xử lý HTTP request/response\n"
        "│       ├── middleware/             # auth (JWT/RBAC), rateLimiter, validate, upload, errorHandler\n"
        "│       ├── migrations/             # 2 tệp migration khởi tạo 13 bảng và chỉ mục production\n"
        "│       ├── models/                 # 13 Sequelize Models và khai báo Associations\n"
        "│       ├── routes/                 # 10 nhóm định tuyến tương ứng 51 API endpoints\n"
        "│       ├── seeders/                # Dữ liệu mẫu 2 chủ đề, 36 thuật ngữ chuẩn hóa và tài khoản mẫu\n"
        "│       └── services/               # srs.service.js, auth.service.js, vision.service.js, email.service.js\n"
        "├── ai-service/                     # Microservice thị giác máy tính Python FastAPI (cổng 8001)\n"
        "│   ├── app.py                      # Hàng đợi micro-batching, Dual-Backbone SigLIP + DINOv2, OOD, Ring Buffer\n"
        "│   ├── train_probe.py              # Huấn luyện Linear Probe, GBDT/MoE router và hiệu chỉnh nhiệt độ\n"
        "│   ├── facets.json, labels.json    # Định nghĩa 2 khía cạnh (medium, craft) và 36 nhãn chuẩn hóa\n"
        "│   └── eval/                       # Kịch bản đánh giá và tệp kết quả benchmark_report.json\n"
        "├── tests/                          # Bộ kiểm thử tích hợp nhanh (regression, sm2, frontend: 48 ca)\n"
        "├── tools/                          # Công cụ kiểm định nội dung, bảo mật, tải và xuất báo cáo\n"
        "└── docker-compose.yml              # Điều phối đa container MySQL, Server, Client Nginx và AI Service",
        "Cấu trúc tổ chức thư mục mã nguồn dự án học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ"
    )

    add_h2("3.3. Cài đặt các mô-đun nghiệp vụ cốt lõi")

    add_h3("3.3.1. Cài đặt thuật toán SM-2 và đồng bộ lịch ôn tập trong giao dịch")
    body(
        "Thuật toán lặp lại ngắt quãng SM-2 được cài đặt tập trung trong lớp SrsService tại tệp server/src/services/srs.service.js. "
        "Phương thức tĩnh calculateSM2 nhận vào trạng thái hiện tại của từ vựng (ease_factor, interval_days, repetition_count) "
        "cùng điểm đánh giá chất lượng q từ 0 đến 5, kẹp giá trị q trong biên hợp lệ, cập nhật khoảng cách ôn tập theo đúng "
        "công thức Woźniak, giới hạn trần ở 365 ngày và xác định trạng thái thành thạo mastered khi đạt đủ 4 lần lặp đúng liên "
        "tiếp với khoảng cách tối thiểu 15 ngày."
    )
    code_block(
        "static calculateSM2(currentParams, quality) {\n"
        "  let { ease_factor = 2.5, interval_days = 0, repetition_count = 0 } = currentParams;\n"
        "  quality = Math.max(0, Math.min(5, Math.round(quality)));\n\n"
        "  if (quality >= 3) {\n"
        "    if (repetition_count === 0) interval_days = 1;\n"
        "    else if (repetition_count === 1) interval_days = 6;\n"
        "    else interval_days = Math.min(Math.round(interval_days * ease_factor), 365);\n"
        "    repetition_count += 1;\n"
        "  } else {\n"
        "    repetition_count = 0;\n"
        "    interval_days = 1;\n"
        "  }\n\n"
        "  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));\n"
        "  if (ease_factor < 1.3) ease_factor = 1.3;\n\n"
        "  const next_review_at = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);\n"
        "  const status = (repetition_count >= 4 && interval_days >= 15) ? 'mastered' : 'learning';\n"
        "  return { ease_factor: parseFloat(ease_factor.toFixed(2)), interval_days, repetition_count, next_review_at, status };\n"
        "}",
        "Đoạn mã 3.1: Cài đặt hàm tính toán tham số SM-2 trong SrsService"
    )
    body(
        "Khi người học gửi kết quả ôn tập qua phương thức recordReviewAnswer, toàn bộ thao tác đọc và cập nhật đều được bọc "
        "trong sequelize.transaction. Hệ thống thực hiện khóa bản ghi cha User trước bằng t.LOCK.UPDATE, sau đó mới khóa hoặc "
        "tạo mới bản ghi UserVocabProgress, xóa lịch cũ trong ReviewSchedule, ghi lịch hẹn mới và lưu nhật ký ReviewEvent. "
        "Thứ tự khóa nhất quán từ bảng cha xuống bảng con giúp triệt tiêu nguy cơ xung đột dữ liệu khi hai yêu cầu cập nhật "
        "cùng một từ vựng đến máy chủ cùng lúc."
    )

    add_h3("3.3.2. Cài đặt cơ chế xác thực đa lớp và xoay vòng Refresh Token")
    body(
        "Trong tệp server/src/services/auth.service.js, cơ chế bảo mật phiên làm việc được triển khai theo mô hình hai token "
        "kết hợp chống tấn công vét cạn mật khẩu. Khi người dùng đăng nhập sai mật khẩu, cột failed_login_attempts được tăng "
        "thêm 1; khi chạm ngưỡng 5 lần sai liên tiếp, tài khoản tự động bị khóa tạm thời trong 15 phút và trả về mã HTTP 423. "
        "Đối với Refresh Token, hệ thống sinh mã định danh ngẫu nhiên jti gắn vào JWT và lưu bản băm SHA-256 xuống bảng "
        "refresh_tokens. Khi làm mới phiên, token cũ được kiểm tra chưa bị thu hồi và chưa hết hạn, sau đó được đánh dấu "
        "revoked_at ngay lập tức cùng tham chiếu replaced_by_hash tới token mới cấp."
    )
    body(
        "Ngoài phương thức tài khoản truyền thống, AuthService còn hỗ trợ xác thực Google OAuth 2.0 thông qua hàm "
        "verifyGoogleCredential kiểm tra chữ ký id_token, xác minh trường aud khớp Google Client ID của ứng dụng, kiểm tra "
        "nhà phát hành hợp lệ và xác nhận email đã được Google chứng thực trước khi liên kết hoặc tạo mới tài khoản learner."
    )

    add_h3("3.3.3. Cài đặt bộ sinh bài tập 4 dạng và cơ chế chống nộp lặp")
    body(
        "Phân hệ bài tập củng cố trong tệp server/src/controllers/exercise.controller.js tự động tổng hợp câu hỏi từ kho từ "
        "vựng đã duyệt của chủ đề. Thuật toán sinh xoay vòng bốn dạng câu hỏi theo chỉ số i % 4 gồm: nhìn tranh đoán thuật ngữ "
        "(image_to_word, tự động chuyển về Anh – Việt nếu từ chưa có ảnh), chọn nghĩa tiếng Việt (en_to_vi), chọn thuật ngữ "
        "tiếng Anh (vi_to_en) và điền từ vào chỗ trống câu ví dụ (fill_blank). Với mỗi câu, hệ thống chọn ngẫu nhiên 3 đáp án "
        "gây nhiễu từ các từ khác trong cùng chủ đề."
    )
    body(
        "Điểm nổi bật về bảo mật và trải nghiệm là bộ đề sau khi sinh được lưu nguyên bản kèm trường correct_option vào bảng "
        "exercise_attempts với mã UUID và thời hạn 24 giờ, trong khi hàm lọc publicAttempt loại bỏ hoàn toàn trường "
        "correct_option trước khi gửi về trình duyệt. Khi học viên nộp bài qua submitVocabExercises, hệ thống khóa bản ghi "
        "User và ExerciseAttempt trong Transaction; nếu attempt.result đã tồn tại thì trả về ngay kết quả cũ mà không tính "
        "lại điểm hay ghi trùng vào lịch sử SM-2. Nếu hợp lệ, máy chủ chấm điểm toàn bộ câu hỏi và gọi SrsService.recordReviewAnswer "
        "với quality = 4 cho câu đúng và quality = 1 cho câu sai."
    )

    add_h3("3.3.4. Cài đặt dịch vụ AI Vision Microservice và hàng đợi Micro-Batching")
    body(
        "Dịch vụ AI Vision trong tệp ai-service/app.py khởi chạy trên nền tảng FastAPI với động cơ SiglipEngine. Khi khởi động, "
        "hệ thống nạp mô hình google/siglip-so400m-patch14-384 lên GPU với độ chính xác bán đơn FP16 (hoặc FP32 trên CPU), nạp "
        "các vector nguyên mẫu văn bản đã dựng sẵn từ prototypes.npz, đồng bộ danh sách 36 nhãn cho phép từ labels.json và "
        "nạp bộ tham số Linear Probe, Gate, GBDT/MoE từ probe.npz. Nếu cấu hình cho phép nhánh DINOv2 (beta_dino > 0 hoặc "
        "dino_gate_weight > 0), mô hình facebook/dinov2-base cũng được nạp sẵn sàng."
    )
    body(
        "Để xử lý hiệu quả nhiều yêu cầu nhận diện đồng thời mà không làm tràn bộ nhớ GPU, tệp app.py cài đặt hàng đợi bất "
        "đồng bộ asyncio.Queue (tối đa 128 yêu cầu, thời gian chờ tối đa 4,5 giây) kết hợp cơ chế gom lô động: tác vụ nền "
        "lấy tối đa 16 ảnh hoặc chờ tối đa 15 ms để gộp thành một batch đưa vào GPU. Ở chế độ tải thấp (kích thước lô <= 4 và "
        "độ sâu hàng đợi <= 2), hệ thống tự động chạy suy luận hai góc nhìn (2-view) gồm ảnh gốc toàn cảnh trọng số 0,65 và "
        "ảnh cắt trung tâm 70% trọng số 0,35 nhằm tăng độ nhạy với chi tiết bề mặt tranh và đồ thủ công; khi tải cao bùng phát, "
        "hệ thống tự động chuyển về 1 góc nhìn để bảo đảm độ trễ thấp."
    )
    code_block(
        "# Trich doan suy luan thich ung 2-view va kich hoat Dual-Backbone DINOv2 (ai-service/app.py)\n"
        "q_depth = self.queue.qsize() if self.queue is not None else 0\n"
        "use_two_view = (batch_size <= ADAPTIVE_2VIEW_MAX_BATCH) and (q_depth <= ADAPTIVE_2VIEW_MAX_QUEUE)\n"
        "eval_imgs = (list(images) + [center_crop_70(im) for im in images]) if use_two_view else list(images)\n"
        "...\n"
        "if use_two_view:\n"
        "    img_feat = 0.65 * feat_all[:batch_size] + 0.35 * feat_all[batch_size:]\n"
        "    img_feat = img_feat / img_feat.norm(dim=-1, keepdim=True).clamp(min=1e-8)\n\n"
        "blended_shared = compute_blended_logits(img_feat_np, text_shared_np, **blend_common, dino_embs=None)\n"
        "if self.dino_model is not None and self._is_dino_active():\n"
        "    # Kich hoat DINOv2 cho toan lo hoac cac mau co khoang cach top-2 nhap nhang (< 0.60)\n"
        "    dino_sub_np = self._extract_dino_features([images[r] for r in ambig_idxs], use_two_view)\n"
        "    blended_shared[ambig_idxs] = compute_blended_logits(\n"
        "        img_feat_np[ambig_idxs], text_shared_np, **blend_common, dino_embs=dino_sub_np\n"
        "    )",
        "Đoạn mã 3.2: Cơ chế suy luận thích ứng hai góc nhìn và kết hợp Dual-Backbone trong app.py"
    )
    body(
        "Sau khi tính toán xác suất đã hiệu chỉnh và kiểm tra ngưỡng từ chối ngoài miền OOD, hệ thống lưu vector đặc trưng "
        "dạng float16 vào bộ đệm vòng emb_ring (tối đa 500 vector) gắn với mã emb_id ngẫu nhiên để phục vụ luồng phản hồi "
        "đóng vòng từ người dùng mà không cần lưu giữ tệp ảnh riêng tư lâu dài."
    )

    add_h2("3.4. Triển khai kho ngữ liệu chuyên ngành Mỹ thuật và Thủ công mỹ nghệ")
    body(
        "Kho ngữ liệu mẫu trong tệp server/src/seeders/artVocabData.js được biên soạn và chuẩn hóa đồng bộ với hệ thống nhãn "
        "của AI Vision gồm 2 chuyên đề cốt lõi và 36 thuật ngữ chuyên sâu. Mỗi thuật ngữ đều có đầy đủ phiên âm IPA, loại từ, "
        "nghĩa tiếng Việt, câu ví dụ ngữ cảnh song ngữ, ảnh minh họa thực tế, nghệ sĩ hoặc làng nghề tiêu biểu, ghi chú văn hóa "
        "và nguồn tham chiếu từ điển uy tín như Oxford Art Dictionary, Tate Art Glossary, Britannica và Duden Bildwörterbuch. "
        "Bảng 3.2 tóm tắt phân bổ kho ngữ liệu đang triển khai trong hệ thống."
    )

    add_table_bw(
        "Bảng 3.2: Phân bổ kho thuật ngữ tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ",
        ["Mã chủ đề", "Tên chủ đề (Anh / Việt)", "Số lượng", "Các thuật ngữ tiêu biểu đã chuẩn hóa"],
        [
            ["1", "Types of Paintings (Chất liệu & Kỹ thuật vẽ)", "14 thuật ngữ", "oil painting, watercolor, acrylic painting, fresco, sketch, mural, gouache, tempera, miniature, chiaroscuro, charcoal, pastel, triptych, digital art"],
            ["2", "Fine Crafts & Handicrafts (Thủ công mỹ nghệ)", "22 thuật ngữ", "ceramics, pottery, lacquerware, embroidery, woodcarving, calligraphy, sculpture, weaving, glassblowing, silversmithing, jewelry design, leathercraft, quilting, printmaking, engraving, mosaic, basketry, tapestry, gilding, stonemasonry, origami, blacksmithing"],
        ],
        [1.8, 4.4, 2.3, 7.0],
        [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
    )

    add_h2("3.5. Kết quả giao diện các phân hệ chính")
    body(
        "Giao diện phía máy khách React 19 được thiết kế thống nhất theo phong cách học thuật trang nhã trên nền tảng "
        "Tailwind CSS v4, tối ưu trải nghiệm học tập trên cả máy tính và thiết bị di động. Dưới đây là minh họa giao diện "
        "thực tế của các phân hệ chức năng chính trong hệ thống."
    )

    add_ui_placeholder("Hình 3.1: Giao diện đăng nhập và đăng ký tài khoản của hệ thống")
    add_ui_placeholder("Hình 3.2: Giao diện danh mục chủ đề và chi tiết thuật ngữ mỹ thuật kèm ảnh minh họa")
    add_ui_placeholder("Hình 3.3: Giao diện học từ vựng bằng thẻ ghi nhớ Flashcard 3D")
    add_ui_placeholder("Hình 3.4: Giao diện bài tập củng cố 4 dạng câu hỏi và xem giải thích sau nộp bài")
    add_ui_placeholder("Hình 3.5: Giao diện ôn tập ngắt quãng thông minh theo thuật toán SM-2")
    add_ui_placeholder("Hình 3.6: Giao diện nhận diện ảnh tác phẩm nghệ thuật bằng AI Vision và phản hồi nhãn")

    add_h2("3.6. Kết luận chương 3")
    body(
        "Chương 3 đã trình bày đầy đủ quá trình cài đặt thực nghiệm hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ, từ cấu hình môi trường Docker "
        "Compose, tổ chức mã nguồn sạch phân tầng đến chi tiết thuật toán SM-2 bọc Transaction, xác thực JWT xoay vòng, "
        "bộ sinh đề bài tập 4 dạng chống nộp lặp, kiến trúc micro-batching Dual-Backbone của AI Vision và kho 36 thuật ngữ "
        "chuyên ngành chuẩn hóa. Kết quả kiểm thử và đánh giá định lượng toàn diện hệ thống được trình bày tiếp theo ở Chương 4."
    )

    # =========================================================================
    # CHƯƠNG 4: KIỂM THỬ VÀ ĐÁNH GIÁ HỆ THỐNG
    # =========================================================================
    add_h1("CHƯƠNG 4: KIỂM THỬ VÀ ĐÁNH GIÁ HỆ THỐNG", page_break=True, include_in_toc=True)

    add_h2("4.1. Chiến lược và phương pháp kiểm thử")
    body(
        "Để bảo đảm độ tin cậy về mặt nghiệp vụ, bảo mật phân quyền và hiệu năng suy luận trí tuệ nhân tạo, công tác kiểm thử "
        "hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ được triển khai ở bốn tầng độc lập:"
    )
    bullet("Kiểm thử đơn vị thuật toán SM-2: kiểm tra toàn diện các nhánh rẽ của hàm calculateSM2 gồm lần học đầu tiên, chuỗi ôn tập tăng dần, hạ trạng thái khi quên, điều kiện thành thạo và các giá trị biên (EF >= 1,30, trần 365 ngày, kẹp quality trong [0, 5]).")
    bullet("Kiểm thử hồi quy backend và hợp đồng API: xác minh các kịch bản chống leo thang đặc quyền khi đăng ký, khóa cứng lộ đề bài tập trên máy chủ, chống nộp lặp (idempotency), rollback Transaction khi có lỗi giữa chừng, xử lý đồng thời và cấu hình bảo mật production.")
    bullet("Kiểm thử logic trạng thái giao diện (Frontend logic): chạy trực tiếp mã nguồn bộ quản lý lượt bài tập và Axios interceptor để kiểm chứng khôi phục bản nháp khi tải lại trang, tách biệt nháp giữa các tài khoản và gộp chung một yêu cầu làm mới token khi nhiều API hết hạn đồng thời.")
    bullet("Kiểm định nội dung và đánh giá thực nghiệm AI Vision: kiểm tra tính đầy đủ của 36 thuật ngữ kèm ảnh minh họa, đồng thời đo đạc độ chính xác của mô hình Dual-Backbone SigLIP + DINOv2 trên tập kiểm thử quy mô lớn và tập Gold Benchmark độc lập.")

    add_h2("4.2. Kết quả kiểm thử chức năng và hồi quy hệ thống")
    body(
        "Quá trình kiểm thử tự động toàn diện bằng lệnh npm test (chạy ba bộ tests/regression.test.cjs, tests/sm2.test.cjs và "
        "tests/frontend.test.cjs) ghi nhận kết quả đối chiếu trước và sau khi hoàn thiện sửa lỗi được tổng hợp trong Bảng 4.1. "
        "Ngoài ra, công cụ kiểm định nội dung content-validator.js xác nhận toàn bộ dữ liệu thuật ngữ và đường dẫn ảnh hợp lệ."
    )

    add_table_bw(
        "Bảng 4.1: Tổng hợp kết quả chạy bộ kiểm thử tự động trước và sau hoàn thiện",
        ["Giai đoạn kiểm thử", "Tổng số ca kiểm thử", "Số ca đạt (PASS)", "Số ca lỗi (FAIL)", "Ghi chú phạm vi thực hiện"],
        [
            ["Phiên bản gốc trước khắc phục (Baseline)", "37 ca", "16 ca (43,2%)", "21 ca (56,8%)", "Bộc lộ lỗi nộp lặp bài tập, lộ đáp án, phân trang Admin và mất nháp"],
            ["Phiên bản hoàn thiện sau sửa lỗi và bổ sung ca mới", "48 ca", "48 ca (100%)", "0 ca (0%)", "Bổ sung 3 ca seed/admin/list và 8 ca logic giao diện; thời gian chạy ~293 ms"],
        ],
        [4.5, 2.3, 2.5, 2.3, 3.9],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT],
    )

    body(
        "Bảng 4.2 liệt kê chi tiết các nhóm ca kiểm thử tiêu biểu đã được thực thi thành công (PASS 48/48) nhằm xác minh độ an "
        "toàn của các phân hệ cốt lõi."
    )

    add_table_bw(
        "Bảng 4.2: Chi tiết các nhóm ca kiểm thử hồi quy, đơn vị thuật toán SM-2 và logic giao diện",
        ["Nhóm ca kiểm thử", "Mã ca", "Nội dung kịch bản kiểm chứng thực tế", "Kết quả"],
        [
            ["Logic giao diện và Token Interceptor", "F01 – F08 (8 ca)", "Khôi phục attempt khi reload; hết hạn tạo mới; tách nháp theo tài khoản; chống phản hồi trễ ghi đè; gộp một lần refresh token đồng thời", "Đạt 8/8"],
            ["Bảo mật đăng ký, Admin và Seed", "R01, R02, R10, R16, R23, R25, R26", "Chặn gán role admin khi đăng ký; bảo toàn dữ liệu khi seed; chặn tự khóa hoặc hạ quyền Admin cuối cùng; phân trang Admin vượt 20 users", "Đạt 7/7"],
            ["Bài tập củng cố và chống gian lận", "R03, R04, R15, R17, R18, R19", "Từ chối payload giả mạo chỉ gửi boolean; chấm điểm bằng đề lưu tại server; nộp lặp trả lại kết quả cũ (idempotent); rollback khi lỗi giữa chừng", "Đạt 6/6"],
            ["Giao dịch SM-2, Sổ từ và Lịch sử", "R05 – R09, R20, R21, R27", "Hai lượt ôn đồng thời vẫn bảo toàn cả 2 log và đúng 1 lịch hẹn; kiểm tra quality nguyên [0..5]; bảo mật từ riêng tư của người dùng", "Đạt 8/8"],
            ["Cấu hình Production và Nginx", "R11 – R14, R22, R24", "Production từ chối thiếu JWT secret; test DB không dùng nhầm DB ứng dụng; đường dẫn ảnh upload đi qua backend trước regex tĩnh Nginx", "Đạt 6/6"],
            ["Đơn vị thuật toán SM-2", "TC-SM2-01 đến TC-SM2-13 (13 ca)", "Kiểm tra I(1)=1, I(2)=6, I(3)=15; ngưỡng mastered (rep>=4, I>=15); quên reset n=0, I=1; biên sàn EF=1.30 và trần 365 ngày", "Đạt 13/13"],
        ],
        [3.3, 2.7, 7.6, 1.9],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER],
    )

    body(
        "Cần lưu ý khách quan rằng bộ kiểm thử nhanh 48 ca trên sử dụng model giả lập ở tầng kiểm soát để chạy độc lập không cần "
        "khởi động MySQL Engine. Bên cạnh đó, dự án còn trang bị bộ kiểm thử tích hợp Jest + Supertest với MySQL thực tế khi "
        "kích hoạt cờ môi trường RUN_MYSQL_TESTS=1 nhằm kiểm chứng đầy đủ các ràng buộc khóa InnoDB và truy vấn SQL thật."
    )

    add_h2("4.3. Đánh giá thực nghiệm hiệu năng và độ chính xác mô hình AI Vision")
    body(
        "Dịch vụ AI Vision được đánh giá định lượng qua hai mốc thử nghiệm được ghi nhận trong ai-service/eval/benchmark_before.json "
        "và ai-service/eval/benchmark_report.json. Phiên bản hoàn thiện được kiểm định trên tập dữ liệu quy mô lớn gồm 2.162 ảnh "
        "trong miền (n_in = 2.162) và 173 ảnh ngoài miền (n_ood = 173), kết hợp đánh giá chéo trên tập Gold Benchmark độc lập gồm "
        "87 ảnh trong miền và 19 ảnh ngoài miền thu thập từ các bảo tàng và kho lưu trữ học thuật uy tín."
    )

    add_table_bw(
        "Bảng 4.3: Kết quả thực nghiệm đánh giá mô hình AI Vision trước và sau tối ưu",
        ["Chỉ số đánh giá", "Phiên bản cơ sở (n_in=178, n_ood=29)", "Phiên bản hoàn thiện (n_in=2.162, n_ood=173)", "Mức cải thiện"],
        [
            ["Độ chính xác Zero-shot Top-1", "54,49% (97/178)", "90,61% (1.959/2.162)", "+36,12 điểm %"],
            ["Độ chính xác Zero-shot Top-3", "84,27% (150/178)", "97,27% (2.103/2.162)", "+13,00 điểm %"],
            ["Độ chính xác Linear Probe Top-1", "73,60% (131/178)", "90,70% (1.961/2.162, CI 95%: 89,4–91,9%)", "+17,10 điểm %"],
            ["Độ chính xác Linear Probe Top-3", "86,52% (154/178)", "97,36% (2.105/2.162)", "+10,84 điểm %"],
            ["Độ chính xác nội khía cạnh (Within-Facet)", "83,15% (148/178)", "91,63% (1.981/2.162)", "+8,48 điểm %"],
            ["Độ bao phủ Conformal Prediction", "80,34% (cỡ tập TB: 1,19)", "91,44% (cỡ tập TB: 1,02)", "+11,10 điểm %"],
            ["Tỷ lệ từ chối đúng ảnh ngoài miền (OOD)", "100,00% (29/29)", "97,69% (169/173)", "Duy trì > 97% ở quy mô lớn"],
            ["Tỷ lệ từ chối nhầm ảnh trong miền (False Reject)", "1,69% (3/178)", "0,00% (0/2.162)", "Giảm về 0,00%"],
        ],
        [4.5, 3.8, 4.4, 2.8],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )

    add_figure("fig_4_1_ai_benchmark.png", "Hình 4.1: Biểu đồ so sánh chỉ số đánh giá AI Vision trước và sau tối ưu mô hình", width_cm=12.4)

    body(
        "Kết quả ở Bảng 4.3 và Hình 4.1 cho thấy sự nhảy vọt rõ rệt sau khi chuẩn hóa bộ nhãn về 36 khái niệm cốt lõi, áp dụng "
        "suy luận 2 góc nhìn kết hợp Dual-Backbone SigLIP + DINOv2, GBDT/MoE router và hiệu chỉnh xác suất. Độ chính xác Top-1 "
        "đạt 90,70%, độ chính xác Top-3 đạt 97,36% giúp gần như luôn đưa ra đúng thuật ngữ trong 3 gợi ý đầu cho người học. "
        "Đặc biệt, tỷ lệ từ chối nhầm ảnh hợp lệ giảm xuống 0,00% trên toàn bộ 2.162 mẫu trong miền, trong khi cỡ tập dự đoán "
        "Conformal trung bình rút gọn từ 1,19 xuống chỉ còn 1,02 nhãn nhưng vẫn bảo đảm độ bao phủ 91,44%."
    )
    body(
        "Để kiểm tra tính tổng quát hóa ở từng nhóm chuyên đề và trên dữ liệu thực tế hoàn toàn mới chưa từng tham gia huấn luyện, "
        "Bảng 4.4 và Hình 4.2 trình bày chi tiết kết quả phân tích theo khía cạnh (Per-Facet) và tập Gold Benchmark theo từng nguồn bảo tàng."
    )

    add_table_bw(
        "Bảng 4.4: Độ chính xác AI Vision theo khía cạnh và trên tập Gold Benchmark độc lập",
        ["Phân nhóm / Nguồn dữ liệu", "Số lượng mẫu", "Probe Top-1", "Probe Top-3", "Within-Facet / OOD"],
        [
            ["Khía cạnh Chất liệu & Kỹ thuật vẽ (Medium)", "727 ảnh", "84,87%", "95,19%", "86,24% (Within-Facet)"],
            ["Khía cạnh Thủ công mỹ nghệ (Craft)", "1.435 ảnh", "93,66%", "98,47%", "94,36% (Within-Facet)"],
            ["Gold Benchmark — Tổng hợp 5 nguồn", "87 in / 19 ood", "81,61%", "97,70%", "83,91% Facet | 94,74% OOD"],
            ["Gold — Cleveland Museum of Art (CMA)", "58 ảnh", "82,76%", "98,28%", "86,21% (Within-Facet)"],
            ["Gold — Victoria & Albert Museum (V&A London)", "13 in / 19 ood", "76,92%", "92,31%", "94,74% OOD Rejection (18/19)"],
            ["Gold — Wikimedia Commons", "13 ảnh", "84,62%", "100,00%", "84,62% (Within-Facet)"],
        ],
        [5.2, 2.5, 2.3, 2.3, 3.2],
        [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER],
    )

    add_figure("fig_4_2_ai_facet_gold.png", "Hình 4.2: Biểu đồ độ chính xác AI Vision theo khía cạnh và trên tập Gold Benchmark", width_cm=12.8)

    body(
        "Trên tập Gold Benchmark độc lập gồm ảnh hiện vật thực tế từ bảo tàng Cleveland CMA và V&A London, mô hình vẫn giữ "
        "được độ chính xác Top-3 đạt 97,70% (riêng CMA đạt 98,28% và Wikimedia đạt 100,00%) cùng tỷ lệ từ chối ảnh ngoài miền "
        "đạt 94,74% và 0% từ chối nhầm. Về hiệu năng thực thi trên GPU CUDA FP16, tốc độ suy luận trung bình đạt khoảng 80 ms "
        "mỗi ảnh và thông lượng xử lý đạt khoảng 22 yêu cầu/giây khi bật hàng đợi micro-batching."
    )

    add_h2("4.4. Kết luận chương 4")
    body(
        "Chương 4 đã chứng minh tính đúng đắn, an toàn và hiệu quả thực nghiệm của hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ thông qua bộ kiểm "
        "thử tự động đạt 48/48 ca thành công (100%) cùng các số liệu đánh giá AI Vision trên 2.162 ảnh trong miền, 173 ảnh ngoài "
        "miền và tập kiểm chứng độc lập từ bảo tàng quốc tế. Hệ thống đáp ứng đầy đủ các yêu cầu chức năng, bảo mật và hiệu năng "
        "đặt ra ban đầu."
    )

    # =========================================================================
    # KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
    # =========================================================================
    add_h1("KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN", page_break=True, include_in_toc=True)

    add_h2("1. Kết quả đạt được của đồ án")
    body(
        "Sau thời gian nghiên cứu lý thuyết, phân tích thiết kế và triển khai thực nghiệm, đồ án tốt nghiệp với đề tài \"Xây dựng "
        "hệ thống học từ vựng tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ\" đã hoàn thành toàn bộ các mục tiêu đề ra:"
    )
    bullet(
        "Về mặt lý thuyết: hệ thống hóa được cơ sở tâm lý học nhận thức về đường cong quên lãng Ebbinghaus, nguyên lý lặp lại "
        "ngắt quãng và công thức toán học của thuật toán SM-2; đồng thời làm rõ cơ chế kết hợp hai mô hình thị giác hiện đại "
        "SigLIP và DINOv2 cùng Conformal Prediction và phát hiện ngoài miền OOD."
    )
    bullet(
        "Về mặt phân tích và thiết kế phần mềm: xây dựng hoàn chỉnh bộ sơ đồ phân tích thiết kế hướng đối tượng (Use Case, "
        "tuần tự, hoạt động), kiến trúc đa tầng tách biệt dịch vụ AI, thiết kế 13 bảng cơ sở dữ liệu chuẩn 3NF với chỉ mục tối ưu "
        "và 51 điểm cuối RESTful API."
    )
    bullet(
        "Về mặt cài đặt và kiểm thử: hoàn thiện mã nguồn ứng dụng web Full-stack (React 19, Tailwind CSS v4, Zustand, Express 5, "
        "Sequelize ORM, MySQL 8.0) và dịch vụ AI FastAPI; chuẩn hóa kho 36 thuật ngữ chuyên ngành Mỹ thuật và Thủ công mỹ nghệ "
        "gắn với 2 chủ đề cốt lõi; đạt 48/48 ca kiểm thử tự động thành công và độ chính xác AI Vision đạt 90,70% Top-1, 97,36% "
        "Top-3 cùng 97,69% tỷ lệ loại bỏ ảnh ngoài miền."
    )

    add_h2("2. Hạn chế còn tồn tại")
    body("Bên cạnh những kết quả đạt được, hệ thống hiện vẫn còn một số điểm hạn chế cần tiếp tục cải thiện:")
    bullet("Quy mô kho từ vựng mẫu hiện tập trung vào 36 thuật ngữ tiêu biểu thuộc hai nhóm chất liệu vẽ và thủ công mỹ nghệ; chưa bao phủ mở rộng sang các phân ngành gần như kiến trúc, điêu khắc đương đại hay thiết kế thời trang.")
    bullet("Chức năng phát âm hiện dựa vào Web Speech API của trình duyệt nên mới phục vụ chiều nghe mẫu, chưa tích hợp mô hình AI nhận dạng giọng nói để chấm điểm phát âm của người học.")
    bullet("Hệ thống mới triển khai dưới dạng ứng dụng web responsive, chưa có ứng dụng di động bản địa hỗ trợ thông báo đẩy nhắc lịch ôn tập SM-2 ngoại tuyến.")

    add_h2("3. Hướng phát triển trong tương lai")
    body("Trong giai đoạn phát triển tiếp theo, đồ án có thể mở rộng theo bốn hướng trọng tâm sau:")
    bullet("Mở rộng kho thuật ngữ chuyên sâu lên hàng trăm khái niệm thuộc nhiều trường phái hội họa, gốm sứ và thủ công truyền thống Việt Nam, tận dụng trực tiếp dữ liệu phản hồi ai_feedback để tái huấn luyện bộ phân loại định kỳ.")
    bullet("Tích hợp mô hình nhận diện giọng nói và chấm điểm phát âm theo từng âm vị IPA để hoàn thiện cả kỹ năng đọc, ghi nhớ và nói thuật ngữ.")
    bullet("Bổ sung bài đọc hiểu song ngữ chuyên đề mỹ thuật và trợ lý giải thích ngữ cảnh tác phẩm bằng mô hình ngôn ngữ lớn đa phương thức.")
    bullet("Phát triển ứng dụng di động đa nền tảng kết hợp thông báo đẩy thông minh đúng thời điểm từ vựng chạm ngưỡng suy giảm trí nhớ theo lịch SM-2.")

    # =========================================================================
    # TÀI LIỆU THAM KHẢO
    # =========================================================================
    add_h1("TÀI LIỆU THAM KHẢO", page_break=True, include_in_toc=True)

    add_h2("I. Tài liệu tiếng Việt")
    refs_vi = [
        "[1] Bộ Giáo dục và Đào tạo (2018), Chương trình Giáo dục phổ thông môn Tiếng Anh, Hà Nội.",
        "[2] Đặng Văn Đức (2006), Phân tích và thiết kế hệ thống hướng đối tượng với UML, NXB Khoa học và Kỹ thuật.",
        "[3] Nguyễn Kim Thư (2020), Giáo trình Tiếng Anh chuyên ngành Mỹ thuật và Thiết kế đồ họa, NXB Mỹ thuật.",
        "[4] Trần Đình Quế, Nguyễn Mạnh Hùng (2015), Giáo trình Cơ sở dữ liệu và Hệ quản trị CSDL, NXB Bưu điện, PTIT.",
    ]
    for r in refs_vi:
        body(r, indent=False, space_after=1)

    add_h2("II. Tài liệu tiếng Anh và công trình khoa học")
    refs_en = [
        "[5] Angelopoulos, A. N., & Bates, S. (2023), \"Conformal Prediction: A Gentle Introduction\", FnTML, Vol. 16(4).",
        "[6] Ebbinghaus, H. (1885), Memory: A Contribution to Experimental Psychology, Columbia University.",
        "[7] Martin, R. C. (2017), Clean Architecture: A Craftsman's Guide to Software Structure and Design, Prentice Hall.",
        "[8] Oquab, M., et al. (2024), \"DINOv2: Learning Robust Visual Features without Supervision\", TMLR.",
        "[9] Woźniak, P. A., & Gorzelańczyk, E. J. (1994), \"Optimization of repetition spacing in learning\", ANE, Vol. 54.",
        "[10] Zhai, X., Mustafa, B., Kolesnikov, A., & Beyer, L. (2023), \"Sigmoid Loss for Language Image Pre-Training\", ICCV.",
    ]
    for r in refs_en:
        body(r, indent=False, space_after=1)

    add_h2("III. Tài liệu kỹ thuật và nguồn từ điển chuẩn hóa")
    refs_web = [
        "[11] Express.js 5, FastAPI & React 19 Docs (2025), https://expressjs.com/, https://fastapi.tiangolo.com/, https://react.dev/",
        "[12] MySQL 8.0, Sequelize ORM v6 & Oxford Art Online (2025), https://dev.mysql.com/doc/, https://www.oxfordartonline.com/",
    ]
    for r in refs_web:
        body(r, indent=False, space_after=1)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"Exported PTIT thesis DOCX: {output_path}")


if __name__ == "__main__":
    primary_paths = [
        os.path.join(ROOT_DIR, "BAO_CAO_DO_AN_TOT_NGHIEP_PTIT_MY_THUAT_VA_THU_CONG_MY_NGHE.docx"),
        os.path.join(ROOT_DIR, "docs", "report", "BAO_CAO_DO_AN_TOT_NGHIEP_PTIT_MY_THUAT_VA_THU_CONG_MY_NGHE.docx"),
    ]
    legacy_paths = [
        os.path.join(ROOT_DIR, "BAO_CAO_DO_AN_TOT_NGHIEP_PTIT_ENGLEARN.docx"),
        os.path.join(ROOT_DIR, "docs", "report", "BAO_CAO_DO_AN_TOT_NGHIEP_PTIT_ENGLEARN.docx"),
    ]
    for p in primary_paths:
        build_thesis_docx(p)
    for p in legacy_paths:
        try:
            build_thesis_docx(p)
        except PermissionError:
            print(f"Skipped locked file (currently open in Word): {p}")
