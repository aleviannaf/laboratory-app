use laboratory_app_lib::{
  domain::patients::{
    dto::{AttendanceQueueQueryInput, CompleteAttendanceInput},
    errors::PatientRepositoryError,
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

async fn seed_data(pool: &SqlitePool) {
  pool
    .execute(
      r#"
      INSERT INTO patients (id, full_name, cpf, birth_date, sex, phone, address, created_at, updated_at)
      VALUES ('pt-1', 'Maria Souza', '12345678900', '1991-10-01', 'F', '11999999999', 'Rua A', datetime('now'), datetime('now'));
      "#,
    )
    .await
    .expect("failed to seed patient");

  pool
    .execute(
      r#"
      INSERT INTO exams (id, patient_id, exam_date, status, created_at, updated_at)
      VALUES ('att-1', 'pt-1', '2026-02-17', 'waiting', datetime('now'), datetime('now'));
      "#,
    )
    .await
    .expect("failed to seed exam");

  pool
    .execute(
      r#"
      INSERT INTO exam_items (id, exam_id, name, created_at, updated_at)
      VALUES ('it-1', 'att-1', 'Glicose', datetime('now'), datetime('now'));
      "#,
    )
    .await
    .expect("failed to seed exam item");
}

#[tokio::test]
async fn complete_attendance_updates_status_and_returns_updated_item() {
  let pool = setup_pool().await;
  seed_data(&pool).await;
  let repo = PatientsSqliteRepository::new(pool);

  let completed = repo
    .complete_attendance(CompleteAttendanceInput {
      attendance_id: "att-1".to_string(),
    })
    .await
    .expect("complete should succeed");

  assert_eq!(completed.status, "completed");

  let listed = repo
    .list_attendance_queue(AttendanceQueueQueryInput {
      date: Some("2026-02-17".to_string()),
      status: Some("completed".to_string()),
      query: None,
    })
    .await
    .expect("list should succeed");

  assert_eq!(listed.len(), 1);
  assert_eq!(listed[0].attendance_id, "att-1");
}

#[tokio::test]
async fn complete_attendance_returns_not_found_for_missing_id() {
  let pool = setup_pool().await;
  seed_data(&pool).await;
  let repo = PatientsSqliteRepository::new(pool);

  let result = repo
    .complete_attendance(CompleteAttendanceInput {
      attendance_id: "missing".to_string(),
    })
    .await;

  assert!(matches!(result, Err(PatientRepositoryError::NotFound)));
}
