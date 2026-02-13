CREATE TABLE sync_runs (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  started_at DATETIME NOT NULL,
  finished_at DATETIME,
  status VARCHAR(10) NOT NULL,
  direction VARCHAR(10) NOT NULL,
  records_sent INTEGER NOT NULL DEFAULT 0,
  records_received INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);
