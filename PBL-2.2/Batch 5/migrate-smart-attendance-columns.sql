-- Run once on existing databases after pulling latest changes
ALTER TABLE smart_attendance
  ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(30) DEFAULT 'whole_day',
  ADD COLUMN IF NOT EXISTS period_start INT DEFAULT 1;
