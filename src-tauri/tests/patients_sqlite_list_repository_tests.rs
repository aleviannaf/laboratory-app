use laboratory_app_lib::{
  domain::patients::{dto::CreatePatientInput, ports::PatientRepository},
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
}

fn build_input(name: &str, cpf: &str) -> CreatePatientInput {
  CreatePatientInput {
    full_name: name.to_string(),
    cpf: cpf.to_string(),
    birth_date: "1991-10-01T00:00:00".to_string(),
    sex: "M".to_string(),
    phone: "5511988887777".to_string(),
    address: "Street 2".to_string(),
  }
}

#[tokio::test]
async fn list_returns_inserted_patients() {
  let pool = setup_pool().await;
  let repo = PatientsSqliteRepository::new(pool);

  repo
    .insert(build_input("Maria Silva", "11111111111"))
    .await
    .expect("insert 1 should succeed");
  repo
    .insert(build_input("Joao Souza", "22222222222"))
    .await
    .expect("insert 2 should succeed");

  let listed = repo.list(None).await.expect("list should succeed");

  assert_eq!(listed.len(), 2);
  assert!(!listed[0].birth_date.is_empty());
  assert!(!listed[0].sex.is_empty());
  assert!(!listed[0].phone.is_empty());
  assert!(!listed[0].address.is_empty());
}

#[tokio::test]
async fn list_filters_by_name_and_cpf() {
  let pool = setup_pool().await;
  let repo = PatientsSqliteRepository::new(pool);

  repo
    .insert(build_input("Maria Silva", "11111111111"))
    .await
    .expect("insert 1 should succeed");
  repo
    .insert(build_input("Joao Souza", "22222222222"))
    .await
    .expect("insert 2 should succeed");

  let by_name = repo
    .list(Some("maria".to_string()))
    .await
    .expect("list by name should succeed");
  let by_cpf = repo
    .list(Some("2222".to_string()))
    .await
    .expect("list by cpf should succeed");

  assert_eq!(by_name.len(), 1);
  assert_eq!(by_name[0].full_name, "Maria Silva");
  assert_eq!(by_cpf.len(), 1);
  assert_eq!(by_cpf[0].cpf, "22222222222");
}
