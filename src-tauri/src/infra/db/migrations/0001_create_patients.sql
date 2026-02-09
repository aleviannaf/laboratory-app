CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY NOT NULL
    DEFAULT (lower(hex(randomblob(16)))),
  full_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  sex TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
