CREATE TABLE requesters (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  name VARCHAR(150) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL
);
