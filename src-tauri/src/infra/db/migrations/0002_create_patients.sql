CREATE TABLE patients (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  legacy_code INTEGER,
  full_name VARCHAR(150) NOT NULL,
  birth_date DATE,
  sex VARCHAR(1),
  phone VARCHAR(20),
  address TEXT,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
