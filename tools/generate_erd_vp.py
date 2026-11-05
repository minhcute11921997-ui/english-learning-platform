# -*- coding: utf-8 -*-
"""
Script tao so do ERD chuan phong cach Visual Paradigm cho EngLearn Database
Bao gom:
1. File SVG doc lap (docs/erd_visual_paradigm.svg) - Vector vo han, cuc net.
2. File HTML tuong tac (docs/erd_visual_paradigm.html) - Co zoom, pan, highlight tung phan he, nut xuat PNG/SVG/Print.
3. Xuat ra file anh PNG chat luong cao (docs/erd_visual_paradigm.png) bang Microsoft Edge headless.
"""

import os
import subprocess
import json

def get_erd_svg():
    # Kich thuoc canvas
    CANVAS_W = 2700
    CANVAS_H = 1950

    # Dinh nghia cac Entity theo phong cach Visual Paradigm
    # Theme colors cho cac mien (Packages):
    # - User: Header #1E3A8A (Navy), Border #1E3A8A, Shading #F8FAFC
    # - Core Vocab: Header #166534 (Emerald/Green), Border #166534, Shading #F0FDF4
    # - SRS Progress: Header #C2410C (Amber/Orange), Border #C2410C, Shading #FFF7ED
    # - Reading: Header #6B21A8 (Purple/Indigo), Border #6B21A8, Shading #FAF5FF
    # - Groups & UGC: Header #0F766E (Teal/Cyan), Border #0F766E, Shading #F0FDFA

    entities = [
        # ZONE 1: USER & AUTH (Top Left)
        {
            "id": "users", "name": "users", "domain": "user",
            "x": 80, "y": 180, "w": 380, "h": 290,
            "header_bg": "#1E3A8A", "border": "#1E3A8A",
            "cols": [
                ("PK", "id", "INT", True),
                ("", "username", "VARCHAR(50)", True),
                ("", "email", "VARCHAR(100)", True),
                ("", "password", "VARCHAR(255)", True),
                ("", "full_name", "VARCHAR(100)", False),
                ("", "role", "ENUM('admin','learner')", True),
                ("", "initial_level", "VARCHAR(20)", False),
                ("", "daily_goal", "INT DEFAULT 10", True),
                ("", "streak", "INT DEFAULT 0", True),
                ("", "is_active", "BOOLEAN DEFAULT true", True),
                ("", "created_at", "DATETIME", True)
            ]
        },
        {
            "id": "level_assessments", "name": "level_assessments", "domain": "user",
            "x": 80, "y": 550, "w": 380, "h": 220,
            "header_bg": "#1E3A8A", "border": "#1E3A8A",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "user_id", "INT", True),
                ("", "score", "INT", True),
                ("", "total_questions", "INT DEFAULT 30", True),
                ("", "result_level", "VARCHAR(50)", True),
                ("", "answers_detail", "JSON", False),
                ("", "taken_at", "DATETIME", True)
            ]
        },

        # ZONE 2: VOCABULARY & CONTENT CORE (Center-Left)
        {
            "id": "topics", "name": "topics", "domain": "vocab",
            "x": 560, "y": 180, "w": 350, "h": 200,
            "header_bg": "#166534", "border": "#166534",
            "cols": [
                ("PK", "id", "INT", True),
                ("", "name", "VARCHAR(100)", True),
                ("", "name_vi", "VARCHAR(100)", True),
                ("", "description", "TEXT", False),
                ("", "icon", "VARCHAR(50)", False),
                ("", "order_index", "INT DEFAULT 0", False)
            ]
        },
        {
            "id": "vocabularies", "name": "vocabularies", "domain": "vocab",
            "x": 560, "y": 450, "w": 370, "h": 290,
            "header_bg": "#166534", "border": "#166534",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "topic_id", "INT", True),
                ("FK", "created_by", "INT", False),
                ("", "word", "VARCHAR(100)", True),
                ("", "phonetic", "VARCHAR(100)", False),
                ("", "part_of_speech", "VARCHAR(50)", False),
                ("", "meaning_vi", "TEXT", True),
                ("", "difficulty", "ENUM('easy','medium','hard')", True),
                ("", "created_at", "DATETIME", True)
            ]
        },
        {
            "id": "vocab_examples", "name": "vocab_examples", "domain": "vocab",
            "x": 560, "y": 800, "w": 370, "h": 170,
            "header_bg": "#166534", "border": "#166534",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "vocabulary_id", "INT", True),
                ("", "sentence_en", "TEXT", True),
                ("", "sentence_vi", "TEXT", True)
            ]
        },
        {
            "id": "user_vocab_lists", "name": "user_vocab_lists", "domain": "vocab",
            "x": 1000, "y": 180, "w": 340, "h": 200,
            "header_bg": "#166534", "border": "#166534",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "user_id", "INT", True),
                ("", "name", "VARCHAR(150)", True),
                ("", "description", "TEXT", False),
                ("", "color", "VARCHAR(30)", False),
                ("", "created_at", "DATETIME", True)
            ]
        },
        {
            "id": "user_vocab_list_items", "name": "user_vocab_list_items", "domain": "vocab",
            "x": 1000, "y": 450, "w": 340, "h": 170,
            "header_bg": "#166534", "border": "#166534",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "list_id", "INT", True),
                ("FK", "vocabulary_id", "INT", True),
                ("", "created_at", "DATETIME", True)
            ]
        },

        # ZONE 3: SPACED REPETITION (SRS) ENGINE (Bottom-Left)
        {
            "id": "user_vocab_progress", "name": "user_vocab_progress", "domain": "srs",
            "x": 80, "y": 850, "w": 400, "h": 310,
            "header_bg": "#C2410C", "border": "#C2410C",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "user_id", "INT", True),
                ("FK", "vocabulary_id", "INT", True),
                ("", "status", "ENUM('new','learning','mastered')", True),
                ("", "correct_count", "INT DEFAULT 0", True),
                ("", "incorrect_count", "INT DEFAULT 0", True),
                ("", "ease_factor", "FLOAT DEFAULT 2.5", True),
                ("", "interval_days", "INT DEFAULT 0", True),
                ("", "repetition_count", "INT DEFAULT 0", True),
                ("", "next_review_at", "DATETIME", False),
                ("", "last_reviewed_at", "DATETIME", False)
            ]
        },
        {
            "id": "review_schedules", "name": "review_schedules", "domain": "srs",
            "x": 80, "y": 1230, "w": 400, "h": 230,
            "header_bg": "#C2410C", "border": "#C2410C",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "user_id", "INT", True),
                ("FK", "vocabulary_id", "INT", True),
                ("FK", "group_vocab_set_id", "INT", False),
                ("", "scheduled_date", "DATE", True),
                ("", "is_completed", "BOOLEAN DEFAULT false", True),
                ("", "created_at", "DATETIME", True)
            ]
        },

        # ZONE 4: READING COMPREHENSION (Center-Right)
        {
            "id": "readings", "name": "readings", "domain": "reading",
            "x": 1450, "y": 180, "w": 390, "h": 280,
            "header_bg": "#6B21A8", "border": "#6B21A8",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "topic_id", "INT", True),
                ("FK", "created_by", "INT", False),
                ("", "title", "VARCHAR(255)", True),
                ("", "content_en", "TEXT", True),
                ("", "content_vi", "TEXT", True),
                ("", "difficulty", "ENUM('easy','medium','hard')", True),
                ("", "reading_time", "INT DEFAULT 5", True),
                ("", "is_approved", "BOOLEAN DEFAULT true", True)
            ]
        },
        {
            "id": "questions", "name": "questions", "domain": "reading",
            "x": 1450, "y": 530, "w": 390, "h": 220,
            "header_bg": "#6B21A8", "border": "#6B21A8",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "reading_id", "INT", True),
                ("", "question_text", "TEXT", True),
                ("", "options", "JSON (A, B, C, D)", True),
                ("", "correct_option", "INT (0-3)", True),
                ("", "explanation_vi", "TEXT", False)
            ]
        },
        {
            "id": "user_reading_attempts", "name": "user_reading_attempts", "domain": "reading",
            "x": 1920, "y": 180, "w": 380, "h": 250,
            "header_bg": "#6B21A8", "border": "#6B21A8",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "user_id", "INT", True),
                ("FK", "reading_id", "INT", True),
                ("", "score", "INT", True),
                ("", "total_questions", "INT", True),
                ("", "time_spent", "INT (seconds)", False),
                ("", "completed_at", "DATETIME", True)
            ]
        },
        {
            "id": "user_answers", "name": "user_answers", "domain": "reading",
            "x": 1920, "y": 530, "w": 380, "h": 210,
            "header_bg": "#6B21A8", "border": "#6B21A8",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "attempt_id", "INT", True),
                ("FK", "question_id", "INT", True),
                ("", "selected_option", "INT", True),
                ("", "is_correct", "BOOLEAN", True)
            ]
        },

        # ZONE 5: COLLABORATIVE GROUPS & COMMUNITY (Right & Bottom-Right)
        {
            "id": "groups", "name": "groups", "domain": "group",
            "x": 560, "y": 1230, "w": 370, "h": 240,
            "header_bg": "#0F766E", "border": "#0F766E",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "owner_id", "INT", True),
                ("", "name", "VARCHAR(150)", True),
                ("", "description", "TEXT", False),
                ("", "invite_code", "VARCHAR(20) [UNIQUE]", True),
                ("", "is_active", "BOOLEAN DEFAULT true", True),
                ("", "created_at", "DATETIME", True)
            ]
        },
        {
            "id": "group_members", "name": "group_members", "domain": "group",
            "x": 1000, "y": 1230, "w": 340, "h": 210,
            "header_bg": "#0F766E", "border": "#0F766E",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "group_id", "INT", True),
                ("FK", "user_id", "INT", True),
                ("", "role", "ENUM('owner','member')", True),
                ("", "joined_at", "DATETIME", True)
            ]
        },
        {
            "id": "group_vocab_sets", "name": "group_vocab_sets", "domain": "group",
            "x": 560, "y": 1540, "w": 370, "h": 220,
            "header_bg": "#0F766E", "border": "#0F766E",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "group_id", "INT", True),
                ("FK", "created_by", "INT", True),
                ("", "title", "VARCHAR(150)", True),
                ("", "description", "TEXT", False),
                ("", "is_published", "BOOLEAN DEFAULT false", True),
                ("", "created_at", "DATETIME", True)
            ]
        },
        {
            "id": "group_vocab_items", "name": "group_vocab_items", "domain": "group",
            "x": 1000, "y": 1540, "w": 340, "h": 210,
            "header_bg": "#0F766E", "border": "#0F766E",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "vocab_set_id", "INT", True),
                ("FK", "vocabulary_id", "INT", True),
                ("", "display_order", "INT DEFAULT 0", False),
                ("", "created_at", "DATETIME", True)
            ]
        },
        {
            "id": "group_reading_sets", "name": "group_reading_sets", "domain": "group",
            "x": 1450, "y": 1230, "w": 360, "h": 210,
            "header_bg": "#0F766E", "border": "#0F766E",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "group_id", "INT", True),
                ("FK", "reading_id", "INT", True),
                ("FK", "created_by", "INT", True),
                ("", "is_published", "BOOLEAN DEFAULT true", True),
                ("", "created_at", "DATETIME", True)
            ]
        },
        {
            "id": "community_posts", "name": "community_posts", "domain": "group",
            "x": 1880, "y": 1230, "w": 390, "h": 280,
            "header_bg": "#0F766E", "border": "#0F766E",
            "cols": [
                ("PK", "id", "INT", True),
                ("FK", "user_id", "INT", True),
                ("", "content_type", "ENUM('vocab_set','reading')", True),
                ("", "title", "VARCHAR(255)", True),
                ("", "description", "TEXT", False),
                ("", "content_ids", "JSON", False),
                ("", "status", "ENUM('pending','approved','rejected')", True),
                ("", "upvote_count", "INT DEFAULT 0", True),
                ("", "reviewed_at", "DATETIME", False)
            ]
        }
    ]

    # Danh sach cac duong quan he Orthogonal (Crow's foot)
    # [start_table, end_table, points_path, label, card_start, card_end]
    relationships = [
        # Users -> LevelAssessment (1 -> N)
        {"from": "users", "to": "level_assessments", "points": [(270, 470), (270, 550)], "label": "tests (1..N)"},
        
        # Topics -> Vocabularies (1 -> N)
        {"from": "topics", "to": "vocabularies", "points": [(735, 380), (735, 450)], "label": "categorizes (1..N)"},

        # Vocabularies -> VocabExamples (1 -> N)
        {"from": "vocabularies", "to": "vocab_examples", "points": [(735, 740), (735, 800)], "label": "has (1..N)"},

        # Topics -> Readings (1 -> N)
        {"from": "topics", "to": "readings", "points": [(910, 270), (1450, 270)], "label": "classifies (1..N)"},

        # Readings -> Questions (1 -> N)
        {"from": "readings", "to": "questions", "points": [(1645, 460), (1645, 530)], "label": "contains (1..N)"},

        # Readings -> UserReadingAttempts (1 -> N)
        {"from": "readings", "to": "user_reading_attempts", "points": [(1840, 280), (1920, 280)], "label": "tested in (1..N)"},

        # UserReadingAttempts -> UserAnswers (1 -> N)
        {"from": "user_reading_attempts", "to": "user_answers", "points": [(2100, 430), (2100, 530)], "label": "submits (1..N)"},

        # Questions -> UserAnswers (1 -> N)
        {"from": "questions", "to": "user_answers", "points": [(1840, 630), (1920, 630)], "label": "answered (1..N)"},

        # Users -> UserVocabLists (1 -> N)
        {"from": "users", "to": "user_vocab_lists", "points": [(460, 240), (510, 240), (510, 140), (1170, 140), (1170, 180)], "label": "owns (1..N)"},

        # UserVocabLists -> UserVocabListItems (1 -> N)
        {"from": "user_vocab_lists", "to": "user_vocab_list_items", "points": [(1170, 380), (1170, 450)], "label": "contains (1..N)"},

        # Vocabularies -> UserVocabListItems (1 -> N)
        {"from": "vocabularies", "to": "user_vocab_list_items", "points": [(930, 520), (1000, 520)], "label": "linked (1..N)"},

        # Users -> UserVocabProgress (1 -> N)
        {"from": "users", "to": "user_vocab_progress", "points": [(200, 470), (200, 850)], "label": "progress (1..N)"},

        # Vocabularies -> UserVocabProgress (1 -> N)
        {"from": "vocabularies", "to": "user_vocab_progress", "points": [(560, 600), (510, 600), (510, 950), (480, 950)], "label": "learned in (1..N)"},

        # Users -> ReviewSchedule (1 -> N)
        {"from": "users", "to": "review_schedules", "points": [(150, 470), (150, 800), (60, 800), (60, 1300), (80, 1300)], "label": "scheduled (1..N)"},

        # Groups -> GroupMembers (1 -> N)
        {"from": "groups", "to": "group_members", "points": [(930, 1310), (1000, 1310)], "label": "has (1..N)"},

        # Groups -> GroupVocabSets (1 -> N)
        {"from": "groups", "to": "group_vocab_sets", "points": [(735, 1470), (735, 1540)], "label": "curates (1..N)"},

        # GroupVocabSets -> GroupVocabItems (1 -> N)
        {"from": "group_vocab_sets", "to": "group_vocab_items", "points": [(930, 1620), (1000, 1620)], "label": "has items (1..N)"},

        # Groups -> GroupReadingSets (1 -> N)
        {"from": "groups", "to": "group_reading_sets", "points": [(930, 1380), (1400, 1380), (1400, 1310), (1450, 1310)], "label": "assigns (1..N)"},

        # Users -> Groups (Owner, 1 -> N)
        {"from": "users", "to": "groups", "points": [(440, 470), (440, 1260), (560, 1260)], "label": "owns (1..N)"},

        # Users -> CommunityPosts (1 -> N)
        {"from": "users", "to": "community_posts", "points": [(460, 200), (520, 200), (520, 100), (2350, 100), (2350, 1250), (2270, 1250)], "label": "publishes (1..N)"}
    ]

    # Package Zones (Subtle background boxes like Visual Paradigm)
    packages = [
        {"title": "PACKAGE 1: IDENTITY & ASSESSMENT", "x": 50, "y": 120, "w": 440, "h": 680, "color": "#1E3A8A", "bg": "#F8FAFC"},
        {"title": "PACKAGE 2: VOCABULARY KNOWLEDGE CORE", "x": 530, "y": 120, "w": 850, "h": 880, "color": "#166534", "bg": "#F0FDF4"},
        {"title": "PACKAGE 3: SPACED REPETITION SYSTEM (SM-2)", "x": 50, "y": 820, "w": 450, "h": 680, "color": "#C2410C", "bg": "#FFF7ED"},
        {"title": "PACKAGE 4: READING COMPREHENSION & QUIZ", "x": 1410, "y": 120, "w": 920, "h": 680, "color": "#6B21A8", "bg": "#FAF5FF"},
        {"title": "PACKAGE 5: COLLABORATION & COMMUNITY", "x": 530, "y": 1160, "w": 1800, "h": 640, "color": "#0F766E", "bg": "#F0FDFA"}
    ]

    # Bat dau tao chuoi SVG
    svg_parts = []
    svg_parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS_W} {CANVAS_H}" width="{CANVAS_W}" height="{CANVAS_H}" style="background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">')

    # Definitions: Marker, Shadows, Patterns
    svg_parts.append('''
  <defs>
    <!-- Background Grid Pattern like Visual Paradigm Canvas -->
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" stroke-width="0.8"/>
    </pattern>

    <!-- Visual Paradigm Table Drop Shadow -->
    <filter id="vp-shadow" x="-5%" y="-5%" width="112%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="3" dy="4" stdDeviation="4" flood-color="#0F172A" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Canvas Grid Background -->
  <rect width="100%" height="100%" fill="#F8FAFA"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
''')

    # Draw Title Block (Top Left Header)
    svg_parts.append('''
  <g transform="translate(60, 30)">
    <rect x="0" y="0" width="820" height="75" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" filter="url(#vp-shadow)"/>
    <rect x="0" y="0" width="10" height="75" rx="4" fill="#1E3A8A"/>
    <text x="24" y="30" font-size="19" font-weight="700" fill="#0F172A">EngLearn System — Entity Relationship Diagram (ERD)</text>
    <text x="24" y="55" font-size="12.5" font-weight="500" fill="#64748B">Information Engineering (Crow\'s Foot) | Dialect: MySQL 8.0 / InnoDB | Visual Paradigm Specification</text>
  </g>
''')

    # Draw Legend Box (Top Right)
    svg_parts.append('''
  <g transform="translate(1860, 30)">
    <rect x="0" y="0" width="470" height="75" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" filter="url(#vp-shadow)"/>
    <text x="18" y="24" font-size="13" font-weight="700" fill="#0F172A">CHÚ DẪN (LEGEND)</text>
    <g transform="translate(18, 38)">
      <rect x="0" y="0" width="28" height="18" rx="3" fill="#B45309"/>
      <text x="5" y="13" font-size="10.5" font-weight="700" fill="#FFFFFF">PK</text>
      <text x="36" y="13" font-size="11.5" fill="#334155">Primary Key</text>

      <rect x="130" y="0" width="28" height="18" rx="3" fill="#2563EB"/>
      <text x="135" y="13" font-size="10.5" font-weight="700" fill="#FFFFFF">FK</text>
      <text x="166" y="13" font-size="11.5" fill="#334155">Foreign Key</text>

      <line x1="260" y1="9" x2="300" y2="9" stroke="#334155" stroke-width="2"/>
      <circle cx="300" cy="9" r="3" fill="#FFFFFF" stroke="#334155" stroke-width="2"/>
      <path d="M 315 2 L 305 9 L 315 16" fill="none" stroke="#334155" stroke-width="2"/>
      <text x="325" y="13" font-size="11.5" fill="#334155">Quan hệ 1 - N</text>
    </g>
  </g>
''')

    # Draw Package Zones
    for pkg in packages:
        svg_parts.append(f'''
  <!-- {pkg["title"]} -->
  <g id="pkg-{pkg['title'].split(':')[0].lower().replace(' ', '-')}">
    <rect x="{pkg['x']}" y="{pkg['y']}" width="{pkg['w']}" height="{pkg['h']}" rx="12" fill="{pkg['bg']}" stroke="{pkg['color']}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.65"/>
    <rect x="{pkg['x']}" y="{pkg['y']}" width="{len(pkg['title'])*8 + 30}" height="28" rx="6" fill="{pkg['color']}"/>
    <text x="{pkg['x']+14}" y="{pkg['y']+18}" font-size="11.5" font-weight="700" fill="#FFFFFF" letter-spacing="0.5">{pkg['title']}</text>
  </g>
''')

    # Helper function to draw Crow's Foot Connector
    def draw_crows_foot(points, label):
        path_str = f"M {points[0][0]} {points[0][1]}"
        for pt in points[1:]:
            path_str += f" L {pt[0]} {pt[1]}"
        
        # Calculate crow's foot at end point
        p_last = points[-1]
        p_prev = points[-2]
        dx = p_last[0] - p_prev[0]
        dy = p_last[1] - p_prev[1]

        crows_svg = ""
        # Direction
        if abs(dx) > abs(dy):
            # Horizontal line
            sign = 1 if dx > 0 else -1
            end_x = p_last[0]
            end_y = p_last[1]
            # Crow lines: 3 prongs
            crows_svg = f'''
              <path d="M {end_x - sign*14} {end_y - 8} L {end_x} {end_y} L {end_x - sign*14} {end_y + 8}" fill="none" stroke="#475569" stroke-width="2"/>
              <line x1="{end_x - sign*18}" y1="{end_y - 8}" x2="{end_x - sign*18}" y2="{end_y + 8}" stroke="#475569" stroke-width="2"/>
            '''
        else:
            # Vertical line
            sign = 1 if dy > 0 else -1
            end_x = p_last[0]
            end_y = p_last[1]
            crows_svg = f'''
              <path d="M {end_x - 8} {end_y - sign*14} L {end_x} {end_y} L {end_x + 8} {end_y - sign*14}" fill="none" stroke="#475569" stroke-width="2"/>
              <line x1="{end_x - 8}" y1="{end_y - sign*18}" x2="{end_x + 8}" y2="{end_y - sign*18}" stroke="#475569" stroke-width="2"/>
            '''

        # One bar at start point
        p_first = points[0]
        p_next = points[1]
        sdx = p_next[0] - p_first[0]
        sdy = p_next[1] - p_first[1]
        start_bar = ""
        if abs(sdx) > abs(sdy):
            ssign = 1 if sdx > 0 else -1
            start_bar = f'<line x1="{p_first[0] + ssign*8}" y1="{p_first[1]-7}" x2="{p_first[0] + ssign*8}" y2="{p_first[1]+7}" stroke="#475569" stroke-width="2"/>'
        else:
            ssign = 1 if sdy > 0 else -1
            start_bar = f'<line x1="{p_first[0]-7}" y1="{p_first[1] + ssign*8}" x2="{p_first[0]+7}" y2="{p_first[1] + ssign*8}" stroke="#475569" stroke-width="2"/>'

        # Label position around midpoint
        mid_idx = len(points) // 2
        mid_pt = points[mid_idx]
        lbl_x = mid_pt[0] + 8
        lbl_y = mid_pt[1] - 6

        return f'''
    <g class="relationship-line">
      <path d="{path_str}" fill="none" stroke="#64748B" stroke-width="1.8" stroke-dasharray="none"/>
      {start_bar}
      {crows_svg}
      <rect x="{lbl_x-4}" y="{lbl_y-11}" width="{len(label)*6.2 + 8}" height="15" rx="3" fill="#FFFFFF" fill-opacity="0.9" stroke="#E2E8F0" stroke-width="1"/>
      <text x="{lbl_x}" y="{lbl_y}" font-size="9.5" font-weight="600" fill="#475569">{label}</text>
    </g>
'''

    # Draw all relationship lines
    svg_parts.append('  <!-- RELATIONSHIP LINES -->\n')
    for rel in relationships:
        svg_parts.append(draw_crows_foot(rel["points"], rel["label"]))

    # Draw Entities (Tables)
    svg_parts.append('\n  <!-- ENTITIES / TABLES -->\n')
    for ent in entities:
        x, y, w, h = ent["x"], ent["y"], ent["w"], ent["h"]
        header_bg = ent["header_bg"]
        border = ent["border"]
        tbl_name = ent["name"]

        table_svg = f'''
  <!-- TABLE: {tbl_name} -->
  <g id="tbl-{tbl_name}" class="entity-box domain-{ent['domain']}" filter="url(#vp-shadow)">
    <!-- Card Base -->
    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="#FFFFFF" stroke="{border}" stroke-width="1.8"/>

    <!-- Table Header (Visual Paradigm Style) -->
    <path d="M {x} {y+6} Q {x} {y} {x+6} {y} L {x+w-6} {y} Q {x+w} {y} {x+w} {y+6} L {x+w} {y+38} L {x} {y+38} Z" fill="{header_bg}"/>
    <text x="{x+w/2}" y="{y+16}" font-size="9" font-weight="700" fill="#E2E8F0" text-anchor="middle" letter-spacing="1">«entity»</text>
    <text x="{x+w/2}" y="{y+31}" font-size="13.5" font-weight="700" fill="#FFFFFF" text-anchor="middle" font-family="'JetBrains Mono', monospace">{tbl_name}</text>

    <!-- Header Divider Line -->
    <line x1="{x}" y1="{y+38}" x2="{x+w}" y2="{y+38}" stroke="{border}" stroke-width="1.5"/>

    <!-- Columns List -->
    <g transform="translate({x}, {y+40})">
'''
        row_y = 16
        for col_idx, (key_type, col_name, data_type, is_not_null) in enumerate(ent["cols"]):
            row_bg = "#F8FAFC" if col_idx % 2 == 1 else "#FFFFFF"
            table_svg += f'<rect x="1" y="{row_y-13}" width="{w-2}" height="20" fill="{row_bg}"/>\n'

            # Key Badges
            if key_type == "PK":
                table_svg += f'''
      <rect x="8" y="{row_y-11}" width="22" height="15" rx="3" fill="#B45309"/>
      <text x="19" y="{row_y}" font-size="8.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">PK</text>
'''
            elif key_type == "FK":
                table_svg += f'''
      <rect x="8" y="{row_y-11}" width="22" height="15" rx="3" fill="#2563EB"/>
      <text x="19" y="{row_y}" font-size="8.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">FK</text>
'''
            else:
                table_svg += f'<text x="19" y="{row_y}" font-size="9" fill="#94A3B8" text-anchor="middle">•</text>\n'

            # Column Name
            font_weight = "700" if key_type == "PK" else "600"
            col_color = "#0F172A" if is_not_null else "#475569"
            table_svg += f'<text x="36" y="{row_y}" font-size="11.5" font-weight="{font_weight}" fill="{col_color}" font-family="monospace">{col_name}</text>\n'

            # Data Type (Aligned right)
            table_svg += f'<text x="{w-10}" y="{row_y}" font-size="10.5" font-weight="500" fill="#64748B" text-anchor="end" font-family="monospace">{data_type}</text>\n'

            row_y += 20

        table_svg += '''
    </g>
  </g>
'''
        svg_parts.append(table_svg)

    svg_parts.append('</svg>')
    return "\n".join(svg_parts)


def build_erd_html(svg_content):
    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sơ Đồ Thực Thể Quan Hệ (ERD) — Visual Paradigm Spec</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --primary: #1E3A8A;
      --bg: #F1F5F9;
      --card-bg: #FFFFFF;
      --text: #0F172A;
      --border: #CBD5E1;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }}
    header {{
      background: #FFFFFF;
      border-bottom: 1.5px solid var(--border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .brand-logo {{
      width: 36px;
      height: 36px;
      background: var(--primary);
      color: #fff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
    }}
    .brand-text h1 {{
      font-size: 16px;
      font-weight: 700;
      color: #1E3A8A;
    }}
    .brand-text p {{
      font-size: 12px;
      color: #64748B;
    }}
    .toolbar {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}
    .btn {{
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: #FFFFFF;
      color: #334155;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }}
    .btn:hover {{
      background: #F8FAFC;
      border-color: #94A3B8;
      color: var(--primary);
    }}
    .btn-primary {{
      background: var(--primary);
      color: #FFFFFF;
      border-color: var(--primary);
    }}
    .btn-primary:hover {{
      background: #172554;
      color: #FFFFFF;
    }}
    .filter-tabs {{
      display: flex;
      gap: 6px;
      background: #E2E8F0;
      padding: 4px;
      border-radius: 8px;
    }}
    .filter-btn {{
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      background: transparent;
      color: #475569;
      cursor: pointer;
    }}
    .filter-btn.active {{
      background: #FFFFFF;
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }}
    .viewport {{
      flex: 1;
      overflow: auto;
      background: #F8FAFC;
      position: relative;
      cursor: grab;
    }}
    .viewport:active {{
      cursor: grabbing;
    }}
    .canvas-container {{
      transform-origin: 0 0;
      display: inline-block;
      padding: 20px;
    }}
    .canvas-container svg {{
      display: block;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      background: #FFFFFF;
      border-radius: 8px;
    }}
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">VP</div>
      <div class="brand-text">
        <h1>EngLearn — Sơ Đồ Thực Thể Quan Hệ (ERD)</h1>
        <p>Mô hình quan hệ chuẩn Visual Paradigm — Crow's Foot Notation</p>
      </div>
    </div>

    <div class="filter-tabs">
      <button class="filter-btn active" onclick="filterDomain('all')">Tất cả (16 Bảng)</button>
      <button class="filter-btn" onclick="filterDomain('user')">Người dùng & Test</button>
      <button class="filter-btn" onclick="filterDomain('vocab')">Từ vựng Core</button>
      <button class="filter-btn" onclick="filterDomain('srs')">Thuật toán SM-2</button>
      <button class="filter-btn" onclick="filterDomain('reading')">Đọc hiểu</button>
      <button class="filter-btn" onclick="filterDomain('group')">Nhóm & UGC</button>
    </div>

    <div class="toolbar">
      <button class="btn" onclick="zoomIn()">🔍+ Phóng to</button>
      <button class="btn" onclick="zoomOut()">🔍- Thu nhỏ</button>
      <button class="btn" onclick="resetZoom()">⟲ 100%</button>
      <a href="erd_visual_paradigm.svg" download="ERD_EngLearn_VisualParadigm.svg" class="btn">💾 Tải SVG</a>
      <a href="erd_visual_paradigm.png" download="ERD_EngLearn_VisualParadigm.png" class="btn btn-primary">🖼️ Tải ảnh PNG</a>
      <button class="btn" onclick="window.print()">🖨️ In A3/PDF</button>
    </div>
  </header>

  <div class="viewport" id="viewport">
    <div class="canvas-container" id="container">
      {svg_content}
    </div>
  </div>

  <script>
    let scale = 0.85;
    const container = document.getElementById('container');
    const viewport = document.getElementById('viewport');

    function updateTransform() {{
      container.style.transform = `scale(${{scale}})`;
    }}

    function zoomIn() {{
      scale = Math.min(scale + 0.15, 2.5);
      updateTransform();
    }}

    function zoomOut() {{
      scale = Math.max(scale - 0.15, 0.3);
      updateTransform();
    }}

    function resetZoom() {{
      scale = 0.85;
      updateTransform();
      viewport.scrollLeft = 0;
      viewport.scrollTop = 0;
    }}

    // Filter Highlight
    function filterDomain(domain) {{
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      const boxes = document.querySelectorAll('.entity-box');
      boxes.forEach(box => {{
        if (domain === 'all' || box.classList.contains('domain-' + domain)) {{
          box.style.opacity = '1';
          box.style.filter = 'url(#vp-shadow)';
        }} else {{
          box.style.opacity = '0.15';
          box.style.filter = 'none';
        }}
      }});
    }}

    // Mouse Drag to Pan
    let isDown = false;
    let startX, startY, scrollLeft, scrollTop;

    viewport.addEventListener('mousedown', (e) => {{
      isDown = true;
      startX = e.pageX - viewport.offsetLeft;
      startY = e.pageY - viewport.offsetTop;
      scrollLeft = viewport.scrollLeft;
      scrollTop = viewport.scrollTop;
    }});

    viewport.addEventListener('mouseleave', () => {{ isDown = false; }});
    viewport.addEventListener('mouseup', () => {{ isDown = false; }});

    viewport.addEventListener('mousemove', (e) => {{
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const y = e.pageY - viewport.offsetTop;
      const walkX = (x - startX);
      const walkY = (y - startY);
      viewport.scrollLeft = scrollLeft - walkX;
      viewport.scrollTop = scrollTop - walkY;
    }});

    // Initial scale apply
    updateTransform();
  </script>
</body>
</html>
"""
    return html


def main():
    docs_dir = os.path.join("E:\\doan", "docs")
    os.makedirs(docs_dir, exist_ok=True)

    svg_content = get_erd_svg()
    
    # 1. Luu file SVG
    svg_path = os.path.join(docs_dir, "erd_visual_paradigm.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Created: {svg_path}")

    # 2. Luu file HTML Interactive
    html_content = build_erd_html(svg_content)
    html_path = os.path.join(docs_dir, "erd_visual_paradigm.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Created: {html_path}")

    # 3. Xuat file PNG chat luong cao thong qua Edge Headless
    png_path = os.path.join(docs_dir, "erd_visual_paradigm.png")
    edge_exe = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    
    if os.path.exists(edge_exe):
        print("Rendering high-res PNG via Microsoft Edge...")
        cmd = [
            edge_exe,
            "--headless=new",
            "--disable-gpu",
            "--window-size=2800,2050",
            f"--screenshot={png_path}",
            f"file:///{svg_path.replace(os.sep, '/')}"
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=25)
            if os.path.exists(png_path) and os.path.getsize(png_path) > 1000:
                print(f"Created High-Res PNG: {png_path} ({os.path.getsize(png_path):,} bytes)")
            else:
                print("Fallback screenshot capture...")
        except Exception as e:
            print(f"Error rendering PNG: {e}")

if __name__ == "__main__":
    main()
