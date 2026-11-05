-- ========================================================
-- ENGLEARN DATABASE DDL SCHEMA FOR VISUAL PARADIGM
-- Dialect: MySQL 8.0 / InnoDB
-- Generated for Visual Paradigm Reverse Engineering
-- ========================================================

CREATE DATABASE IF NOT EXISTS englearn_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE englearn_db;

-- 1. Table: users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NULL,
    avatar_url VARCHAR(255) NULL,
    role ENUM('admin', 'learner') NOT NULL DEFAULT 'learner',
    initial_level VARCHAR(50) NULL,
    daily_goal INT NOT NULL DEFAULT 10,
    streak INT NOT NULL DEFAULT 0,
    last_study_date DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: level_assessments
CREATE TABLE level_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL DEFAULT 30,
    result_level VARCHAR(50) NOT NULL,
    answers_detail JSON NULL,
    taken_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Table: topics
CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(50) NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Table: vocabularies
CREATE TABLE vocabularies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    created_by INT NULL,
    word VARCHAR(100) NOT NULL,
    phonetic VARCHAR(100) NULL,
    part_of_speech VARCHAR(50) NULL,
    meaning_vi TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vocab_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    CONSTRAINT fk_vocab_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Table: vocab_examples
CREATE TABLE vocab_examples (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vocabulary_id INT NOT NULL,
    sentence_en TEXT NOT NULL,
    sentence_vi TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_example_vocab FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Table: user_vocab_lists
CREATE TABLE user_vocab_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    color VARCHAR(30) NULL DEFAULT '#1E3A8A',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vocablist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Table: user_vocab_list_items
CREATE TABLE user_vocab_list_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    list_id INT NOT NULL,
    vocabulary_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_listitem_list FOREIGN KEY (list_id) REFERENCES user_vocab_lists(id) ON DELETE CASCADE,
    CONSTRAINT fk_listitem_vocab FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Table: user_vocab_progress
CREATE TABLE user_vocab_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vocabulary_id INT NOT NULL,
    status ENUM('new', 'learning', 'mastered') NOT NULL DEFAULT 'new',
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    ease_factor FLOAT NOT NULL DEFAULT 2.5,
    interval_days INT NOT NULL DEFAULT 0,
    repetition_count INT NOT NULL DEFAULT 0,
    next_review_at DATETIME NULL,
    last_reviewed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_vocab FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Table: review_schedules
CREATE TABLE review_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vocabulary_id INT NOT NULL,
    group_vocab_set_id INT NULL,
    scheduled_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_vocab FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Table: readings
CREATE TABLE readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    created_by INT NULL,
    title VARCHAR(255) NOT NULL,
    content_en TEXT NOT NULL,
    content_vi TEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'easy',
    reading_time INT NOT NULL DEFAULT 5,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reading_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Table: questions
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reading_id INT NOT NULL,
    question_text TEXT NOT NULL,
    options JSON NOT NULL,
    correct_option INT NOT NULL,
    explanation_vi TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_reading FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Table: user_reading_attempts
CREATE TABLE user_reading_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reading_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    time_spent INT NULL,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_reading FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Table: user_answers
CREATE TABLE user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_answer_attempt FOREIGN KEY (attempt_id) REFERENCES user_reading_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Table: groups
CREATE TABLE `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    avatar_url VARCHAR(255) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_group_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. Table: group_members
CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'member') NOT NULL DEFAULT 'member',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_member_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. Table: group_vocab_sets
CREATE TABLE group_vocab_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    created_by INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vocabset_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    CONSTRAINT fk_vocabset_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 17. Table: group_vocab_items
CREATE TABLE group_vocab_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vocab_set_id INT NOT NULL,
    vocabulary_id INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_vocabitem_set FOREIGN KEY (vocab_set_id) REFERENCES group_vocab_sets(id) ON DELETE CASCADE,
    CONSTRAINT fk_vocabitem_vocab FOREIGN KEY (vocabulary_id) REFERENCES vocabularies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. Table: group_reading_sets
CREATE TABLE group_reading_sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    reading_id INT NOT NULL,
    created_by INT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_readingset_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    CONSTRAINT fk_readingset_reading FOREIGN KEY (reading_id) REFERENCES readings(id) ON DELETE CASCADE,
    CONSTRAINT fk_readingset_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 19. Table: community_posts
CREATE TABLE community_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_type ENUM('vocab_set', 'reading') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    content_ids JSON NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    admin_note TEXT NULL,
    upvote_count INT NOT NULL DEFAULT 0,
    reviewed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_community_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
