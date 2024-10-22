USE moveout;

-- Ta bort procedurer om de existerar
DROP PROCEDURE IF EXISTS add_new_user;
DROP PROCEDURE IF EXISTS add_new_box;
DROP PROCEDURE IF EXISTS log_activity;
DROP PROCEDURE IF EXISTS verify_user;

DELIMITER //

-- Procedur för att lägga till en ny användare
CREATE PROCEDURE add_new_user(
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_profile_name VARCHAR(255),
    IN p_verification_token VARCHAR(255)
)
BEGIN
    -- Kontrollera om e-postadressen redan finns
    IF (SELECT COUNT(*) FROM users WHERE email = p_email) = 0 THEN
        INSERT INTO users (email, password_hash, profile_name, verification_token, created_at, updated_at)
        VALUES (p_email, p_password_hash, p_profile_name, p_verification_token, NOW(), NOW());
        SELECT 'Användaren har skapats.';
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'E-postadressen finns redan.';
    END IF;
END //

-- Procedur för att lägga till en ny box
CREATE PROCEDURE add_new_box(
    IN p_user_id INT,
    IN p_box_name VARCHAR(255),
    IN p_label_design VARCHAR(50)
)
BEGIN
    -- Kontrollera om användaren existerar
    IF (SELECT COUNT(*) FROM users WHERE user_id = p_user_id) > 0 THEN
        INSERT INTO boxes (user_id, box_name, label_design, created_at, updated_at)
        VALUES (p_user_id, p_box_name, p_label_design, NOW(), NOW());
        SELECT 'Boxen har skapats.';
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Användar-ID existerar inte.';
    END IF;
END //

-- Procedur för att logga en aktivitet
CREATE PROCEDURE log_activity(
    IN p_user_id INT,
    IN p_action_description TEXT
)
BEGIN
    -- Kontrollera om användaren existerar
    IF (SELECT COUNT(*) FROM users WHERE user_id = p_user_id) > 0 THEN
        INSERT INTO activity_log (user_id, action_description, created_at)
        VALUES (p_user_id, p_action_description, NOW());
        SELECT 'Aktiviteten har loggats.';
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Användar-ID existerar inte.';
    END IF;
END //

-- Procedur för att verifiera en användare
CREATE PROCEDURE verify_user(
    IN p_user_id INT
)
BEGIN
    UPDATE users
    SET is_verified = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ingen användare uppdaterades. Kontrollera användar-ID.';
    ELSE
        SELECT 'Användaren har verifierats.';
    END IF;
END //

DELIMITER ;
