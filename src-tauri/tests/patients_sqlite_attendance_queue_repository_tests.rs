use laboratory_app_lib::{
  domain::patients::{
    dto::AttendanceQueueQueryInput,
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
      VALUES
        ('pt-1', 'Maria Souza', '12345678900', '1991-10-01', 'F', '11999999999', 'Rua A', datetime('now'), datetime('now')),
        ('pt-2', 'Joao Silva', '11122233344', '1992-11-01', 'M', '11988888888', 'Rua B', datetime('now'), datetime('now'));
      "#,
    )
    .await
    .expect("failed to seed patients");

  pool
    .execute(
      r#"
      INSERT INTO exams (id, patient_id, exam_date, status, created_at, updated_at)
      VALUES
        ('att-1', 'pt-1', '2026-02-17', 'waiting', datetime('now'), datetime('now')),
        ('att-2', 'pt-2', '2026-02-17', 'completed', datetime('now'), datetime('now')),
        ('att-3', 'pt-1', '2026-02-18', 'waiting', datetime('now'), datetime('now'));
      "#,
    )
    .await
    .expect("failed to seed exams");

  pool
    .execute(
      r#"
      INSERT INTO exam_items (id, exam_id, name, created_at, updated_at)
      VALUES
        ('it-1', 'att-1', 'Glicose', datetime('now'), datetime('now')),
        ('it-2', 'att-1', 'Colesterol Total', datetime('now'), datetime('now')),
        ('it-3', 'att-2', 'Hemograma Completo', datetime('now'), datetime('now')),
        ('it-4', 'att-3', 'Beta HCG', datetime('now'), datetime('now'));
      "#,
    )
    .await
    .expect("failed to seed exam items");
}

#[tokio::test]
async fn list_attendance_queue_filters_by_date_status_and_query() {
  let pool = setup_pool().await;
  seed_data(&pool).await;
  let repo = PatientsSqliteRepository::new(pool);

  let listed = repo
    .list_attendance_queue(AttendanceQueueQueryInput {
      date: Some("2026-02-17".to_string()),
      status: Some("waiting".to_string()),
      query: Some("maria".to_string()),
    })
    .await
    .expect("list should succeed");

  assert_eq!(listed.len(), 1);
  assert_eq!(listed[0].attendance_id, "att-1");
  assert_eq!(listed[0].exam_names.len(), 2);
}

#[tokio::test]
async fn list_attendance_queue_returns_empty_when_no_match() {
  let pool = setup_pool().await;
  seed_data(&pool).await;
  let repo = PatientsSqliteRepository::new(pool);

  let listed = repo
    .list_attendance_queue(AttendanceQueueQueryInput {
      date: Some("2026-02-19".to_string()),
      status: Some("waiting".to_string()),
      query: None,
    })
    .await
    .expect("list should succeed");

  assert!(listed.is_empty());
}
