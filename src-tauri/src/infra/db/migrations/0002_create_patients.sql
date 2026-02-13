CREATE TABLE patients (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  legacy_code INTEGER,
  full_name VARCHAR(150) NOT NULL,
  birth_date DATETIME NOT NULL CHECK(typeof(birth_date) = 'text'),
  sex VARCHAR(1) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL CHECK(typeof(created_at) = 'text'),
  updated_at DATETIME NOT NULL CHECK(typeof(updated_at) = 'text')
);
