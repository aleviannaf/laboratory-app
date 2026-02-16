use laboratory_app_lib::{
  domain::patients::{
    dto::{CreateAttendanceInput, CreateAttendanceItemInput},
    ports::PatientRepository,
  },
  infra::repositories::patients_sqlite::PatientsSqliteRepository,
};
use sqlx::{sqlite::SqlitePoolOptions, Executor, SqlitePool};

async fn setup_pool() -> SqlitePool {
  let pool = SqlitePoolOptions::new()
    .max_connections(1)
    .connect("sqlite::memory:")
    .await
    .expect("failed to create sqlite in-memory pool");

  pool
    .execute(
      r#"
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
      "#,
    )
    .await
    .expect("failed to create patients table");

  pool
    .execute(
      r#"
      CREATE TABLE requesters (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
        name VARCHAR(150) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL
      );
      "#,
    )
    .await
    .expect("failed to create requesters table");

  pool
    .execute(
      r#"
      CREATE TABLE exams (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
        patient_id TEXT NOT NULL,
        requester_id TEXT,
        exam_date DATETIME NOT NULL CHECK(typeof(exam_date) = 'text'),
        status VARCHAR(20) NOT NULL,
        procedure_type VARCHAR(50),
        delivered_to TEXT,
        notes TEXT,
        created_at DATETIME NOT NULL CHECK(typeof(created_at) = 'text'),
        updated_at DATETIME NOT NULL CHECK(typeof(updated_at) = 'text')
      );
      "#,
    )
    .await
    .expect("failed to create exams table");

  pool
    .execute(
      r#"
      CREATE TABLE exam_items (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
        exam_id TEXT NOT NULL,
        name VARCHAR(150) NOT NULL,
        unit VARCHAR(20),
        method VARCHAR(100),
        reference_range TEXT,
        result_value TEXT,
        result_flag VARCHAR(20),
        created_at DATETIME NOT NULL CHECK(typeof(created_at) = 'text'),
        updated_at DATETIME NOT NULL CHECK(typeof(updated_at) = 'text')
      );
      "#,
    )
    .await
    .expect("failed to create exam_items table");

  pool
}

#[tokio::test]
async fn create_attendance_and_get_record_work_together() {
  let pool = setup_pool().await;

  pool
    .execute(
      r#"
      INSERT INTO patients (id, full_name, cpf, birth_date, sex, phone, address, created_at, updated_at)
      VALUES ('pt-1', 'Maria Souza', '12345678900', '1991-10-01', 'F', '11999999999', 'Rua A', datetime('now'), datetime('now'));
      "#,
    )
    .await
    .expect("failed to insert patient");

  let repo = PatientsSqliteRepository::new(pool);

  let created = repo
    .create_attendance(CreateAttendanceInput {
      patient_id: "pt-1".to_string(),
      exam_date: "2026-02-14".to_string(),
      requester_id: None,
      status: None,
      procedure_type: None,
      delivered_to: None,
      notes: None,
      items: vec![
        CreateAttendanceItemInput {
          name: "Glicose".to_string(),
          unit: Some("mg/dL".to_string()),
          method: None,
          reference_range: Some("70-99".to_string()),
        },
        CreateAttendanceItemInput {
          name: "Colesterol Total".to_string(),
          unit: Some("mg/dL".to_string()),
          method: None,
          reference_range: Some("<190".to_string()),
        },
      ],
    })
    .await
    .expect("create attendance should succeed");

  assert_eq!(created.status, "waiting");
  assert_eq!(created.items.len(), 2);

  let record = repo
    .get_patient_record("pt-1".to_string())
    .await
    .expect("get patient record should succeed");

  assert_eq!(record.patient.id, "pt-1");
  assert_eq!(record.entries.len(), 1);
  assert_eq!(record.entries[0].exam_id, created.exam_id);
  assert_eq!(record.entries[0].items.len(), 2);
}

#[tokio::test]
async fn list_exam_catalog_returns_seed_items() {
  let pool = setup_pool().await;
  let repo = PatientsSqliteRepository::new(pool);

  let catalog = repo.list_exam_catalog().await.expect("catalog should load");

  assert!(!catalog.is_empty());
  assert!(catalog.iter().any(|item| item.id == "glicose"));
}
