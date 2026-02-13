CREATE TABLE pdf_reports (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  exam_id TEXT NOT NULL UNIQUE,
  generated_by_user_id TEXT,
  generated_at DATETIME NOT NULL,
  report_version INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (generated_by_user_id) REFERENCES users(id)
);
