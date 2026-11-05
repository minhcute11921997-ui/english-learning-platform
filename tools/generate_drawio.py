# -*- coding: utf-8 -*-
"""
Script tao file EngLearn_ERD.drawio de mo tren draw.io / diagrams.net
Khong can ban quyen, hoan toan mien phi, sua duoc tung bang, xuat duoc anh PNG/PDF/SVG chat luong cao.
"""

import os
import xml.etree.ElementTree as ET

def generate_drawio():
    tables = [
        # (name, x, y, w, h, domain_color, cols)
        # domain_color: header_bg, border_color
        ("users", 80, 150, 260, 260, "#1E3A8A", "#0F172A", [
            ("+ id", "INT", True),
            ("  username", "VARCHAR(50)", False),
            ("  email", "VARCHAR(100)", False),
            ("  password", "VARCHAR(255)", False),
            ("  full_name", "VARCHAR(100)", False),
            ("  role", "ENUM", False),
            ("  initial_level", "VARCHAR(50)", False),
            ("  daily_goal", "INT", False),
            ("  streak", "INT", False),
            ("  is_active", "BOOLEAN", False)
        ]),
        ("level_assessments", 80, 480, 260, 190, "#1E3A8A", "#0F172A", [
            ("+ id", "INT", True),
            ("# user_id", "INT", False),
            ("  score", "INT", False),
            ("  total_questions", "INT", False),
            ("  result_level", "VARCHAR(50)", False),
            ("  answers_detail", "JSON", False),
            ("  taken_at", "DATETIME", False)
        ]),
        ("topics", 420, 150, 240, 170, "#166534", "#14532D", [
            ("+ id", "INT", True),
            ("  name", "VARCHAR(100)", False),
            ("  name_vi", "VARCHAR(100)", False),
            ("  description", "TEXT", False),
            ("  icon", "VARCHAR(50)", False),
            ("  order_index", "INT", False)
        ]),
        ("vocabularies", 420, 390, 250, 240, "#166534", "#14532D", [
            ("+ id", "INT", True),
            ("# topic_id", "INT", False),
            ("# created_by", "INT", False),
            ("  word", "VARCHAR(100)", False),
            ("  phonetic", "VARCHAR(100)", False),
            ("  part_of_speech", "VARCHAR(50)", False),
            ("  meaning_vi", "TEXT", False),
            ("  difficulty", "ENUM", False)
        ]),
        ("vocab_examples", 420, 700, 250, 140, "#166534", "#14532D", [
            ("+ id", "INT", True),
            ("# vocabulary_id", "INT", False),
            ("  sentence_en", "TEXT", False),
            ("  sentence_vi", "TEXT", False)
        ]),
        ("user_vocab_lists", 740, 150, 240, 170, "#166534", "#14532D", [
            ("+ id", "INT", True),
            ("# user_id", "INT", False),
            ("  name", "VARCHAR(150)", False),
            ("  description", "TEXT", False),
            ("  color", "VARCHAR(30)", False)
        ]),
        ("user_vocab_list_items", 740, 390, 240, 140, "#166534", "#14532D", [
            ("+ id", "INT", True),
            ("# list_id", "INT", False),
            ("# vocabulary_id", "INT", False)
        ]),
        ("user_vocab_progress", 80, 740, 260, 240, "#C2410C", "#9A3412", [
            ("+ id", "INT", True),
            ("# user_id", "INT", False),
            ("# vocabulary_id", "INT", False),
            ("  status", "ENUM", False),
            ("  correct_count", "INT", False),
            ("  incorrect_count", "INT", False),
            ("  ease_factor", "FLOAT", False),
            ("  interval_days", "INT", False),
            ("  next_review_at", "DATETIME", False)
        ]),
        ("review_schedules", 80, 1050, 260, 180, "#C2410C", "#9A3412", [
            ("+ id", "INT", True),
            ("# user_id", "INT", False),
            ("# vocabulary_id", "INT", False),
            ("# group_vocab_set_id", "INT", False),
            ("  scheduled_date", "DATE", False),
            ("  is_completed", "BOOLEAN", False)
        ]),
        ("readings", 1060, 150, 260, 220, "#6B21A8", "#581C87", [
            ("+ id", "INT", True),
            ("# topic_id", "INT", False),
            ("# created_by", "INT", False),
            ("  title", "VARCHAR(255)", False),
            ("  content_en", "TEXT", False),
            ("  content_vi", "TEXT", False),
            ("  difficulty", "ENUM", False),
            ("  reading_time", "INT", False)
        ]),
        ("questions", 1060, 440, 260, 190, "#6B21A8", "#581C87", [
            ("+ id", "INT", True),
            ("# reading_id", "INT", False),
            ("  question_text", "TEXT", False),
            ("  options", "JSON", False),
            ("  correct_option", "INT", False),
            ("  explanation_vi", "TEXT", False)
        ]),
        ("user_reading_attempts", 1400, 150, 260, 200, "#6B21A8", "#581C87", [
            ("+ id", "INT", True),
            ("# user_id", "INT", False),
            ("# reading_id", "INT", False),
            ("  score", "INT", False),
            ("  total_questions", "INT", False),
            ("  time_spent", "INT", False),
            ("  completed_at", "DATETIME", False)
        ]),
        ("user_answers", 1400, 440, 260, 170, "#6B21A8", "#581C87", [
            ("+ id", "INT", True),
            ("# attempt_id", "INT", False),
            ("# question_id", "INT", False),
            ("  selected_option", "INT", False),
            ("  is_correct", "BOOLEAN", False)
        ]),
        ("groups", 420, 930, 250, 200, "#0F766E", "#115E59", [
            ("+ id", "INT", True),
            ("# owner_id", "INT", False),
            ("  name", "VARCHAR(150)", False),
            ("  description", "TEXT", False),
            ("  invite_code", "VARCHAR(20)", False),
            ("  is_active", "BOOLEAN", False)
        ]),
        ("group_members", 740, 930, 240, 170, "#0F766E", "#115E59", [
            ("+ id", "INT", True),
            ("# group_id", "INT", False),
            ("# user_id", "INT", False),
            ("  role", "ENUM", False),
            ("  joined_at", "DATETIME", False)
        ]),
        ("group_vocab_sets", 420, 1200, 250, 180, "#0F766E", "#115E59", [
            ("+ id", "INT", True),
            ("# group_id", "INT", False),
            ("# created_by", "INT", False),
            ("  title", "VARCHAR(150)", False),
            ("  description", "TEXT", False)
        ]),
        ("group_vocab_items", 740, 1200, 240, 170, "#0F766E", "#115E59", [
            ("+ id", "INT", True),
            ("# vocab_set_id", "INT", False),
            ("# vocabulary_id", "INT", False),
            ("  display_order", "INT", False)
        ]),
        ("group_reading_sets", 1060, 740, 260, 170, "#0F766E", "#115E59", [
            ("+ id", "INT", True),
            ("# group_id", "INT", False),
            ("# reading_id", "INT", False),
            ("# created_by", "INT", False)
        ]),
        ("community_posts", 1400, 740, 260, 220, "#0F766E", "#115E59", [
            ("+ id", "INT", True),
            ("# user_id", "INT", False),
            ("  content_type", "ENUM", False),
            ("  title", "VARCHAR(255)", False),
            ("  status", "ENUM", False),
            ("  upvote_count", "INT", False)
        ])
    ]

    # Create XML Structure
    mxfile = ET.Element("mxfile", host="app.diagrams.net", modified="2026-10-03T10:00:00.000Z", agent="EngLearn", version="24.0.0")
    diagram = ET.SubElement(mxfile, "diagram", id="englearn-erd", name="EngLearn ERD")
    mxGraphModel = ET.SubElement(diagram, "mxGraphModel", dx="1600", dy="1100", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="1900", pageHeight="1500", background="#F8FAFC", math="0", shadow="0")
    root = ET.SubElement(mxGraphModel, "root")

    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    cell_id = 2

    # Draw Title block
    title_cell = ET.SubElement(root, "mxCell", id=str(cell_id), value="&lt;b&gt;&lt;font style=&quot;font-size: 18px;&quot;&gt;ENGLEARN — SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD)&lt;/font&gt;&lt;/b&gt;&lt;br&gt;Chuẩn Crow's Foot | Hệ thống Học tiếng Anh cơ bản", style="text;html=1;strokeColor=#CBD5E1;fillColor=#FFFFFF;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=1;shadow=1;spacingLeft=16;", vertex="1", parent="1")
    geo = ET.SubElement(title_cell, "mxGeometry", x="80", y="40", width="600", height="60", **{"as": "geometry"})
    cell_id += 1

    # Map table_id to cell_id for connecting
    table_cell_map = {}

    for t_name, x, y, w, h, bg_color, border_color, cols in tables:
        tbl_id = str(cell_id)
        table_cell_map[t_name] = tbl_id
        cell_id += 1

        # Table Swimlane Container
        tbl_label = f"&lt;b&gt;{t_name}&lt;/b&gt;"
        tbl_style = f"swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=32;horizontalFlip=0;fillColor={bg_color};fontColor=#FFFFFF;strokeColor={border_color};shadow=1;rounded=1;arcSize=8;collapsible=0;swimlaneFillColor=#FFFFFF;"
        t_cell = ET.SubElement(root, "mxCell", id=tbl_id, value=tbl_label, style=tbl_style, vertex="1", parent="1")
        geo = ET.SubElement(t_cell, "mxGeometry", x=str(x), y=str(y), width=str(w), height=str(h), **{"as": "geometry"})

        # Rows inside Table
        for col_name, col_type, is_pk in cols:
            row_id = str(cell_id)
            cell_id += 1
            pk_prefix = "&lt;b&gt;&lt;font color=&quot;#B45309&quot;&gt;PK &lt;/font&gt;&lt;/b&gt;" if is_pk else ("&lt;b&gt;&lt;font color=&quot;#2563EB&quot;&gt;FK &lt;/font&gt;&lt;/b&gt;" if col_name.startswith("#") else "&amp;nbsp;&amp;nbsp;&amp;nbsp;&amp;nbsp;")
            clean_name = col_name.replace("+ ", "").replace("# ", "").strip()
            row_val = f"{pk_prefix}{clean_name} : &lt;font color=&quot;#64748B&quot;&gt;{col_type}&lt;/font&gt;"
            row_style = "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=10;spacingRight=10;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;fontColor=#0F172A;fontSize=11.5;html=1;"
            r_cell = ET.SubElement(root, "mxCell", id=row_id, value=row_val, style=row_style, vertex="1", parent=tbl_id)
            r_geo = ET.SubElement(r_cell, "mxGeometry", y="32", width=str(w), height="22", **{"as": "geometry"})

    # Relationships (Crow's foot lines)
    relationships = [
        ("users", "level_assessments", "1..*"),
        ("topics", "vocabularies", "1..*"),
        ("vocabularies", "vocab_examples", "1..*"),
        ("topics", "readings", "1..*"),
        ("readings", "questions", "1..*"),
        ("readings", "user_reading_attempts", "1..*"),
        ("user_reading_attempts", "user_answers", "1..*"),
        ("questions", "user_answers", "1..*"),
        ("users", "user_vocab_lists", "1..*"),
        ("user_vocab_lists", "user_vocab_list_items", "1..*"),
        ("vocabularies", "user_vocab_list_items", "1..*"),
        ("users", "user_vocab_progress", "1..*"),
        ("vocabularies", "user_vocab_progress", "1..*"),
        ("users", "review_schedules", "1..*"),
        ("groups", "group_members", "1..*"),
        ("groups", "group_vocab_sets", "1..*"),
        ("group_vocab_sets", "group_vocab_items", "1..*"),
        ("groups", "group_reading_sets", "1..*"),
        ("users", "groups", "1..*")
    ]

    for src, dst, label in relationships:
        if src in table_cell_map and dst in table_cell_map:
            edge_id = str(cell_id)
            cell_id += 1
            edge_style = "edgeStyle=orthogonalEdgeStyle;fontSize=11;html=1;endArrow=ERmany;startArrow=ERone;strokeColor=#475569;strokeWidth=1.5;rounded=0;"
            e_cell = ET.SubElement(root, "mxCell", id=edge_id, value=label, style=edge_style, edge="1", parent="1", source=table_cell_map[src], target=table_cell_map[dst])
            e_geo = ET.SubElement(e_cell, "mxGeometry", relative="1", **{"as": "geometry"})

    out_path = os.path.join("E:\\doan", "docs", "EngLearn_ERD.drawio")
    tree = ET.ElementTree(mxfile)
    tree.write(out_path, encoding="utf-8", xml_declaration=True)
    print(f"Created draw.io file successfully: {out_path}")

if __name__ == "__main__":
    generate_drawio()
