CREATE TABLE audit_log (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  entity_name VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL,
  action VARCHAR(10) NOT NULL,
  performed_by_user_id TEXT,
  performed_at DATETIME NOT NULL,
  before_json TEXT,
  after_json TEXT,
  FOREIGN KEY (performed_by_user_id) REFERENCES users(id)
);
