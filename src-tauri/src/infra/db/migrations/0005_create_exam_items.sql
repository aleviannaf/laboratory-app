CREATE TABLE exam_items (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  exam_id TEXT NOT NULL,
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(20),
  method VARCHAR(100),
  reference_range TEXT,
  result_value TEXT,
  result_flag VARCHAR(20),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);
