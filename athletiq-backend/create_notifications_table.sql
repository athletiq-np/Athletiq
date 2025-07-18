-- Create notifications table for school alerts
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_user_type VARCHAR(20) NOT NULL,
  target_user_id INTEGER,
  related_entity_type VARCHAR(20),
  related_entity_id INTEGER,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_user_type, target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
