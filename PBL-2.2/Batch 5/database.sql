CREATE DATABASE IF NOT EXISTS sweety_smart_students;
USE sweety_smart_students;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS absence_requests;
DROP TABLE IF EXISTS smart_attendance_students;
DROP TABLE IF EXISTS smart_attendance;
DROP TABLE IF EXISTS student_mentors;
DROP TABLE IF EXISTS faculty_requests;
DROP TABLE IF EXISTS hod_requests;
DROP TABLE IF EXISTS location_updates;
DROP TABLE IF EXISTS campus_zones;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS attendance_history;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS mentor_assignments;
DROP TABLE IF EXISTS timetable;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS registration_requests;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  roll_number VARCHAR(50) UNIQUE,
  faculty_id VARCHAR(50) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','student','faculty','hod') NOT NULL,
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  phone VARCHAR(20),
  mobile VARCHAR(20) UNIQUE,
  faculty_type ENUM('normal','incharge') NULL,
  approval_status ENUM('pending','approved','rejected','blocked') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at DATETIME NULL,
  admission_type ENUM('regular','lateral') DEFAULT 'regular',
  roll_prefix VARCHAR(20),
  roll_suffix VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculty_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT NOT NULL,
  hod_id INT NULL,
  branch VARCHAR(100),
  status ENUM('pending','approved','rejected','blocked') DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  CONSTRAINT fk_faculty_requests_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_faculty_requests_hod FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE hod_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hod_id INT NOT NULL,
  admin_id INT NULL,
  branch VARCHAR(100),
  status ENUM('pending','approved','rejected','blocked') DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  CONSTRAINT fk_hod_requests_hod FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_hod_requests_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE registration_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  faculty_id INT NULL,
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  status ENUM('pending','approved','rejected','blocked') DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  CONSTRAINT fk_registration_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_registration_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject VARCHAR(100),
  total_classes INT DEFAULT 0,
  attended_classes INT DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_subject (student_id, subject),
  CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  code VARCHAR(50),
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  faculty_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_subject_class_code (branch, year, section, code),
  CONSTRAINT fk_subjects_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT,
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  subject_id INT,
  status ENUM('active','blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_faculty_class_subject (faculty_id, branch, year, section, subject_id),
  UNIQUE KEY faculty_subject_class_unique (branch, year, section, subject_id, status),
  CONSTRAINT fk_classes_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_classes_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE timetable (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  day_of_week ENUM('MON','TUE','WED','THU','FRI','SAT'),
  period_number INT,
  start_time TIME,
  end_time TIME,
  subject_id INT,
  subject_name VARCHAR(150),
  faculty_id INT,
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_timetable_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  CONSTRAINT fk_timetable_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT,
  subject_id INT,
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  attendance_date DATE,
  period_number INT,
  topic TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_sessions_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_sessions_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

CREATE TABLE attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  student_id INT,
  status ENUM('present','absent','smart_present','present_override') DEFAULT 'present',
  source ENUM('faculty','smart_attendance','override') DEFAULT 'faculty',
  place VARCHAR(150),
  campus_status ENUM('INSIDE','OUTSIDE') NULL,
  override_reason TEXT NULL,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_session_student (session_id, student_id),
  CONSTRAINT fk_attendance_records_session FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_records_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE attendance_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_id INT NOT NULL,
  changed_by INT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_history_record FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE smart_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by INT,
  created_by_role ENUM('faculty','hod'),
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  reason VARCHAR(150),
  start_date DATE,
  end_date DATE,
  start_period INT,
  end_period INT,
  attendance_type VARCHAR(30) DEFAULT 'whole_day',
  period_start INT DEFAULT 1,
  proof_file VARCHAR(255),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_smart_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE smart_attendance_students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  smart_attendance_id INT NOT NULL,
  student_id INT NOT NULL,
  UNIQUE KEY unique_smart_student (smart_attendance_id, student_id),
  CONSTRAINT fk_smart_student_entry FOREIGN KEY (smart_attendance_id) REFERENCES smart_attendance(id) ON DELETE CASCADE,
  CONSTRAINT fk_smart_student_user FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE student_mentors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  faculty_id INT NOT NULL,
  assigned_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_mentor (student_id, faculty_id),
  CONSTRAINT fk_student_mentor_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_mentor_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_mentor_assigned FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE mentor_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT NOT NULL,
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  start_roll VARCHAR(50),
  end_roll VARCHAR(50),
  assigned_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_mentor_roll_range (faculty_id, branch, year, section, start_roll, end_roll),
  CONSTRAINT fk_mentor_assignment_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_mentor_assignment_hod FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(200),
  message TEXT,
  type VARCHAR(50),
  reference_id INT NULL,
  link_path VARCHAR(255),
  metadata JSON NULL,
  metadata_json JSON NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  faculty_id INT NULL,
  hod_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_faculty (student_id, faculty_id),
  UNIQUE KEY unique_student_hod (student_id, hod_id),
  CONSTRAINT fk_conversations_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_hod FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uploaded_by INT,
  title VARCHAR(200),
  type ENUM('notes','important_questions','notice'),
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_faculty FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT,
  title VARCHAR(200),
  description TEXT,
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notices_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT,
  title VARCHAR(200),
  description TEXT,
  event_date DATE,
  event_time TIME,
  venue VARCHAR(150),
  registration_link VARCHAR(255),
  branch VARCHAR(100),
  year VARCHAR(20),
  section VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE location_updates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  campus_status ENUM('INSIDE','OUTSIDE'),
  zone_name VARCHAR(150),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_location_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE campus_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  radius INT,
  description TEXT
);

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  reset_token VARCHAR(255),
  expires_at DATETIME,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE absence_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  faculty_id INT NULL,
  mentor_id INT NULL,
  hod_id INT NULL,
  date DATE,
  period_number INT NULL,
  subject_id INT NULL,
  reason TEXT,
  proof_file VARCHAR(255),
  event_id INT NULL,
  status ENUM('pending','approved','rejected','blocked') DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_absence_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_absence_faculty FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_absence_mentor FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_absence_hod FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_absence_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_absence_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

SELECT * FROM USERS;

