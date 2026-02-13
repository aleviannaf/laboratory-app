CREATE TABLE exams (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  patient_id TEXT NOT NULL,
  requester_id TEXT,
  exam_date DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL,
  procedure_type VARCHAR(50),
  delivered_to TEXT,
  notes TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (requester_id) REFERENCES requesters(id)
);
