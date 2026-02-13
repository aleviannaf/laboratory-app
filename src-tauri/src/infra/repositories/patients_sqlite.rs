use async_trait::async_trait;
use sqlx::{sqlite::SqliteRow, Row, SqlitePool};

use crate::domain::patients::{
  dto::CreatePatientInput,
  entity::Patient,
  errors::PatientRepositoryError,
  ports::PatientRepository,
};

pub struct PatientsSqliteRepository {
  pool: SqlitePool,
}

impl PatientsSqliteRepository {
  pub fn new(pool: SqlitePool) -> Self {
    Self { pool }
  }
}

#[async_trait]
impl PatientRepository for PatientsSqliteRepository {
  async fn insert(&self, input: CreatePatientInput) -> Result<Patient, PatientRepositoryError> {

    let result = sqlx::query(
      r#"
      INSERT INTO patients (full_name, cpf, birth_date, sex, phone, address, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))
      RETURNING id, full_name, cpf, birth_date, sex, phone, address, created_at, updated_at
      "#,
    )
    .bind(&input.full_name)
    .bind(&input.cpf)
    .bind(&input.birth_date)
    .bind(&input.sex)
    .bind(&input.phone)
    .bind(&input.address)
    .fetch_one(&self.pool)
    .await;

    let row: SqliteRow = match result {
      Ok(row) => row,
      Err(e) => {
        return Err(map_sqlx_error(e));
      }
    };

    Ok(Patient {
      id: row.get::<String, _>("id"),
      full_name: row.get::<String, _>("full_name"),
      cpf: row.get::<String, _>("cpf"),
      birth_date: row.get::<String, _>("birth_date"),
      sex: row.get::<String, _>("sex"),
      phone: row.get::<String, _>("phone"),
      address: row.get::<String, _>("address"),
      created_at: row.get::<String, _>("created_at"),
      updated_at: row.get::<String, _>("updated_at"),
    })
  }

  async fn list(&self, query: Option<String>) -> Result<Vec<Patient>, PatientRepositoryError> {
    let query = query.unwrap_or_default().trim().to_string();
    let rows = if query.is_empty() {
      sqlx::query(
        r#"
        SELECT id, full_name, cpf, birth_date, sex, phone, address, created_at, updated_at
        FROM patients
        ORDER BY created_at DESC
        "#,
      )
      .fetch_all(&self.pool)
      .await
    } else {
      let like = format!("%{}%", query);
      sqlx::query(
        r#"
        SELECT id, full_name, cpf, birth_date, sex, phone, address, created_at, updated_at
        FROM patients
        WHERE lower(full_name) LIKE lower(?1) OR cpf LIKE ?1
        ORDER BY created_at DESC
        "#,
      )
      .bind(like)
      .fetch_all(&self.pool)
      .await
    };

    let rows = rows.map_err(map_sqlx_error)?;

    let mut patients = Vec::with_capacity(rows.len());
    for row in rows {
      patients.push(Patient {
        id: row.get::<String, _>("id"),
        full_name: row.get::<String, _>("full_name"),
        cpf: row.get::<String, _>("cpf"),
        birth_date: row.get::<String, _>("birth_date"),
        sex: row.get::<String, _>("sex"),
        phone: row.get::<String, _>("phone"),
        address: row.get::<String, _>("address"),
        created_at: row.get::<String, _>("created_at"),
        updated_at: row.get::<String, _>("updated_at"),
      });
    }

    Ok(patients)
  }
}

fn map_sqlx_error(err: sqlx::Error) -> PatientRepositoryError {
  match err {
    sqlx::Error::RowNotFound => PatientRepositoryError::NotFound,
    sqlx::Error::Database(db_err) if db_err.is_unique_violation() => {
      PatientRepositoryError::Conflict
    }
    _ => PatientRepositoryError::PersistenceError,
  }
}
