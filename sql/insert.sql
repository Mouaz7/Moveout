USE moveout;
SET GLOBAL local_infile = 1;

-- Ladda data i tabellen 'users'
LOAD DATA LOCAL INFILE 'users.csv'
INTO TABLE users
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(user_id, email, password_hash, salt, profile_name, is_verified, is_active, is_admin, storage_usage, verification_token, verification_code, verification_expires_at, last_activity, created_at, updated_at);

-- Ladda data i tabellen 'boxes'
LOAD DATA LOCAL INFILE 'boxes.csv'
INTO TABLE boxes
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'qr_code'
LOAD DATA LOCAL INFILE 'qr_code.csv'
INTO TABLE qr_code
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'box_contents'
LOAD DATA LOCAL INFILE 'box_contents.csv'
INTO TABLE box_contents
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'labels'
LOAD DATA LOCAL INFILE 'labels.csv'
INTO TABLE labels
FIELDS TERMINATED BY ',' 
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'box_labels'
LOAD DATA LOCAL INFILE 'box_labels.csv'
INTO TABLE box_labels
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'security'
LOAD DATA LOCAL INFILE 'security.csv'
INTO TABLE security
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'user_sessions'
LOAD DATA LOCAL INFILE 'user_sessions.csv'
INTO TABLE user_sessions
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'activity_log'
LOAD DATA LOCAL INFILE 'activity_log.csv'
INTO TABLE activity_log
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'label_contents'
LOAD DATA LOCAL INFILE 'label_contents.csv'
INTO TABLE label_contents
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;

-- Ladda data i tabellen 'shared_labels'
LOAD DATA LOCAL INFILE 'shared_labels.csv'
INTO TABLE shared_labels
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES;
