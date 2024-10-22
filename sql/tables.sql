-- Temporärt avaktivera kontroll av utländska nycklar
SET FOREIGN_KEY_CHECKS = 0;

-- Ta bort befintliga tabeller om de existerar
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS boxes;
DROP TABLE IF EXISTS box_labels;
DROP TABLE IF EXISTS qr_code;
DROP TABLE IF EXISTS box_contents;
DROP TABLE IF EXISTS labels;
DROP TABLE IF EXISTS label_contents;
DROP TABLE IF EXISTS security;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS shared_labels;

-- Skapa tabell för användare
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255),
    profile_name VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    storage_usage INT DEFAULT 0,
    verification_token VARCHAR(255),
    verification_code VARCHAR(6),
    verification_expires_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Lägg till admin-användaren
INSERT INTO users (email, password_hash, profile_name, is_verified, is_active, is_admin)
VALUES (
    'maxkingthe44@gmail.com',
    '$2b$10$peG7MrIdD6Y5wr49/LZFROiTuBESat8eiXGpbcbr5vk1eJl5n4WCC',
    'Admin User',
    TRUE,
    TRUE,
    TRUE
);

-- Skapa tabell för boxar
CREATE TABLE boxes (
    box_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    box_name VARCHAR(255),
    label_name VARCHAR(255),
    label_image VARCHAR(255),
    content_type ENUM('text', 'image', 'audio'),
    content_data TEXT,
    qr_code TEXT UNIQUE,
    access_token VARCHAR(32) UNIQUE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE, -- Markera om boxen är privat
    pin_code VARCHAR(6), -- PIN-kod för privata boxar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Skapa tabell för QR-koder
CREATE TABLE qr_code (
    qr_id INT AUTO_INCREMENT PRIMARY KEY,
    box_id INT NOT NULL,
    qr_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (box_id) REFERENCES boxes(box_id) ON DELETE CASCADE
);

-- Skapa tabell för innehåll i boxar
CREATE TABLE box_contents (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    box_id INT NOT NULL,
    content_type ENUM('text', 'audio', 'image') NOT NULL,
    content_data TEXT,
    content_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (box_id) REFERENCES boxes(box_id) ON DELETE CASCADE
);

-- Skapa tabell för etiketter (labels)
CREATE TABLE labels (
    label_id INT AUTO_INCREMENT PRIMARY KEY,
    label_name VARCHAR(255) NOT NULL,
    label_design VARCHAR(50),
    is_private BOOLEAN DEFAULT FALSE,
    pin_code VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relation mellan boxar och etiketter
CREATE TABLE box_labels (
    box_label_id INT AUTO_INCREMENT PRIMARY KEY,
    box_id INT NOT NULL,
    label_id INT NOT NULL,
    FOREIGN KEY (box_id) REFERENCES boxes(box_id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(label_id) ON DELETE CASCADE
);

-- Skapa tabell för etikettinnehåll
CREATE TABLE label_contents (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    label_id INT NOT NULL,
    content_type ENUM('text', 'audio', 'image') NOT NULL,
    content_text TEXT,
    content_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (label_id) REFERENCES labels(label_id) ON DELETE CASCADE
);

-- Skapa tabell för säkerhetshändelser
CREATE TABLE security (
    security_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    security_name VARCHAR(255),
    date_of_creation DATE,
    date_of_destruction DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Skapa tabell för användarsessioner
CREATE TABLE user_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Skapa tabell för aktivitetsloggar
CREATE TABLE activity_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Skapa tabell för delade etiketter
CREATE TABLE shared_labels (
    share_id INT AUTO_INCREMENT PRIMARY KEY,
    label_id INT NOT NULL,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (label_id) REFERENCES labels(label_id) ON DELETE CASCADE
);

-- Återaktivera kontroll av utländska nycklar
SET FOREIGN_KEY_CHECKS = 1;
