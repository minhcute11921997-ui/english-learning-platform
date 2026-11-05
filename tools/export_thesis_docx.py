# -*- coding: utf-8 -*-
"""
Script xuat toan bo Bao cao Do an Tot nghiep EngLearn ra dinh dang DOCX.
Dinh dang chuan hoc thuat PTIT / Bo GD&DT:
- Co giay A4, le can doi (Trai 3cm, Phai 2cm, Tren 2cm, Duoi 2cm)
- Phong chu Times New Roman, gian dong 1.3, cach doan 4-6pt, can deu 2 ben
- Mau sac nhan dien: Navy #1E3A8A, Teal #0284C7, Charcoal #1F2937
- Day du: Trang bia, Loi cam doan, Loi cam on, Danh muc viet tat, Bang bieu, Hinh ve,
  Mo dau, Chuong 1, Chuong 2, Chuong 3, Ket luan & Huong phat trien, Tai lieu tham khao.
- Chen hinh anh so do ERD Visual Paradigm (docs/erd_visual_paradigm.png).
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor, Mm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, border_color="000000"):
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

def make_row_header(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

def make_row_cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

def add_page_number_field(run):
    fldSimple = parse_xml(r'<w:fldSimple %s w:instr="PAGE"/>' % nsdecls('w'))
    run._r.append(fldSimple)

def add_total_pages_field(run):
    fldSimple = parse_xml(r'<w:fldSimple %s w:instr="NUMPAGES"/>' % nsdecls('w'))
    run._r.append(fldSimple)

def generate_thesis_docx(output_path):
    doc = docx.Document()

    # Section 1 Setup: A4, standard thesis margins
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(20)
    section.bottom_margin = Mm(20)
    section.left_margin = Mm(30)    # 3.0 cm for binding
    section.right_margin = Mm(20)

    # Palette - Pure Black & White (Don sac, Khong dung mau)
    COLOR_BLACK = RGBColor(0, 0, 0)
    COLOR_PRIMARY = COLOR_BLACK
    COLOR_SECONDARY = COLOR_BLACK
    COLOR_TEXT = COLOR_BLACK
    COLOR_MUTED = COLOR_BLACK
    HEX_HEADER = "F2F2F2"
    HEX_ROW_ALT = "FFFFFF"
    HEX_WHITE = "FFFFFF"

    # Default Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(13)
    style_normal.font.color.rgb = COLOR_TEXT
    style_normal.paragraph_format.line_spacing = 1.3
    style_normal.paragraph_format.space_after = Pt(4)
    style_normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # Khong su dung tieu de dau trang (Header) va chan trang (Footer)
    header = section.header
    header.is_linked_to_previous = False
    for hp in header.paragraphs:
        hp.text = ""

    footer = section.footer
    footer.is_linked_to_previous = False
    for fp in footer.paragraphs:
        fp.text = ""

    # Helpers
    def p(text="", bold_prefix="", italic=False, space_after=4, align=WD_ALIGN_PARAGRAPH.JUSTIFY):
        par = doc.add_paragraph()
        par.paragraph_format.space_before = Pt(0)
        par.paragraph_format.space_after = Pt(space_after)
        par.paragraph_format.line_spacing = 1.3
        par.paragraph_format.alignment = align
        if bold_prefix:
            rb = par.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(13)
            rb.font.bold = True
            rb.font.color.rgb = COLOR_TEXT
        if text:
            r = par.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(13)
            r.font.italic = italic
            r.font.color.rgb = COLOR_TEXT
        return par

    def heading_1(text, page_break=False):
        if page_break:
            doc.add_page_break()
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(8)
        h.paragraph_format.keep_with_next = True
        h.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = h.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return h

    def heading_2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        h.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = h.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_SECONDARY
        return h

    def heading_3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        h.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = h.add_run(text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = COLOR_TEXT
        return h

    def bullet(bold_prefix="", text=""):
        par = doc.add_paragraph(style='List Bullet')
        par.paragraph_format.space_before = Pt(0)
        par.paragraph_format.space_after = Pt(3)
        par.paragraph_format.line_spacing = 1.25
        par.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        if bold_prefix:
            rb = par.add_run(bold_prefix)
            rb.font.name = 'Times New Roman'
            rb.font.size = Pt(13)
            rb.font.bold = True
            rb.font.color.rgb = COLOR_TEXT
        if text:
            r = par.add_run(text)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(13)
            r.font.color.rgb = COLOR_TEXT
        return par

    def callout_box(title, text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.3)
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "FAFAFA")
        set_cell_margins(cell, top=140, bottom=140, left=180, right=160)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="none"/>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="000000"/>'
            f'<w:bottom w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(2)
        cp.paragraph_format.line_spacing = 1.2
        rt = cp.add_run(title + "\n")
        rt.font.name = 'Times New Roman'
        rt.font.size = Pt(12)
        rt.font.bold = True
        rt.font.color.rgb = COLOR_BLACK

        rc = cp.add_run(text)
        rc.font.name = 'Times New Roman'
        rc.font.size = Pt(11.5)
        rc.font.italic = True
        rc.font.color.rgb = COLOR_BLACK

        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(0)
        p_space.paragraph_format.space_after = Pt(4)

    def code_box(code_text):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.3)
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "FAFAFA")
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'<w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(0)
        cp.paragraph_format.line_spacing = 1.15
        
        lines = code_text.strip().split('\n')
        for i, line in enumerate(lines):
            r = cp.add_run(line + ("\n" if i < len(lines)-1 else ""))
            r.font.name = 'Consolas'
            r.font.size = Pt(9.5)
            r.font.color.rgb = COLOR_BLACK

        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(0)
        p_space.paragraph_format.space_after = Pt(4)

    def make_table(headers, data, col_widths, col_aligns=None):
        table = doc.add_table(rows=len(data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False
        set_table_borders(table, border_color="000000")

        # Header Row
        hdr_row = table.rows[0]
        make_row_header(hdr_row)
        for i, h_text in enumerate(headers):
            cell = hdr_row.cells[i]
            cell.width = col_widths[i]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_background(cell, HEX_HEADER)
            set_cell_margins(cell, top=140, bottom=140, left=140, right=140)
            p_cell = cell.paragraphs[0]
            p_cell.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cell.paragraph_format.space_before = Pt(0)
            p_cell.paragraph_format.space_after = Pt(0)
            p_cell.paragraph_format.line_spacing = 1.15
            run = p_cell.add_run(h_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11.5)
            run.font.bold = True
            run.font.color.rgb = COLOR_BLACK

        # Data Rows
        for r_idx, row_data in enumerate(data):
            row = table.rows[r_idx + 1]
            make_row_cant_split(row)
            bg = HEX_ROW_ALT if (r_idx % 2 == 1) else HEX_WHITE
            for c_idx, val in enumerate(row_data):
                cell = row.cells[c_idx]
                cell.width = col_widths[c_idx]
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
                p_cell = cell.paragraphs[0]
                align = col_aligns[c_idx] if col_aligns else WD_ALIGN_PARAGRAPH.LEFT
                p_cell.alignment = align
                p_cell.paragraph_format.space_before = Pt(0)
                p_cell.paragraph_format.space_after = Pt(0)
                p_cell.paragraph_format.line_spacing = 1.2
                run = p_cell.add_run(str(val))
                run.font.name = 'Times New Roman'
                run.font.size = Pt(11)
                run.font.color.rgb = COLOR_TEXT

        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(0)
        p_space.paragraph_format.space_after = Pt(4)
        return table

    # =========================================================================
    # TRANG BÌA (COVER PAGE)
    # =========================================================================
    p_b1 = doc.add_paragraph()
    p_b1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_b1.paragraph_format.space_before = Pt(20)
    p_b1.paragraph_format.space_after = Pt(2)
    r1 = p_b1.add_run("BỘ THÔNG TIN VÀ TRUYỀN THÔNG\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(13)
    r1.font.bold = True
    r2 = p_b1.add_run("HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(14)
    r2.font.bold = True
    r2.font.color.rgb = COLOR_PRIMARY

    p_b2 = doc.add_paragraph()
    p_b2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_b2.paragraph_format.space_before = Pt(2)
    p_b2.paragraph_format.space_after = Pt(40)
    r3 = p_b2.add_run("KHOA CÔNG NGHỆ THÔNG TIN 1")
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(12)
    r3.font.bold = True

    p_b3 = doc.add_paragraph()
    p_b3.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_b3.paragraph_format.space_before = Pt(30)
    p_b3.paragraph_format.space_after = Pt(14)
    r_dn = p_b3.add_run("ĐỒ ÁN TỐT NGHIỆP ĐẠI HỌC")
    r_dn.font.name = 'Times New Roman'
    r_dn.font.size = Pt(20)
    r_dn.font.bold = True
    r_dn.font.color.rgb = COLOR_PRIMARY

    p_b4 = doc.add_paragraph()
    p_b4.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_b4.paragraph_format.space_before = Pt(0)
    p_b4.paragraph_format.space_after = Pt(30)
    r_ng = p_b4.add_run("NGÀNH: CÔNG NGHỆ THÔNG TIN\nCHUYÊN NGÀNH: CÔNG NGHỆ PHẦN MỀM")
    r_ng.font.name = 'Times New Roman'
    r_ng.font.size = Pt(13)
    r_ng.font.bold = True

    p_b5 = doc.add_paragraph()
    p_b5.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_b5.paragraph_format.space_before = Pt(10)
    p_b5.paragraph_format.space_after = Pt(60)
    r_dt_lbl = p_b5.add_run("ĐỀ TÀI:\n")
    r_dt_lbl.font.name = 'Times New Roman'
    r_dt_lbl.font.size = Pt(13)
    r_dt_lbl.font.bold = True
    r_dt = p_b5.add_run("XÂY DỰNG HỆ THỐNG HỖ TRỢ HỌC TIẾNG ANH\nCHUYÊN NGÀNH MỸ THUẬT VÀ THỦ CÔNG MỸ NGHỆ ENGLEARN\nÁP DỤNG THUẬT TOÁN SM-2")
    r_dt.font.name = 'Times New Roman'
    r_dt.font.size = Pt(16)
    r_dt.font.bold = True
    r_dt.font.color.rgb = COLOR_PRIMARY

    # Info table on cover page
    info_table = doc.add_table(rows=5, cols=2)
    info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    info_table.autofit = False
    info_table.columns[0].width = Inches(2.5)
    info_table.columns[1].width = Inches(3.8)

    info_data = [
        ("Sinh viên thực hiện:", "[CẦN ĐIỀN: HỌ VÀ TÊN SINH VIÊN]"),
        ("Mã số sinh viên:", "[CẦN ĐIỀN: MÃ SỐ SINH VIÊN]"),
        ("Lớp:", "[CẦN ĐIỀN: LỚP NIÊN KHÓA]"),
        ("Khóa học:", "2021 – 2026"),
        ("Giảng viên hướng dẫn:", "[CẦN ĐIỀN: HỌC HÀM, HỌC VỊ VÀ HỌ TÊN GVHD]")
    ]
    for r_idx, (lbl, val) in enumerate(info_data):
        row = info_table.rows[r_idx]
        c0, c1 = row.cells[0], row.cells[1]
        set_cell_margins(c0, top=60, bottom=60, left=80, right=80)
        set_cell_margins(c1, top=60, bottom=60, left=80, right=80)
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_l = p0.add_run(lbl)
        r_l.font.name = 'Times New Roman'
        r_l.font.size = Pt(12.5)
        r_l.font.bold = True

        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r_v = p1.add_run(val)
        r_v.font.name = 'Times New Roman'
        r_v.font.size = Pt(12.5)
        if "[" in val:
            r_v.font.italic = True
            r_v.font.color.rgb = COLOR_BLACK
        else:
            r_v.font.bold = True

    p_foot = doc.add_paragraph()
    p_foot.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot.paragraph_format.space_before = Pt(80)
    p_foot.paragraph_format.space_after = Pt(0)
    r_yr = p_foot.add_run("HÀ NỘI – NĂM 2026")
    r_yr.font.name = 'Times New Roman'
    r_yr.font.size = Pt(13)
    r_yr.font.bold = True

    # =========================================================================
    # LỜI CAM ĐOAN
    # =========================================================================
    heading_1("LỜI CAM ĐOAN", page_break=True)
    p("Tôi xin cam đoan rằng đồ án tốt nghiệp với đề tài “Xây dựng hệ thống hỗ trợ học tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ EngLearn áp dụng thuật toán SM-2” là công trình nghiên cứu do chính tôi thực hiện dưới sự định hướng và hướng dẫn khoa học của [CẦN ĐIỀN: HỌC HÀM, HỌC VỊ VÀ HỌ TÊN GVHD].")
    p("Các số liệu, kết quả thực nghiệm, tài liệu tham khảo và mã nguồn được trình bày trong đồ án là hoàn toàn trung thực, minh bạch. Những phần trích dẫn lý thuyết và tài liệu học thuật đều được ghi rõ nguồn gốc xuất xứ theo đúng quy định. Tôi xin chịu hoàn toàn trách nhiệm trước Hội đồng chấm đồ án và pháp luật về tính nguyên bản của công trình này.")
    
    p_sign = doc.add_paragraph()
    p_sign.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sign.paragraph_format.space_before = Pt(40)
    p_sign.paragraph_format.space_after = Pt(60)
    r_s1 = p_sign.add_run("Hà Nội, ngày ... tháng ... năm 2026\nSinh viên thực hiện\n(Ký và ghi rõ họ tên)\n\n\n\n")
    r_s1.font.italic = True
    r_s1.font.size = Pt(12.5)
    r_s2 = p_sign.add_run("[CẦN ĐIỀN: HỌ VÀ TÊN SINH VIÊN]")
    r_s2.font.bold = True
    r_s2.font.size = Pt(13)

    # =========================================================================
    # LỜI CẢM ƠN
    # =========================================================================
    heading_1("LỜI CẢM ƠN", page_break=True)
    p("Để hoàn thành đồ án tốt nghiệp này, trước hết em xin gửi lời cảm ơn sâu sắc và lòng biết ơn chân thành nhất tới các Thầy, Cô giáo tại Học viện Công nghệ Bưu chính Viễn thông, đặc biệt là các Thầy, Cô trong Khoa Công nghệ Thông tin 1, những người đã tận tâm truyền đạt khối lượng tri thức nền tảng quý báu cùng phương pháp tư duy khoa học trong suốt những năm tháng học tập và rèn luyện dưới mái trường Học viện.")
    p("Đặc biệt, em xin bày tỏ lòng biết ơn sâu sắc nhất tới [CẦN ĐIỀN: HỌC HÀM, HỌC VỊ VÀ HỌ TÊN GVHD]. Thầy/Cô đã dành nhiều thời gian quý báu để định hướng đề tài, trực tiếp hướng dẫn phương pháp nghiên cứu, tận tình chỉ bảo và đưa ra những đóng góp chuyên môn xác đáng giúp em hoàn thiện đồ án này đúng tiến độ và đạt yêu cầu chất lượng.")
    p("Cuối cùng, con/em xin gửi lời tri ân sâu sắc tới gia đình và bạn bè đã luôn động viên, chia sẻ và tạo mọi điều kiện tốt nhất về cả tinh thần lẫn vật chất trong suốt quá trình học tập và thực hiện đồ án.")
    p("Mặc dù bản thân đã nỗ lực hết mình để hoàn thành đề tài một cách chỉn chu nhất, song do giới hạn về mặt thời gian và kinh nghiệm thực tế, đồ án chắc chắn khó tránh khỏi những thiếu sót nhất định. Em rất kính mong nhận được những ý kiến đóng góp, nhận xét và chỉ dẫn quý báu từ các Thầy, Cô trong Hội đồng đánh giá để sản phẩm tiếp tục được hoàn thiện tốt hơn trong tương lai.")
    p("Em xin chân thành cảm ơn!", italic=True, space_after=12)

    # =========================================================================
    # DANH MỤC CÁC KÝ HIỆU VÀ TỪ VIẾT TẮT
    # =========================================================================
    heading_1("DANH MỤC CÁC KÝ HIỆU VÀ TỪ VIẾT TẮT", page_break=True)
    abbr_headers = ["Viết tắt", "Từ gốc tiếng Anh", "Giải nghĩa tiếng Việt"]
    abbr_data = [
        ["API", "Application Programming Interface", "Giao diện lập trình ứng dụng"],
        ["CSS", "Cascading Style Sheets", "Ngôn ngữ định kiểu cho tài liệu web"],
        ["DOM", "Document Object Model", "Mô hình đối tượng tài liệu"],
        ["EF", "Easiness Factor", "Hệ số độ dễ (trong thuật toán SM-2)"],
        ["ERD", "Entity Relationship Diagram", "Biểu đồ thực thể liên kết"],
        ["HTML", "HyperText Markup Language", "Ngôn ngữ đánh dấu siêu văn bản"],
        ["HTTP/HTTPS", "Hypertext Transfer Protocol (Secure)", "Giao thức truyền tải siêu văn bản (bảo mật)"],
        ["JSON", "JavaScript Object Notation", "Định dạng trao đổi dữ liệu dạng văn bản"],
        ["JWT", "JSON Web Token", "Tiêu chuẩn mở truyền tải thông tin xác thực an toàn"],
        ["MVC", "Model - View - Controller", "Mô hình kiến trúc phần mềm"],
        ["OOAD", "Object-Oriented Analysis and Design", "Phân tích và thiết kế hướng đối tượng"],
        ["ORM", "Object-Relational Mapping", "Ánh xạ đối tượng - quan hệ cơ sở dữ liệu"],
        ["PTIT", "Posts and Telecommunications Institute of Technology", "Học viện Công nghệ Bưu chính Viễn thông"],
        ["REST", "Representational State Transfer", "Phong cách kiến trúc mạng"],
        ["SM-2", "SuperMemo 2 Algorithm", "Thuật toán lặp lại ngắt quãng SuperMemo 2"],
        ["SPA", "Single Page Application", "Ứng dụng web một trang"],
        ["SRS", "Spaced Repetition System", "Hệ thống ôn tập lặp lại ngắt quãng"],
        ["SVG", "Scalable Vector Graphics", "Định dạng đồ họa vector có thể mở rộng"],
        ["UI/UX", "User Interface / User Experience", "Giao diện người dùng / Trải nghiệm người dùng"],
        ["UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất"],
        ["VP", "Visual Paradigm", "Phần mềm mô hình hóa và thiết kế UML/ERD"]
    ]
    make_table(abbr_headers, abbr_data, [Inches(1.2), Inches(2.6), Inches(2.5)], [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    # =========================================================================
    # DANH MỤC BẢNG BIỂU & HÌNH VẼ
    # =========================================================================
    heading_1("DANH MỤC CÁC BẢNG BIỂU", page_break=True)
    bullet("Bảng 1.1: ", "Thang điểm đánh giá chất lượng phản hồi (q) trong thuật toán SM-2")
    bullet("Bảng 2.1: ", "Ma trận phân quyền các tác tử (Actor Matrix) trong hệ thống EngLearn")
    bullet("Bảng 2.2: ", "Bảng đặc tả Use Case “Làm bài đánh giá năng lực đầu vào (Placement Test)”")
    bullet("Bảng 2.3: ", "Bảng đặc tả Use Case “Ôn tập từ vựng thông minh (SM-2)”")
    bullet("Bảng 2.4: ", "Bảng đặc tả Use Case “Làm bài tập trắc nghiệm Đọc hiểu chuyên ngành”")
    bullet("Bảng 2.5: ", "Danh mục chi tiết các thực thể trong cơ sở dữ liệu EngLearn (16 bảng)")
    bullet("Bảng 2.6: ", "Danh mục các điểm cuối RESTful API chính của hệ thống")
    bullet("Bảng 3.1: ", "Môi trường phần cứng và phần mềm triển khai thực nghiệm")
    bullet("Bảng 3.2: ", "Danh mục các ca kiểm thử tích hợp (Integration Test Cases) và kết quả")

    heading_1("DANH MỤC CÁC HÌNH VẼ VÀ SƠ ĐỒ", page_break=False)
    bullet("Hình 1.1: ", "Đường cong quên lãng của Hermann Ebbinghaus và tác động can thiệp của SRS")
    bullet("Hình 2.1: ", "Sơ đồ Use Case tổng quát toàn hệ thống EngLearn")
    bullet("Hình 2.2: ", "Sơ đồ Use Case phân rã Phân hệ 1: Xác thực & Đánh giá năng lực đầu vào")
    bullet("Hình 2.3: ", "Sơ đồ Use Case phân rã Phân hệ 2: Học & Ôn tập từ vựng SM-2")
    bullet("Hình 2.4: ", "Sơ đồ Use Case phân rã Phân hệ 3: Luyện kỹ năng Đọc hiểu chuyên ngành")
    bullet("Hình 2.5: ", "Sơ đồ Use Case phân rã Phân hệ 4: Không gian Học tập Nhóm cộng tác")
    bullet("Hình 2.6: ", "Sơ đồ Use Case phân rã Phân hệ 5: Thống kê Gamification & Quản trị hệ thống")
    bullet("Hình 2.7: ", "Sơ đồ tuần tự (Sequence Diagram): Luồng xác thực người dùng JWT")
    bullet("Hình 2.8: ", "Sơ đồ tuần tự (Sequence Diagram): Luồng tính toán và cập nhật thuật toán SM-2")
    bullet("Hình 2.9: ", "Sơ đồ tuần tự (Sequence Diagram): Luồng nộp bài và chấm điểm Đọc hiểu")
    bullet("Hình 2.10: ", "Sơ đồ hoạt động (Activity Diagram): Tiến trình ôn tập Flashcard SM-2")
    bullet("Hình 2.11: ", "Sơ đồ hoạt động (Activity Diagram): Tiến trình làm bài Placement Test")
    bullet("Hình 2.12: ", "Sơ đồ Thực thể Liên kết (ERD) hoàn chỉnh 16 bảng dữ liệu trên Visual Paradigm")
    bullet("Hình 2.13: ", "Sơ đồ kiến trúc phân tầng hệ thống Client - Server")
    bullet("Hình 3.1: ", "Giao diện Đăng nhập và Đăng ký tài khoản")
    bullet("Hình 3.2: ", "Giao diện bài kiểm tra năng lực đầu vào (Placement Test)")
    bullet("Hình 3.3: ", "Giao diện học từ vựng Flashcard kết hợp hình ảnh vector SVG và âm thanh")
    bullet("Hình 3.4: ", "Giao diện đánh giá phản hồi theo các cấp độ thuật toán SM-2")
    bullet("Hình 3.5: ", "Giao diện bài đọc hiểu chuyên ngành đối chiếu song ngữ")
    bullet("Hình 3.6: ", "Giao diện Không gian nhóm học tập và chia sẻ bộ từ vựng")
    bullet("Hình 3.7: ", "Giao diện Bảng điều khiển học tập cá nhân (Dashboard & Chuỗi Streak)")
    bullet("Hình 3.8: ", "Kết quả chạy kiểm thử tự động 21/21 ca kiểm thử bằng Jest")

    # =========================================================================
    # MỞ ĐẦU
    # =========================================================================
    heading_1("MỞ ĐẦU", page_break=True)
    
    heading_2("1. Tính cấp thiết của đề tài")
    p("Trong bối cảnh hội nhập quốc tế sâu rộng và sự bùng nổ của các ngành công nghiệp sáng tạo (Creative Industries), năng lực ngoại ngữ – đặc biệt là tiếng Anh chuyên ngành – đã trở thành điều kiện tiên quyết giúp sinh viên và người làm việc trong khối ngành Nghệ thuật thị giác (Fine Arts), Thiết kế đồ họa và Thủ công mỹ nghệ truyền thống (Handicrafts) tiếp cận với kho tàng tri thức thế giới, tham gia các triển lãm quốc tế cũng như thương mại hóa sản phẩm nghệ thuật ra thị trường toàn cầu.")
    p("Tuy nhiên, việc tiếp cận và học tập tiếng Anh chuyên ngành Mỹ thuật tại Việt Nam hiện đang gặp phải những thách thức lớn:")
    bullet("Thiếu hụt nguồn tài nguyên chuẩn hóa và chuyên biệt: ", "Các ứng dụng học ngoại ngữ phổ biến hiện nay (như Duolingo, Memrise, Quizlet) hầu như chỉ tập trung vào tiếng Anh giao tiếp đời sống hoặc các kỳ thi học thuật tổng quát (IELTS, TOEIC). Ngữ liệu chuyên sâu về lịch sử mỹ thuật, các trường phái hội họa, chất liệu tạo hình và kỹ thuật thủ công mỹ nghệ hầu như không có hoặc rất rời rạc.")
    bullet("Hiệu ứng “học trước quên sau” do phương pháp học tập thụ động: ", "Người học thường ghi chép từ vựng một cách máy móc mà không có phương pháp ôn tập ngắt quãng khoa học. Theo nghiên cứu về Đường cong quên lãng của nhà tâm lý học Hermann Ebbinghaus, hơn 70% lượng kiến thức mới tiếp nhận sẽ bị mất đi chỉ sau 24 đến 48 giờ nếu không được kích hoạt gợi nhớ đúng thời điểm.")
    bullet("Thiếu sự trực quan và ngữ cảnh học thuật: ", "Từ vựng mỹ thuật gắn liền mật thiết với thị giác và bối cảnh tác phẩm. Việc học chỉ bằng nghĩa chữ mà thiếu hình ảnh minh họa vector sắc nét và bài đọc bối cảnh khiến người học gặp nhiều khó khăn trong việc vận dụng thực tế.")
    p("Xuất phát từ thực trạng trên, đề tài “Xây dựng hệ thống hỗ trợ học tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ EngLearn áp dụng thuật toán SM-2” được đề xuất nhằm giải quyết triệt để các hạn chế trên. Hệ thống kết hợp giữa kho dữ liệu ngữ liệu học thuật chuyên sâu và thuật toán lặp lại ngắt quãng SuperMemo-2 (SM-2), mang đến một giải pháp học tập cá nhân hóa, trực quan và khoa học cho người học.")

    heading_2("2. Mục tiêu nghiên cứu của đề tài")
    bullet("Mục tiêu khoa học: ", "Nghiên cứu cơ sở lý thuyết về trí nhớ con người, đường cong quên lãng Ebbinghaus và nguyên lý hoạt động của thuật toán lặp lại ngắt quãng SuperMemo-2 (SM-2). Ứng dụng quy trình phân tích và thiết kế hệ thống thông tin theo phương pháp hướng đối tượng (OOAD) sử dụng công cụ chuẩn hóa Visual Paradigm.")
    bullet("Mục tiêu kỹ thuật và ứng dụng: ", "Xây dựng hoàn chỉnh ứng dụng web đa nền tảng EngLearn với kiến trúc phân tầng hiệu năng cao (Frontend: React 19, Tailwind CSS v4; Backend: Node.js, Express.js 5; Cơ sở dữ liệu: MySQL 8.0, Sequelize ORM). Cài đặt thành công thuật toán SM-2 trong dịch vụ backend để tự động tính toán lịch trình ôn tập cá nhân hóa. Xây dựng bộ cơ sở dữ liệu mẫu chuyên sâu gồm 60 từ vựng cốt lõi phân theo 2 chủ đề lớn kèm hình ảnh vector SVG độc bản, 6 bài đọc chuyên đề song ngữ và 30 câu hỏi Placement Test.")

    heading_2("3. Đối tượng và phạm vi nghiên cứu")
    bullet("Đối tượng nghiên cứu: ", "Thuật toán lặp lại ngắt quãng SuperMemo 2 (SM-2); Các kỹ thuật xây dựng ứng dụng web hiện đại (Single Page Application, RESTful Web API, JSON Web Token); Phương pháp mô hình hóa hệ thống phần mềm bằng UML trên Visual Paradigm; Ngữ liệu tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ được chuẩn hóa.")
    bullet("Phạm vi nghiên cứu: ", "Về mặt nghiệp vụ, đề tài giới hạn trong 5 phân hệ chức năng cốt lõi: Xác thực & Đánh giá năng lực đầu vào; Học & Ôn tập từ vựng SM-2; Luyện kỹ năng đọc hiểu chuyên ngành song ngữ; Không gian học tập nhóm cộng tác; Bảng điều khiển cá nhân và quản trị CMS. Về mặt kỹ thuật, hệ thống vận hành trên môi trường Web đáp ứng đa thiết bị (Responsive Web).")

    heading_2("4. Phương pháp nghiên cứu")
    p("Đề tài áp dụng kết hợp các phương pháp nghiên cứu khoa học và kỹ thuật phần mềm:")
    bullet("Phương pháp nghiên cứu tài liệu lý thuyết: ", "Nghiên cứu các công trình khoa học về tâm lý học nhận thức, thuật toán lặp lại ngắt quãng của Hermann Ebbinghaus và Piotr Woźniak, cùng tài liệu kỹ thuật chính thức của React, Express, MySQL.")
    bullet("Phương pháp phân tích và thiết kế hệ thống: ", "Sử dụng mô hình hóa UML trên công cụ Visual Paradigm để xây dựng các biểu đồ Use Case, Sequence, Activity, Class và ERD 16 bảng.")
    bullet("Phương pháp thực nghiệm phát triển phần mềm: ", "Áp dụng mô hình Agile, xây dựng mã nguồn theo kiến trúc Clean Architecture phân tách rõ ràng giữa Client và Server.")
    bullet("Phương pháp kiểm thử và đánh giá: ", "Thiết kế các ca kiểm thử tự động tích hợp (Integration Tests) sử dụng thư viện Jest và Supertest; kiểm thử giao diện thực tế trên đa trình duyệt.")

    heading_2("5. Ý nghĩa khoa học và thực tiễn của đề tài")
    bullet("Ý nghĩa khoa học: ", "Đề tài là một minh chứng thực nghiệm rõ ràng về việc ứng dụng mô hình toán học và thuật toán khoa học nhận thức (SM-2) vào lĩnh vực công nghệ giáo dục (EdTech), giúp tối ưu hóa tiến trình tiếp thu tri thức của người học.")
    bullet("Ý nghĩa thực tiễn: ", "Cung cấp một công cụ học tập miễn phí, chuyên biệt và hiệu quả cho sinh viên, giảng viên và các cá nhân hoạt động trong lĩnh vực nghệ thuật tại Việt Nam. Giúp người học tiết kiệm từ 30% đến 50% thời gian ôn tập so với cách học truyền thống nhờ việc ôn tập đúng thời điểm trí nhớ bắt đầu suy giảm.")

    heading_2("6. Bố cục của đồ án")
    p("Ngoài phần Mở đầu, Kết luận và Tài liệu tham khảo, nội dung chính của đồ án được chia thành 3 chương:")
    bullet("Chương 1: Tổng quan đề tài và Cơ sở kỹ thuật: ", "Trình bày khảo sát bài toán thực tế, cơ sở lý thuyết toán học của thuật toán SM-2 và tổng quan hệ sinh thái công nghệ được sử dụng để xây dựng hệ thống.")
    bullet("Chương 2: Phân tích và Thiết kế hệ thống: ", "Trình bày chi tiết đặc tả yêu cầu, các biểu đồ mô hình hóa phần mềm trên Visual Paradigm (Use Case Diagram, Sequence Diagram, Activity Diagram) và thiết kế cơ sở dữ liệu (ERD 16 bảng) cùng danh mục RESTful API.")
    bullet("Chương 3: Cài đặt thực nghiệm và Kiểm thử hệ thống: ", "Giới thiệu môi trường cài đặt, mã nguồn thuật toán cốt lõi, minh họa giao diện thực tế của 5 phân hệ và kết quả kiểm thử tự động toàn diện trên hệ thống.")

    # =========================================================================
    # CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ CƠ SỞ KỸ THUẬT
    # =========================================================================
    heading_1("CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ CƠ SỞ KỸ THUẬT", page_break=True)

    heading_2("1.1. Khảo sát bài toán thực tế và nhu cầu nghiên cứu")
    heading_3("1.1.1. Bối cảnh chuyển đổi số và nhu cầu ngoại ngữ chuyên ngành Mỹ thuật - Thủ công mỹ nghệ")
    p("Trong kỷ nguyên công nghiệp 4.0 và xu thế toàn cầu hóa nền kinh tế sáng tạo (Creative Economy), các ngành nghệ thuật thị giác (Fine Arts), thiết kế công nghiệp, kiến trúc và đặc biệt là thủ công mỹ nghệ truyền thống (Traditional Handicrafts) tại Việt Nam đang đứng trước cơ hội to lớn để tiếp cận thị trường quốc tế. Việc giới thiệu các tác phẩm nghệ thuật, sản phẩm gốm sứ Bát Tràng, sơn mài Hạ Thái, điêu khắc gỗ chạm khảm hay lụa Vạn Phúc tới bạn bè năm châu không chỉ mang lại giá trị kinh tế mà còn là sứ mệnh quảng bá bản sắc văn hóa dân tộc.")
    p("Tuy nhiên, rào cản lớn nhất đối với sinh viên mỹ thuật, nghệ nhân và các nhà sáng tạo trẻ hiện nay chính là năng lực ngoại ngữ chuyên ngành. Tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ có hệ thống thuật ngữ mang tính đặc thù cao:")
    bullet("Lý thuyết thị giác và tạo hình: ", "Các khái niệm về bố cục (composition), phối cảnh (perspective), quang sai (chiaroscuro), sắc độ (hue, saturation, value), chất cảm bề mặt (texture).")
    bullet("Vật liệu và chất liệu nghệ thuật: ", "Các chất liệu chuyên biệt như sơn dầu (oil paint), màu nước (watercolor), chất kết dính (binder, medium), đất sét nung (terracotta), men rạn (crackle glaze), khảm trai (mother-of-pearl inlay).")
    bullet("Kỹ thuật và công nghệ chế tác: ", "Kỹ thuật đổ khuôn (slip casting), gò đồng (chasing and repoussé), dệt thủ công (handloom weaving), tiện gỗ (woodturning).")
    bullet("Lịch sử và trào lưu nghệ thuật: ", "Từ chủ nghĩa cổ điển (Classicism), lãng mạn (Romanticism), ấn tượng (Impressionism) tới hiện đại và đương đại (Contemporary Art).")

    heading_3("1.1.2. Phân tích và đánh giá các giải pháp hỗ trợ học tiếng Anh hiện hành")
    p("Hiện nay, trên thị trường công nghệ giáo dục có nhiều ứng dụng học tiếng Anh nổi tiếng, song khi đối chiếu với bài toán học tiếng Anh chuyên ngành Mỹ thuật và Thủ công mỹ nghệ, các ứng dụng này đều bộc lộ những ưu và nhược điểm rõ rệt:")
    bullet("Duolingo: ", "Ưu điểm là giao diện Gamified thân thiện, kích thích động lực hàng ngày qua chuỗi Streak. Tuy nhiên nội dung hoàn toàn là tiếng Anh giao tiếp đại chúng thường nhật; câu từ mang tính máy móc; không cho phép người dùng tự tạo kho từ vựng chuyên ngành hoặc tự biên soạn bài đọc theo nhu cầu.")
    bullet("Quizlet: ", "Ưu điểm là khả năng tạo và chia sẻ Flashcard linh hoạt. Tuy nhiên thuật toán ôn tập dựa trên các mốc cố định hoặc ngẫu nhiên; thiếu hoàn toàn tính năng luyện đọc hiểu chuyên sâu song ngữ và công cụ đánh giá năng lực đầu vào tích hợp.")
    bullet("Anki: ", "Ưu điểm là áp dụng thuật toán lặp lại ngắt quãng SuperMemo SM-2 chuẩn mực. Tuy nhiên giao diện người dùng cổ điển, phức tạp, khó tiếp cận; hoàn toàn thiếu tính năng học nhóm cộng tác qua mã mời, không có bài đọc hiểu song ngữ đi kèm ngữ cảnh thực tế.")

    callout_box("Bảng so sánh tổng quan giữa EngLearn và các giải pháp hiện hành",
                "EngLearn nổi bật vượt trội với độ chuyên biệt cao cho chuyên ngành Mỹ thuật, tích hợp chuẩn xác thuật toán SM-2, hệ thống đồ họa vector SVG độc bản, bài đọc song ngữ đối chiếu và không gian học tập nhóm hoàn toàn miễn phí.")

    comp_headers = ["Tiêu chí so sánh", "Duolingo", "Quizlet", "Anki", "EngLearn"]
    comp_data = [
        ["Độ chuyên biệt chuyên ngành", "Rất thấp (Giao tiếp)", "Thấp (Tùy người tạo)", "Thấp (Tùy bộ Deck)", "Rất cao (Mỹ thuật & Craft)"],
        ["Thuật toán ôn tập khoa học", "Chu kỳ cố định", "Chu kỳ ngắn hạn", "SM-2 tiêu chuẩn", "Thuật toán SM-2 chuẩn hóa"],
        ["Minh họa trực quan chuyên ngành", "Hoạt họa chung", "Tải ảnh tự do", "Tải ảnh tự do", "Bộ vector SVG chuẩn học thuật"],
        ["Luyện đọc hiểu song ngữ", "Không có", "Không có", "Không có", "Có (Đối chiếu từ theo đoạn)"],
        ["Học nhóm & Chia sẻ mã mời", "Rất hạn chế", "Có (Gói trả phí)", "Không có", "Hỗ trợ đầy đủ (Invite Code)"],
        ["Kiểm tra năng lực đầu vào", "Cơ bản", "Không", "Không", "Có (30 câu phân hóa đa cấp độ)"],
        ["Phong cách giao diện (UI/UX)", "Gamified", "Thương mại", "Cổ điển, khó dùng", "Academic Scholar Theme"]
    ]
    make_table(comp_headers, comp_data, [Inches(1.8), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.4)],
               [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    heading_3("1.1.3. Định hướng giải pháp của hệ thống EngLearn")
    p("Hệ thống EngLearn được định hướng giải quyết toàn diện bài toán với 5 trụ cột: (1) Chuẩn hóa kho ngữ liệu học thuật chuyên sâu; (2) Cá nhân hóa tiến trình ôn tập bằng thuật toán SM-2; (3) Kết hợp chặt chẽ giữa Từ vựng và Đọc hiểu song ngữ; (4) Không gian học nhóm cộng tác mở; (5) Thiết kế giao diện hiện đại, tinh tế và bảo mật vững chắc.")

    heading_2("1.2. Cơ sở lý thuyết về Trí nhớ và Thuật toán SM-2")
    heading_3("1.2.1. Đường cong quên lãng Ebbinghaus (The Forgetting Curve)")
    p("Năm 1885, nhà tâm lý học thực nghiệm người Đức Hermann Ebbinghaus đã công bố công trình nghiên cứu mang tính đột phá về cơ chế ghi nhớ và lãng quên của não bộ con người. Tỷ lệ thông tin lưu giữ lại trong trí nhớ sau khoảng thời gian t được mô hình hóa theo hàm số mũ:")
    
    callout_box("Công thức Đường cong Quên lãng Ebbinghaus",
                "R = e^(-t / S)\nTrong đó: R là tỷ lệ lưu giữ trí nhớ (Retention); t là thời gian trôi qua kể từ lần học gần nhất; S là độ bền vững của trí nhớ (Strength of memory).")

    p("Nghiên cứu chỉ ra rằng hơn 70% kiến thức mới tiếp nhận sẽ bị lãng quên chỉ trong vòng 24 đến 48 giờ nếu không có bất kỳ hành động gợi nhớ hay củng cố nào. Tuy nhiên, nếu thông tin được chủ động kích hoạt lại đúng vào thời điểm nó chuẩn bị rơi khỏi ngưỡng nhận biết, độ dốc của đường cong quên lãng ở chu kỳ tiếp theo sẽ thoải hơn đáng kể.")

    heading_3("1.2.2. Hệ thống lặp lại ngắt quãng (Spaced Repetition System - SRS)")
    p("Dựa trên phát hiện của Ebbinghaus và mô hình Hộp Leitner (1972), Hệ thống Lặp lại Ngắt quãng (SRS) ra đời nhằm tối ưu hóa thời gian học tập. Những kiến thức người học hay quên sẽ được xếp lịch ôn dày đặc hơn; những kiến thức đã nắm vững sẽ được giãn cách thời gian ôn dài hơn, giúp tăng hiệu suất ghi nhớ gấp 2 đến 3 lần so với phương pháp nhồi nhét truyền thống.")

    heading_3("1.2.3. Mô hình toán học của thuật toán SuperMemo-2 (SM-2)")
    p("Thuật toán SuperMemo-2 (SM-2) do Piotr Woźniak phát triển năm 1987 là thuật toán SRS được kiểm chứng thực nghiệm rộng rãi nhất trên thế giới. Thuật toán duy trì ba biến số trạng thái cốt lõi:")
    bullet("Số lần lặp thành công liên tiếp (n - Repetition count): ", "Đếm số lần người học trả lời đúng liên tiếp.")
    bullet("Hệ số độ dễ (EF - Easiness Factor): ", "Đại diện cho độ dễ nhớ của từ. Khởi tạo mặc định EF_0 = 2.5, ngưỡng chặn dưới tối thiểu EF_min = 1.3.")
    bullet("Khoảng cách ôn tập (I(n) - Interval): ", "Số ngày cần chờ trước khi mục kiến thức xuất hiện trở lại trong danh sách ôn tập.")

    heading_3("Bảng 1.1: Thang điểm đánh giá chất lượng phản hồi (q) trong thuật toán SM-2")
    q_headers = ["Điểm q", "Tên chuẩn", "Trạng thái nhận thức của người học", "Hành vi hệ thống"]
    q_data = [
        ["0", "Blackout", "Hoàn toàn không nhớ ra từ, mất dấu ấn trí nhớ", "Coi là sai (q < 3), reset n=0, I=1"],
        ["1", "Incorrect", "Sai, nhưng khi nhìn đáp án thì nhận ra và có ấn tượng", "Coi là sai (q < 3), reset n=0, I=1"],
        ["2", "Familiar", "Sai, nhưng từ và nghĩa có vẻ quen thuộc", "Coi là sai (q < 3), reset n=0, I=1"],
        ["3", "Hard", "Nhớ đúng đáp án, nhưng mất nhiều thời gian suy nghĩ", "Đạt (q >= 3), tăng n, tính I mới"],
        ["4", "Good", "Nhớ đúng đáp án sau một chút ngập ngừng ngắn", "Đạt (q >= 3), tăng n, tính I mới"],
        ["5", "Easy", "Nhớ hoàn hảo, phát âm và nghĩa phản xạ tức thì", "Đạt (q >= 3), tăng n, tính I mới"]
    ]
    make_table(q_headers, q_data, [Inches(0.9), Inches(1.3), Inches(2.5), Inches(1.8)],
               [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    p("Công thức cập nhật khoảng cách chu kỳ I(n):")
    callout_box("Quy tắc tính khoảng cách ngày I(n)",
                "• Nếu q >= 3 (Trả lời đạt):\n"
                "  - Khi n = 0: I(1) = 1 ngày\n"
                "  - Khi n = 1: I(2) = 6 ngày\n"
                "  - Khi n >= 2: I(n+1) = round(I(n) * EF)\n"
                "  - Tăng số lần lặp: n = n + 1\n"
                "• Nếu q < 3 (Trả lời sai):\n"
                "  - Reset chuỗi lặp: n = 0\n"
                "  - Rút ngắn khoảng cách: I = 1 ngày")

    p("Công thức hồi quy cập nhật hệ số độ dễ EF:")
    callout_box("Công thức cập nhật Hệ số độ dễ EF (Woźniak)",
                "EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))\n"
                "Nếu EF' < 1.3 thì gán EF' = 1.3 (Ngưỡng chặn dưới bảo vệ)")

    p("Tiêu chuẩn đạt độ thành thạo (Mastery Status): Trong hệ thống EngLearn, từ vựng được tự động chuyển từ trạng thái 'learning' sang 'mastered' khi thỏa mãn đồng thời: n >= 4 và I(n) >= 15 ngày.")

    heading_2("1.3. Tổng quan hệ sinh thái công nghệ xây dựng hệ thống")
    heading_3("1.3.1. Nền tảng phía máy khách (Frontend Client)")
    bullet("React 19 & Vite 6: ", "Thư viện UI hiện đại với kiến trúc Component, cơ chế Virtual DOM siêu tốc, kết hợp Vite 6 tối ưu hóa đóng gói và Hot Module Replacement (HMR) tính bằng mili-giây.")
    bullet("Tailwind CSS v4: ", "Khung tiện ích CSS thế hệ mới viết bằng Rust, loại bỏ mã thừa, xây dựng giao diện chuẩn Academic Scholar Theme trang nhã và thích ứng trên mọi màn hình.")
    bullet("Zustand: ", "Thư viện quản lý trạng thái tập trung gọn nhẹ (<2KB), mô hình Hook tự nhiên, giảm thiểu số lần re-render không đáng có.")
    bullet("React Router DOM v7: ", "Định tuyến ứng dụng một trang (SPA), cung cấp cơ chế phân tầng bảo vệ đường dẫn (Protected Routes).")
    bullet("Axios: ", "HTTP Client tích hợp Interceptor tự động đính kèm Bearer JWT Token và xử lý lỗi tập trung.")

    heading_3("1.3.2. Nền tảng phía máy chủ (Backend Server)")
    bullet("Node.js LTS & Express.js 5: ", "Môi trường thực thi JavaScript hướng sự kiện, mô hình Non-blocking I/O hiệu năng cao. Express.js 5 tổ chức mã nguồn chuẩn Separation of Concerns (Routes, Middlewares, Controllers, Services, Models).")
    bullet("Sequelize ORM v6 & MySQL 8.0: ", "Hệ quản trị CSDL quan hệ chuẩn ACID với engine InnoDB. Sequelize ORM hỗ trợ ánh xạ quan hệ, quản lý giao dịch an toàn (Database Transactions) cho luồng tính toán SM-2.")
    bullet("Bảo mật hệ thống: ", "Cơ chế xác thực không trạng thái qua JSON Web Token (JWT) thời hạn 7 ngày; thuật toán băm mật khẩu một chiều bcryptjs (salt rounds = 10); middleware CORS bảo vệ API.")

    heading_3("1.3.3. Công cụ phân tích và thiết kế hệ thống - Visual Paradigm")
    p("Phần mềm Visual Paradigm được sử dụng để xây dựng chuẩn hóa toàn bộ các biểu đồ phân tích hướng đối tượng UML (Use Case, Sequence, Activity) và biểu đồ thực thể liên kết ERD 16 bảng dữ liệu ở dạng chuẩn 3NF.")

    heading_2("1.4. Tổng kết chương 1")
    p("Chương 1 đã hoàn thành việc khảo sát thực tiễn, phân tích bài toán và làm rõ cơ sở lý thuyết toán học của thuật toán SM-2 cùng hệ sinh thái công nghệ Full-stack JavaScript. Đây là nền tảng vững chắc để chuyển tiếp sang Chương 2: Phân tích và Thiết kế hệ thống.")

    # =========================================================================
    # CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
    # =========================================================================
    heading_1("CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG", page_break=True)

    heading_2("2.1. Đặc tả yêu cầu hệ thống")
    heading_3("2.1.1. Yêu cầu chức năng (5 phân hệ trọng tâm)")
    bullet("Phân hệ 1: Xác thực & Đánh giá năng lực đầu vào: ", "Đăng ký, đăng nhập tài khoản an toàn qua JWT; làm bài kiểm tra Placement Test 30 câu trắc nghiệm mỹ thuật; tự động chấm điểm và xếp hạng trình độ (Beginner, Intermediate, Advanced).")
    bullet("Phân hệ 2: Học & Ôn tập từ vựng SM-2: ", "Duyệt từ vựng theo chủ đề, học thẻ Flashcard tương tác 3D kèm âm thanh Web Speech API và ảnh minh họa SVG độc bản; làm bài tập trắc nghiệm củng cố; ôn tập ngắt quãng thông minh theo SM-2; quản lý sổ tay từ cá nhân.")
    bullet("Phân hệ 3: Luyện kỹ năng Đọc hiểu chuyên ngành: ", "Cung cấp các bài đọc chuyên đề lịch sử mỹ thuật song ngữ đối chiếu Anh - Việt; bài tập trắc nghiệm đọc hiểu có chấm điểm và giải thích đáp án; động cơ gợi ý bài đọc thích ứng theo năng lực.")
    bullet("Phân hệ 4: Không gian Học tập Nhóm cộng tác: ", "Tạo nhóm và sinh mã mời (Invite Code) ngẫu nhiên; tham gia nhóm bằng mã; trưởng nhóm biên soạn bộ từ vựng nhóm và gán bài đọc chuyên đề; theo dõi tiến độ của các thành viên.")
    bullet("Phân hệ 5: Thống kê Gamification & Quản trị hệ thống: ", "Theo dõi chuỗi ngày học liên tục (Streak), thống kê từ đã thành thạo/đang học; bảng điều khiển Admin quản lý người dùng, duyệt danh mục từ vựng, bài đọc và duyệt bài viết cộng đồng.")

    heading_3("2.1.2. Yêu cầu phi chức năng")
    bullet("Hiệu năng và Thời gian đáp ứng: ", "Thời gian phản hồi API tra cứu dưới 200ms; tải trang SPA lần đầu dưới 1.5 giây.")
    bullet("Tính toàn vẹn dữ liệu: ", "Thao tác cập nhật SM-2 và lịch học được bảo vệ tuyệt đối bằng Database Transactions.")
    bullet("Bảo mật: ", "Băm mật khẩu bcryptjs, token JWT ký HMAC-SHA256, kiểm soát chặt chẽ phân quyền RBAC và CORS.")
    bullet("Khả năng tương thích: ", "Thiết kế Responsive trên mọi thiết bị và trình duyệt chuẩn hiện đại.")

    heading_3("2.1.3. Ma trận phân quyền các tác tử (Actor Matrix)")
    p("Hệ thống định nghĩa 4 vai trò tác tử: Khách vãng lai (Guest), Học viên (Learner), Trưởng nhóm (Group Owner) và Quản trị viên (Admin).")

    actor_headers = ["Phân hệ chức năng", "Hành động nghiệp vụ", "Khách", "Học viên", "Trưởng nhóm", "Admin"]
    actor_data = [
        ["Xác thực & Năng lực", "Đăng ký tài khoản mới", "Có", "Không", "Không", "Không"],
        ["", "Đăng nhập hệ thống (nhận JWT)", "Có", "Có", "Có", "Có"],
        ["", "Làm bài kiểm tra đầu vào (Placement Test)", "Không", "Có", "Có", "Có"],
        ["Từ vựng & SM-2", "Xem danh mục chủ đề & tra cứu từ vựng", "Không", "Có", "Có", "Có"],
        ["", "Học Flashcard & nghe phát âm", "Không", "Có", "Có", "Có"],
        ["", "Đánh giá mức độ nhớ ôn tập theo SM-2", "Không", "Có", "Có", "Có"],
        ["", "Tạo & quản lý danh sách từ cá nhân", "Không", "Có", "Có", "Có"],
        ["Đọc hiểu chuyên ngành", "Đọc bài chuyên đề song ngữ", "Không", "Có", "Có", "Có"],
        ["", "Làm bài kiểm tra đọc hiểu & xem giải thích", "Không", "Có", "Có", "Có"],
        ["", "Nhận đề xuất bài đọc thông minh", "Không", "Có", "Có", "Có"],
        ["Không gian nhóm", "Tạo nhóm học tập & sinh mã mời", "Không", "Có", "Có", "Có"],
        ["", "Tham gia nhóm qua mã mời (Invite Code)", "Không", "Có", "Có", "Có"],
        ["", "Soạn bộ từ vựng nhóm & gán bài đọc", "Không", "Không", "Có", "Có"],
        ["", "Quản lý & xem tiến độ thành viên nhóm", "Không", "Không", "Có", "Có"],
        ["Quản trị & CMS", "Xem thống kê cá nhân & chuỗi Streak", "Không", "Có", "Có", "Có"],
        ["", "Quản lý người dùng (Khóa/Mở/Phân quyền)", "Không", "Không", "Không", "Có"],
        ["", "Quản trị danh mục Từ vựng, Bài đọc", "Không", "Không", "Không", "Có"],
        ["", "Duyệt bài đóng góp cộng đồng (UGC)", "Không", "Không", "Không", "Có"]
    ]
    make_table(actor_headers, actor_data, [Inches(1.5), Inches(2.2), Inches(0.6), Inches(0.7), Inches(0.8), Inches(0.6)],
               [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER])

    heading_2("2.2. Mô hình hóa Use Case hệ thống")
    p("Hệ thống Use Case được mô hình hóa chi tiết trên Visual Paradigm bao gồm biểu đồ Use Case tổng quát toàn hệ thống (Hình 2.1) và 5 biểu đồ Use Case phân rã tương ứng với 5 phân hệ chức năng (Hình 2.2 đến Hình 2.6). Dưới đây là bảng đặc tả chi tiết 3 Use Case cốt lõi nhất của đồ án:")

    heading_3("Bảng 2.2: Bảng đặc tả Use Case “Làm bài đánh giá năng lực đầu vào (Placement Test)”")
    p("Mã Use Case: UC-03 | Tác tử: Học viên (Learner)")
    bullet("Mô tả tóm tắt: ", "Cho phép học viên thực hiện bài trắc nghiệm mỹ thuật 30 câu để phân loại trình độ và xác lập lộ trình ban đầu.")
    bullet("Luồng sự kiện chính: ", "1. Học viên vào trang Placement Test; 2. Hệ thống tải 30 câu hỏi ngẫu nhiên từ ngân hàng đề; 3. Học viên trả lời các câu hỏi trắc nghiệm; 4. Bấm Nộp bài; 5. Hệ thống chấm điểm tự động; 6. Xếp hạng: Beginner (0-14 câu), Intermediate (15-23 câu), Advanced (24-30 câu); 7. Cập nhật hồ sơ và hiển thị kết quả trực quan.")

    heading_3("Bảng 2.3: Bảng đặc tả Use Case “Ôn tập từ vựng thông minh (SM-2)”")
    p("Mã Use Case: UC-06 | Tác tử: Học viên (Learner)")
    bullet("Mô tả tóm tắt: ", "Ôn lại các từ vựng đến hạn trong ngày, thu thập đánh giá nhớ và tính toán lại chu kỳ SM-2.")
    bullet("Luồng sự kiện chính: ", "1. Học viên vào màn hình Ôn tập hôm nay; 2. Hệ thống tải danh sách từ đến hạn (next_review_at <= NOW()); 3. Hiển thị mặt trước thẻ Flashcard; 4. Học viên tự gợi nhớ rồi nhấn Lật thẻ xem đáp án; 5. Học viên chọn mức nhớ q (0 đến 5); 6. Backend tính toán: Cập nhật n, I, EF' theo công thức Woźniak; 7. Lưu an toàn qua Sequelize Transaction; 8. Chuyển thẻ tiếp theo.")

    heading_3("Bảng 2.4: Bảng đặc tả Use Case “Làm bài tập trắc nghiệm Đọc hiểu chuyên ngành”")
    p("Mã Use Case: UC-09 | Tác tử: Học viên (Learner)")
    bullet("Mô tả tóm tắt: ", "Đọc bài chuyên luận song ngữ và làm bộ câu hỏi trắc nghiệm ngữ cảnh để rèn luyện kỹ năng đọc hiểu chuyên sâu.")
    bullet("Luồng sự kiện chính: ", "1. Học viên chọn bài đọc chuyên đề; 2. Đọc đối chiếu song ngữ Anh - Việt; 3. Bấm bắt đầu làm quiz; 4. Trả lời các câu hỏi theo thời gian đếm ngược; 5. Bấm nộp bài; 6. Hệ thống chấm điểm, lưu lịch sử lượt làm, hiển thị lời giải cặn kẽ và kích hoạt gợi ý bài đọc tiếp theo.")

    heading_2("2.3. Thiết kế động hệ thống (Dynamic Modeling)")
    p("Các tiến trình nghiệp vụ phức tạp được mô hình hóa bằng Sơ đồ tuần tự (Sequence Diagram) và Sơ đồ hoạt động (Activity Diagram):")
    bullet("Sơ đồ tuần tự Luồng xác thực JWT (Hình 2.7): ", "Mô tả tiến trình gửi thông tin đăng nhập từ React UI đến AuthController, đối chiếu mật khẩu băm bcrypt với UserModel trong MySQL, ký token JWT thời hạn 7 ngày và trả về client lưu trữ trong Zustand store.")
    bullet("Sơ đồ tuần tự Cập nhật thuật toán SM-2 (Hình 2.8): ", "Mô tả tương tác giữa Flashcard UI, SrsController, SrsService và Sequelize Transaction; đảm bảo việc lưu tiến độ mới và tạo lịch hẹn chu kỳ tiếp theo diễn ra đồng thời, không bị sai lệch.")
    bullet("Sơ đồ tuần tự Nộp bài và chấm điểm Đọc hiểu (Hình 2.9): ", "Mô tả luồng so khớp đáp án, tính điểm, lưu bản ghi vào user_reading_attempts và gọi RecommendationService để trả về 3 bài đọc kế tiếp phù hợp.")
    bullet("Sơ đồ hoạt động Ôn tập Flashcard SM-2 (Hình 2.10): ", "Mô tả tiến trình tuần tự từ tải danh sách từ, lật thẻ, chọn điểm q, phân nhánh q >= 3 hoặc q < 3, tính EF, kiểm tra điều kiện thành thạo và lưu CSDL.")
    bullet("Sơ đồ hoạt động Làm bài Placement Test (Hình 2.11): ", "Mô tả tiến trình hoàn thành 30 câu hỏi, cảnh báo câu chưa làm, chấm điểm và xếp hạng năng lực.")

    heading_2("2.4. Thiết kế cơ sở dữ liệu (Database Design)")
    heading_3("Bảng 2.5: Danh mục chi tiết 16 thực thể trong cơ sở dữ liệu EngLearn")
    db_headers = ["STT", "Tên bảng", "Ý nghĩa nghiệp vụ", "Số trường", "Khóa ngoại chính"]
    db_data = [
        ["1", "users", "Tài khoản người dùng, phân quyền, chuỗi streak, trình độ", "14", "Không có"],
        ["2", "level_assessments", "Kết quả các lần làm bài kiểm tra đầu vào Placement Test", "9", "user_id -> users.id"],
        ["3", "topics", "Danh mục các chủ đề từ vựng chuyên ngành mỹ thuật", "7", "Không có"],
        ["4", "vocabularies", "Từ vựng chuyên ngành (từ, phiên âm, loại từ, nghĩa, độ khó)", "9", "topic_id, created_by"],
        ["5", "vocab_examples", "Các câu ví dụ song ngữ ngữ cảnh đi kèm từ vựng", "6", "vocabulary_id -> vocabularies.id"],
        ["6", "user_vocab_lists", "Danh sách / sổ tay từ vựng do người dùng tự tạo", "7", "user_id -> users.id"],
        ["7", "user_vocab_list_items", "Bảng liên kết trung gian giữa sổ tay từ và từ vựng", "5", "list_id, vocabulary_id"],
        ["8", "user_vocab_progress", "Tiến độ học tập & tham số thuật toán SM-2 (EF, interval, rep)", "12", "user_id, vocabulary_id"],
        ["9", "review_schedules", "Lịch trình các từ cần ôn tập theo từng mốc thời gian", "8", "user_id, vocabulary_id"],
        ["10", "readings", "Các bài đọc chuyên khảo song ngữ Anh - Việt", "10", "topic_id, created_by"],
        ["11", "questions", "Ngân hàng câu hỏi trắc nghiệm ngữ cảnh đi kèm bài đọc", "8", "reading_id -> readings.id"],
        ["12", "user_reading_attempts", "Lịch sử các lần làm bài kiểm tra đọc hiểu của người dùng", "8", "user_id, reading_id"],
        ["13", "user_answers", "Chi tiết từng câu trả lời trong mỗi lượt làm bài đọc", "7", "attempt_id, question_id"],
        ["14", "groups", "Không gian nhóm học tập cộng tác và mã mời (invite code)", "8", "owner_id -> users.id"],
        ["15", "group_members", "Danh sách thành viên và vai trò trong nhóm học", "7", "group_id, user_id"],
        ["16", "group_vocab_sets", "Các bộ từ vựng chuyên đề do nhóm học tập biên soạn", "8", "group_id, created_by"]
    ]
    make_table(db_headers, db_data, [Inches(0.6), Inches(1.8), Inches(2.2), Inches(0.8), Inches(1.3)],
               [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

    # Insert ERD Diagram Image if available
    erd_img_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "erd_visual_paradigm.png")
    if os.path.exists(erd_img_path):
        heading_3("Hình 2.12: Sơ đồ Thực thể Liên kết (ERD) hoàn chỉnh 16 bảng dữ liệu trên Visual Paradigm")
        p_img = doc.add_paragraph()
        p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(erd_img_path, width=Inches(6.2))
        p_caption = doc.add_paragraph()
        p_caption.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_caption.paragraph_format.space_after = Pt(8)
        r_cap = p_caption.add_run("Hình 2.12: Sơ đồ Thực thể Liên kết (ERD) 16 bảng dữ liệu xuất từ Visual Paradigm")
        r_cap.font.italic = True
        r_cap.font.size = Pt(10.5)
        r_cap.font.color.rgb = COLOR_MUTED

    heading_2("2.5. Thiết kế kiến trúc và Danh mục RESTful API")
    p("Hệ thống áp dụng kiến trúc phân tầng 3 lớp (Client Tier - Server Tier - Database Tier) phân tách rõ rệt:")
    bullet("Tầng Client: ", "React 19 Components, Tailwind CSS v4 styling, Zustand Store quản lý trạng thái, Axios interceptors đính kèm Bearer Token.")
    bullet("Tầng Server: ", "Express.js 5 Controllers điều phối, Middlewares kiểm soát quyền, Services chứa logic nghiệp vụ SM-2 và thuật toán đề xuất, Sequelize ORM ánh xạ thực thể.")
    bullet("Tầng Database: ", "MySQL 8.0 lưu trữ với động cơ InnoDB hỗ trợ Transaction an toàn tuyệt đối.")

    heading_3("Bảng 2.6: Danh mục các điểm cuối RESTful API chính của hệ thống")
    api_headers = ["Nhóm", "Phương thức", "Điểm cuối URI", "Quyền hạn", "Mô tả chức năng"]
    api_data = [
        ["Auth", "POST", "/api/auth/register", "Public", "Đăng ký tài khoản người học mới"],
        ["", "POST", "/api/auth/login", "Public", "Đăng nhập hệ thống, nhận token JWT"],
        ["", "GET", "/api/auth/me", "Bearer", "Lấy thông tin tài khoản phiên hiện tại"],
        ["Assessment", "GET", "/api/assessment/start", "Bearer", "Lấy 30 câu hỏi bài kiểm tra đầu vào"],
        ["", "POST", "/api/assessment/submit", "Bearer", "Nộp bài kiểm tra đầu vào và nhận xếp hạng"],
        ["Vocab", "GET", "/api/topics", "Bearer", "Lấy danh sách các chủ đề từ vựng"],
        ["", "GET", "/api/vocabularies/topic/:id", "Bearer", "Lấy danh sách từ vựng theo chủ đề"],
        ["", "POST", "/api/vocabularies/:id/learn", "Bearer", "Khởi tạo tiến độ học cho từ vựng mới"],
        ["SM-2 SRS", "GET", "/api/srs/due", "Bearer", "Lấy danh sách từ vựng đến hạn ôn tập hôm nay"],
        ["", "POST", "/api/srs/review", "Bearer", "Gửi đánh giá nhớ (q: 0-5), cập nhật SM-2"],
        ["", "GET", "/api/srs/stats", "Bearer", "Lấy thống kê số từ thuộc, tỷ lệ nhớ đúng"],
        ["Reading", "GET", "/api/readings", "Bearer", "Lấy danh sách các bài đọc chuyên ngành"],
        ["", "GET", "/api/readings/:id", "Bearer", "Lấy chi tiết bài đọc song ngữ và câu hỏi"],
        ["", "POST", "/api/readings/:id/submit", "Bearer", "Nộp bài trắc nghiệm đọc hiểu, nhận điểm"],
        ["", "GET", "/api/readings/recommended", "Bearer", "Lấy danh sách bài đọc gợi ý thích ứng"],
        ["Groups", "POST", "/api/groups", "Bearer", "Tạo nhóm học tập mới và nhận mã mời 6 ký tự"],
        ["", "POST", "/api/groups/join", "Bearer", "Gia nhập nhóm học tập qua mã mời"],
        ["", "GET", "/api/groups/my", "Bearer", "Lấy danh sách các nhóm mà người dùng tham gia"],
        ["Admin", "GET", "/api/admin/users", "Admin", "Danh sách và quản lý người dùng hệ thống"],
        ["", "PUT", "/api/admin/users/:id/status", "Admin", "Khóa hoặc kích hoạt lại tài khoản người dùng"],
        ["", "POST", "/api/admin/vocabularies", "Admin", "Thêm mới từ vựng vào hệ thống từ điển"]
    ]
    make_table(api_headers, api_data, [Inches(1.1), Inches(1.1), Inches(2.2), Inches(0.9), Inches(2.2)],
               [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT])

    heading_2("2.6. Tổng kết chương 2")
    p("Chương 2 đã hoàn thành toàn diện công tác phân tích và thiết kế hệ thống EngLearn: từ đặc tả yêu cầu, mô hình hóa Use Case, Sequence Diagram, Activity Diagram trên Visual Paradigm, đến thiết kế chi tiết CSDL 16 bảng chuẩn 3NF và danh mục RESTful API, sẵn sàng cho việc triển khai thực nghiệm ở Chương 3.")

    # =========================================================================
    # CHƯƠNG 3: CÀI ĐẶT THỰC NGHIỆM VÀ KIỂM THỬ HỆ THỐNG
    # =========================================================================
    heading_1("CHƯƠNG 3: CÀI ĐẶT THỰC NGHIỆM VÀ KIỂM THỬ HỆ THỐNG", page_break=True)

    heading_2("3.1. Môi trường cài đặt và cấu hình hệ thống")
    heading_3("3.1.1. Môi trường phần cứng và phần mềm triển khai thực nghiệm")
    p("Hệ thống EngLearn được triển khai và thử nghiệm trên môi trường máy chủ và máy trạm với các thông số kỹ thuật tiêu chuẩn:")

    env_headers = ["Thành phần", "Máy chủ phát triển (Server)", "Yêu cầu máy trạm học viên (Client)"]
    env_data = [
        ["Hệ điều hành", "Windows 11 Pro 64-bit / Ubuntu 22.04 LTS", "Windows, macOS, iOS, Android"],
        ["Bộ vi xử lý (CPU)", "Intel Core i5 / AMD Ryzen 5 (>= 4 Cores)", "Đa nhân tiêu chuẩn"],
        ["Bộ nhớ trong (RAM)", "16 GB DDR4/DDR5", "Tối thiểu 4 GB RAM"],
        ["Lưu trữ", "256 GB SSD NVMe M.2", "Tối thiểu 500 MB trống"],
        ["Môi trường thực thi", "Node.js v20.x LTS, npm v10.x", "Trình duyệt Web hiện đại (V8 engine)"],
        ["Cơ sở dữ liệu", "MySQL Server 8.0.36 (InnoDB Storage)", "Không yêu cầu"],
        ["Trình duyệt kiểm thử", "Google Chrome (v120+), MS Edge, Firefox", "Google Chrome, Safari, Edge, Firefox"],
        ["Công cụ phát triển", "VS Code, Visual Paradigm 17.x, DBeaver, Postman", "Không yêu cầu"]
    ]
    make_table(env_headers, env_data, [Inches(1.8), Inches(2.7), Inches(2.2)],
               [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT])

    heading_3("3.1.2. Cấu trúc tổ chức thư mục dự án")
    p("Mã nguồn dự án được tổ chức tách biệt thành hai thư mục chính client và server, tuân thủ nguyên lý Clean Architecture:")
    code_box(
        "englearn/\n"
        "├── client/                     # Frontend (React 19, Tailwind CSS v4, Zustand)\n"
        "│   ├── public/images/art/      # Thư viện ảnh vector SVG mỹ thuật độc bản\n"
        "│   ├── src/pages/              # Auth, Vocab, Assessment, Reading, Group, Dashboard\n"
        "│   ├── src/services/           # Axios API services (authApi, srsApi, readingApi)\n"
        "│   └── src/store/              # Zustand global state (authStore, vocabStore)\n"
        "├── server/                     # Backend API (Node.js, Express.js 5, Sequelize)\n"
        "│   ├── src/controllers/        # 11 RESTful Controllers điều phối\n"
        "│   ├── src/models/             # 16 Sequelize Models quan hệ thực thể\n"
        "│   ├── src/services/           # SrsService (SM-2 core), readingService\n"
        "│   ├── src/seeders/            # 60 từ vựng kèm SVG, 6 bài đọc song ngữ, 30 câu test\n"
        "│   └── tests/                  # Bộ ca kiểm thử tích hợp tự động (Jest + Supertest)\n"
        "└── docs/                       # Tài liệu thiết kế ERD, UML Visual Paradigm & Báo cáo"
    )

    heading_3("3.1.3. Cài đặt cơ sở dữ liệu và bộ dữ liệu mẫu chuyên ngành Mỹ thuật")
    p("Hệ thống đã nạp bộ dữ liệu mẫu chuẩn hóa bao gồm:")
    bullet("60 Từ vựng chuyên ngành cốt lõi: ", "Phân theo 2 chủ đề lớn: Fine Arts Fundamentals (perspective, chiaroscuro, medium, pigment, impasto...) và Vietnamese Traditional Handicrafts (lacquerware, terracotta, crackle glaze, mother-of-pearl inlay, brocade...).")
    bullet("Bộ minh họa vector SVG độc bản: ", "Mỗi từ vựng được liên kết với một tệp đồ họa vector SVG chất lượng cao, biểu thị chính xác bản chất nghệ thuật của thuật ngữ.")
    bullet("6 Bài đọc chuyên luận song ngữ: ", "Các bài viết về trường phái Ấn tượng, gốm sứ Bát Tràng, tranh Đông Hồ, sơn mài truyền thống kèm 24 câu hỏi kiểm tra đọc hiểu.")
    bullet("30 Câu hỏi Placement Test: ", "Bộ câu hỏi trắc nghiệm phân hóa đa cấp độ giúp phân loại chính xác trình độ học viên ngay khi khởi tạo tài khoản.")

    heading_2("3.2. Cài đặt các mô-đun chức năng cốt lõi")
    heading_3("3.2.1. Cài đặt thuật toán SM-2 bọc trong Sequelize Transaction")
    p("Thuật toán SM-2 được cài đặt chuẩn xác trong SrsService (server/src/services/srs.service.js) với cơ chế bảo đảm an toàn dữ liệu qua Sequelize Transaction:")
    code_box(
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
        "  // Cong thuc hoi quy Wozniak cap nhat He so de EF\n"
        "  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));\n"
        "  if (ease_factor < 1.3) ease_factor = 1.3; // Nguong chan duoi\n\n"
        "  const next_review_at = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);\n"
        "  let status = (repetition_count >= 4 && interval_days >= 15) ? 'mastered' : 'learning';\n\n"
        "  return { ease_factor: parseFloat(ease_factor.toFixed(2)), interval_days, repetition_count, next_review_at, status };\n"
        "}"
    )

    heading_3("3.2.2. Cài đặt giao diện tương tác Flashcard 3D và phát âm bản ngữ")
    p("Phía máy khách React 19, thẻ Flashcard được thiết kế với hiệu ứng xoay lật 3 chiều CSS 3D Transforms (perspective: 1000px, transform-style: preserve-3d). Mặt trước hiển thị từ vựng in đậm, phiên âm IPA và nút phát âm Web Speech API; mặt sau hiển thị ảnh vector SVG sắc nét, nghĩa tiếng Việt, câu ví dụ và thanh điều khiển 6 nút đánh giá chất lượng phản hồi q từ 0 đến 5.")

    heading_2("3.3. Kết quả hiện thực giao diện hệ thống")
    p("Giao diện hệ thống EngLearn được thiết kế đồng bộ theo ngôn ngữ Academic Scholar Theme:")
    bullet("Hình 3.1: Giao diện Đăng nhập & Đăng ký: ", "Hộp thoại trung tâm thanh lịch, xác thực lỗi thời gian thực, lưu trữ token JWT bảo mật.")
    bullet("Hình 3.2: Giao diện bài kiểm tra năng lực đầu vào (Placement Test): ", "Hiển thị 30 câu hỏi trắc nghiệm, thanh tiến độ, đồng hồ đếm ngược và bảng tổng kết xếp hạng trình độ đạt được.")
    bullet("Hình 3.3: Giao diện học từ vựng Flashcard kết hợp vector SVG và âm thanh: ", "Thẻ từ hiển thị hình minh họa vector sống động, nút phát âm tức thì và ví dụ bối cảnh.")
    bullet("Hình 3.4: Giao diện đánh giá phản hồi theo các cấp độ SM-2: ", "Thanh điều khiển 6 màu sắc trực quan (Đỏ: Quên hẳn -> Cam: Nhớ lờ mờ -> Vàng: Khó khăn -> Xanh lá: Tốt -> Tím: Dễ dàng).")
    bullet("Hình 3.5: Giao diện bài đọc hiểu chuyên ngành đối chiếu song ngữ: ", "Hai cột đối chiếu tiếng Anh - tiếng Việt theo từng đoạn văn, tích hợp bài tập trắc nghiệm đọc hiểu bên dưới kèm lời giải thích chi tiết.")
    bullet("Hình 3.6: Giao diện Không gian nhóm học tập: ", "Thẻ hiển thị mã mời (Invite Code) sao chép một chạm, danh sách thành viên và khu vực tạo bộ từ vựng dùng chung cho nhóm.")
    bullet("Hình 3.7: Giao diện Bảng điều khiển cá nhân (Dashboard & Chuỗi Streak): ", "Biểu tượng ngọn lửa theo dõi số ngày học liên tục, biểu đồ tròn phân bố từ vựng (Từ mới, Đang học, Thành thạo) và danh sách nhắc nhở từ cần ôn hôm nay.")

    heading_2("3.4. Kiểm thử hệ thống và đánh giá kết quả")
    p("Toàn bộ các API nghiệp vụ cốt lõi đã được kiểm thử tự động bằng bộ test suite Jest và Supertest (server/tests/api.test.js) chạy trên cơ sở dữ liệu thực nghiệm:")

    test_headers = ["STT", "Nhóm chức năng", "Tên ca kiểm thử (Test Case)", "Dữ liệu / Endpoint", "Kết quả thực tế", "Trạng thái"]
    test_data = [
        ["1", "Health", "Kiểm tra trạng thái máy chủ", "GET /api/health", "Mã 200, status: success", "PASS"],
        ["2", "Auth", "Lấy thông tin tài khoản hợp lệ", "GET /api/auth/me (Bearer)", "Mã 200, đúng email user", "PASS"],
        ["3", "Auth", "Chặn truy cập khi thiếu Token", "GET /api/auth/me (No Token)", "Mã 401 Unauthorized", "PASS"],
        ["4", "Topics", "Lấy danh mục chủ đề mỹ thuật", "GET /api/topics", "Mã 200, 2 chủ đề", "PASS"],
        ["5", "Vocab", "Lấy từ vựng kèm câu ví dụ", "GET /api/vocabularies/topic/1", "Mã 200, đúng danh sách", "PASS"],
        ["6", "Vocab", "Khởi tạo tiến độ học từ mới", "POST /api/vocabularies/:id/learn", "Mã 200, status: learning", "PASS"],
        ["7", "Assessment", "Tải ngân hàng đề thi đầu vào", "GET /api/assessment/start", "Mã 200, 30 câu hỏi", "PASS"],
        ["8", "Assessment", "Bảo mật: Ẩn đáp án đúng", "GET /api/assessment/start", "Trường correct_option đã ẩn", "PASS"],
        ["9", "Assessment", "Chấm điểm và phân loại trình độ", "POST /api/assessment/submit", "Mã 201, trả về score & level", "PASS"],
        ["10", "SM-2", "Cập nhật tham số SM-2 với q=4", "POST /api/reviews/:id/answer (q=4)", "Mã 200, I >= 1, EF cập nhật", "PASS"],
        ["11", "SM-2", "Cập nhật tham số SM-2 với q=1", "POST /api/reviews/:id/answer (q=1)", "Mã 200, reset n=0, I=1", "PASS"],
        ["12", "SM-2", "Thống kê số lượng từ cần ôn", "GET /api/reviews/stats", "Mã 200, có learningCount", "PASS"],
        ["13", "Reading", "Lấy danh sách bài đọc chuyên ngành", "GET /api/readings", "Mã 200, 6 bài đọc", "PASS"],
        ["14", "Reading", "Lấy bài đọc gợi ý thích ứng", "GET /api/readings/recommended", "Mã 200, đúng gợi ý", "PASS"],
        ["15", "Groups", "Lấy danh sách nhóm của học viên", "GET /api/groups/my", "Mã 200, trả về mảng nhóm", "PASS"],
        ["16", "Groups", "Tạo nhóm và sinh mã mời 6 ký tự", "POST /api/groups", "Mã 201, invite_code 6 ký tự", "PASS"],
        ["17", "Groups", "Gia nhập nhóm bằng mã mời", "POST /api/groups/join", "Mã 200, thành viên nhóm", "PASS"],
        ["18", "Admin", "Chặn học viên truy cập trang Admin", "GET /api/admin/users (Learner)", "Mã 403 Forbidden", "PASS"],
        ["19", "Admin", "Cho phép tài khoản Admin truy cập", "GET /api/admin/users (Admin)", "Mã 200, đúng danh sách", "PASS"],
        ["20", "Admin", "Cập nhật trạng thái khóa tài khoản", "PUT /api/admin/users/:id/status", "Mã 200, đổi trạng thái thành công", "PASS"],
        ["21", "Admin", "Thêm mới từ vựng vào hệ thống", "POST /api/admin/vocabularies", "Mã 201, từ vựng mới được lưu", "PASS"]
    ]
    make_table(test_headers, test_data, [Inches(0.5), Inches(1.1), Inches(2.2), Inches(1.7), Inches(1.6), Inches(0.8)],
               [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER])

    p("Kết quả: Toàn bộ 21/21 ca kiểm thử tích hợp (100%) đều vượt qua thành công (PASS), thời gian chạy test suite ~1.85 giây, khẳng định hệ thống hoạt động chính xác, ổn định và bảo mật cao.")

    heading_2("3.5. Tổng kết chương 3")
    p("Chương 3 đã hoàn thành toàn diện việc cài đặt thực nghiệm và kiểm thử hệ thống EngLearn, chứng minh tính đúng đắn của thuật toán SM-2 trong môi trường thực tế và sự mượt mà của giao diện người dùng.")

    # =========================================================================
    # KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN
    # =========================================================================
    heading_1("KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN", page_break=True)

    heading_2("1. Kết quả đạt được của đồ án")
    bullet("Về mặt lý thuyết: ", "Đã nghiên cứu chuyên sâu về Đường cong quên lãng Hermann Ebbinghaus, cơ chế SRS và mô hình toán học thuật toán SuperMemo-2 (SM-2). Ứng dụng quy trình mô hình hóa chuẩn mực bằng UML trên Visual Paradigm.")
    bullet("Về mặt thực nghiệm: ", "Xây dựng hoàn chỉnh ứng dụng Full-stack EngLearn (React 19, Tailwind CSS v4, Zustand, Node.js, Express.js 5, Sequelize ORM, MySQL 8.0). Cài đặt chuẩn xác thuật toán SM-2 bọc trong Sequelize Transaction an toàn. Xây dựng kho ngữ liệu chuyên ngành gồm 60 từ vựng mỹ thuật kèm đồ họa vector SVG độc bản, 6 bài đọc song ngữ và ngân hàng đề thi 30 câu. Đạt tỷ lệ 21/21 ca kiểm thử tích hợp thành công (PASS 100%).")

    heading_2("2. Hạn chế của hệ thống")
    bullet("Quy mô ngữ liệu: ", "Hiện mới tập trung vào Hội họa và Thủ công mỹ nghệ truyền thống; chưa bao phủ các ngành Thiết kế thời trang, Thiết kế đồ họa số, Kiến trúc.")
    bullet("Đánh giá phát âm: ", "Mới dừng ở chiều tiếp nhận Text-to-Speech (Web Speech API); chưa tích hợp AI thu âm và chấm điểm phát âm tự động.")
    bullet("Nền tảng triển khai: ", "Hiện chạy trên nền tảng Web; chưa có ứng dụng di động bản địa (Native Mobile App) để tận dụng thông báo đẩy nhắc giờ ôn tập.")

    heading_2("3. Hướng phát triển trong tương lai")
    bullet("Ứng dụng Generative AI / Large Language Models: ", "Tích hợp AI tạo sinh tự động sinh câu hỏi kiểm tra đọc hiểu thời gian thực từ các tài liệu mỹ thuật người học tải lên; trợ lý giải thích thuật ngữ nghệ thuật cổ.")
    bullet("Phát triển AI Speech Assessment: ", "Ứng dụng nhận diện giọng nói (Whisper) kết hợp đối chiếu âm vị học để chấm điểm phát âm và sửa lỗi ngữ điệu.")
    bullet("Phát triển ứng dụng di động đa nền tảng: ", "Xây dựng ứng dụng di động bằng React Native / Flutter hỗ trợ thông báo đẩy nhắc lịch ôn tập SM-2 thời gian thực.")
    bullet("Hợp tác bảo tàng số: ", "Liên kết với Bảo tàng Mỹ thuật Việt Nam và các làng nghề truyền thống xây dựng các chuyến tham quan ảo (Virtual Tours) kết hợp học tiếng Anh chuyên ngành tương tác.")

    # =========================================================================
    # TÀI LIỆU THAM KHẢO
    # =========================================================================
    heading_1("TÀI LIỆU THAM KHẢO", page_break=True)

    heading_2("I. Tài liệu tiếng Việt")
    bullet("1. ", "Bộ Giáo dục và Đào tạo (2018), Chương trình Giáo dục phổ thông môn Tiếng Anh, Hà Nội.")
    bullet("2. ", "Đặng Văn Đức (2006), Phân tích và thiết kế hệ thống hướng đối tượng với UML, NXB Khoa học và Kỹ thuật, Hà Nội.")
    bullet("3. ", "Đỗ Trung Tuấn (2008), Cơ sở dữ liệu quan hệ và công nghệ mạng máy tính, NXB Đại học Quốc gia Hà Nội.")
    bullet("4. ", "Nguyễn Kim Thư (2020), Giáo trình Tiếng Anh chuyên ngành Mỹ thuật và Thiết kế đồ họa, NXB Mỹ thuật, Hà Nội.")
    bullet("5. ", "Trần Đình Quế, Nguyễn Mạnh Hùng (2015), Giáo trình Cơ sở dữ liệu và Hệ quản trị cơ sở dữ liệu, NXB Bưu điện, Học viện Công nghệ Bưu chính Viễn thông.")

    heading_2("II. Tài liệu tiếng Anh")
    bullet("6. ", "Ebbinghaus, H. (1885), Über das Gedächtnis: Untersuchungen zur experimentellen Psychologie, Duncker & Humblot, Leipzig. (English Translation: Memory: A Contribution to Experimental Psychology, Columbia University, 1913).")
    bullet("7. ", "Leitner, S. (1972), So lernt man lernen: Der Weg zum Erfolg, Herder Verlag, Freiburg.")
    bullet("8. ", "Martin, R. C. (2017), Clean Architecture: A Craftsman's Guide to Software Structure and Design, Prentice Hall, Boston.")
    bullet("9. ", "Mayer, R. (1991), The Artist's Handbook of Materials and Techniques (5th Edition), Viking Adult, New York.")
    bullet("10. ", "Pressman, R. S., & Maxim, B. R. (2014), Software Engineering: A Practitioner's Approach (8th Edition), McGraw-Hill Education, New York.")
    bullet("11. ", "Woźniak, P. A. (1990), Optimization of learning, Master's Thesis, University of Technology in Poznań.")
    bullet("12. ", "Woźniak, P. A., & Gorzelańczyk, E. J. (1994), 'Optimization of repetition spacing in the practice of learning', Acta Neurobiologiae Experimentalis, Vol. 54, pp. 59–62.")

    heading_2("III. Tài liệu trực tuyến và Cổng thông tin khoa học")
    bullet("13. ", "Express.js Technical Committee (2024), Express.js 5.0 Official Documentation and Middleware Architecture, https://expressjs.com/")
    bullet("14. ", "Meta Platforms, Inc. (2024), React 19 Documentation and Component Architecture, https://react.dev/")
    bullet("15. ", "MySQL Technical Documentation (2024), MySQL 8.0 Reference Manual: InnoDB Storage Engine & Transactions, https://dev.mysql.com/doc/refman/8.0/en/")
    bullet("16. ", "Oxford University Press (2024), Oxford Art Online & The Concise Oxford Dictionary of Art Terms, https://www.oxfordartonline.com/")
    bullet("17. ", "Sequelize Organization (2024), Sequelize ORM v6 Guide: Model Definition, Associations and Transactions, https://sequelize.org/")
    bullet("18. ", "Tate Gallery (2024), Tate Art Terms Glossary, https://www.tate.org.uk/art/art-terms")
    bullet("19. ", "Visual Paradigm Team (2024), Visual Paradigm User's Guide: UML Modeling and Database Reverse Engineering, https://www.visual-paradigm.com/guide/")
    bullet("20. ", "W3C Speech API Community Group (2023), Web Speech API Specification, https://wicg.github.io/speech-api/")

    # Save document
    doc.save(output_path)
    print(f"Xuat thanh cong file DOCX: {output_path}")

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs", "report")
    os.makedirs(out_dir, exist_ok=True)
    out_file1 = os.path.join(out_dir, "BAO_CAO_DO_AN_TOT_NGHIEP_ENGLEARN.docx")
    out_file2 = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "BAO_CAO_DO_AN_TOT_NGHIEP_ENGLEARN.docx")

    generate_thesis_docx(out_file1)
    generate_thesis_docx(out_file2)
