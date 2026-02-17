use async_trait::async_trait;
use std::collections::HashMap;
use sqlx::{sqlite::SqliteRow, QueryBuilder, Row, Sqlite, SqlitePool};

use crate::domain::patients::{
  dto::{
    AttendanceQueueItemView, AttendanceQueueQueryInput, CompleteAttendanceInput, CreateAttendanceInput,
    CreatePatientInput, ExamCatalogItemView, PatientRecordEntryView, PatientRecordExamItemView,
    PatientRecordView, PatientView,
  },
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

  async fn get_attendance_by_id(
    &self,
    attendance_id: &str,
  ) -> Result<AttendanceQueueItemView, PatientRepositoryError> {
    let rows = sqlx::query(
      r#"
      SELECT
        e.id AS attendance_id,
        e.patient_id AS patient_id,
        p.full_name AS patient_name,
        p.cpf AS patient_cpf,
        e.exam_date AS exam_date,
        e.status AS status,
        e.updated_at AS updated_at,
        ei.name AS exam_name
      FROM exams e
      JOIN patients p ON p.id = e.patient_id
      LEFT JOIN exam_items ei ON ei.exam_id = e.id
      WHERE e.id = ?1
      ORDER BY ei.created_at ASC
      "#,
    )
    .bind(attendance_id)
    .fetch_all(&self.pool)
    .await
    .map_err(map_sqlx_error)?;

    if rows.is_empty() {
      return Err(PatientRepositoryError::NotFound);
    }

    let first = &rows[0];
    let attendance_id = first.get::<String, _>("attendance_id");
    let patient_id = first.get::<String, _>("patient_id");
    let patient_name = first.get::<String, _>("patient_name");
    let patient_cpf = first.get::<String, _>("patient_cpf");
    let exam_date = first.get::<String, _>("exam_date");
    let status = first.get::<String, _>("status");
    let updated_at = first.get::<String, _>("updated_at");
    let mut exam_names: Vec<String> = Vec::new();
    for row in rows {
      if let Ok(exam_name) = row.try_get::<String, _>("exam_name") {
        if !exam_names.iter().any(|value| value == &exam_name) {
          exam_names.push(exam_name);
        }
      }
    }

    Ok(AttendanceQueueItemView {
      attendance_id,
      patient_id,
      patient_name,
      patient_cpf,
      exam_date,
      status,
      exam_names,
      updated_at,
    })
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

  async fn get_patient_record(
    &self,
    patient_id: String,
  ) -> Result<PatientRecordView, PatientRepositoryError> {
    let patient_row = sqlx::query(
      r#"
      SELECT id, full_name, cpf, birth_date, sex, phone, address, created_at, updated_at
      FROM patients
      WHERE id = ?1
      "#,
    )
    .bind(&patient_id)
    .fetch_one(&self.pool)
    .await
    .map_err(map_sqlx_error)?;

    let patient = PatientView {
      id: patient_row.get::<String, _>("id"),
      full_name: patient_row.get::<String, _>("full_name"),
      cpf: patient_row.get::<String, _>("cpf"),
      birth_date: patient_row.get::<String, _>("birth_date"),
      sex: patient_row.get::<String, _>("sex"),
      phone: patient_row.get::<String, _>("phone"),
      address: patient_row.get::<String, _>("address"),
      created_at: patient_row.get::<String, _>("created_at"),
      updated_at: patient_row.get::<String, _>("updated_at"),
    };

    let rows = sqlx::query(
      r#"
      SELECT
        e.id AS exam_id,
        e.exam_date AS exam_date,
        e.status AS status,
        r.name AS requester_name,
        ei.id AS exam_item_id,
        ei.name AS item_name,
        ei.unit AS unit,
        ei.method AS method,
        ei.reference_range AS reference_range,
        ei.result_value AS result_value,
        ei.result_flag AS result_flag
      FROM exams e
      LEFT JOIN requesters r ON r.id = e.requester_id
      LEFT JOIN exam_items ei ON ei.exam_id = e.id
      WHERE e.patient_id = ?1
      ORDER BY e.exam_date DESC, e.created_at DESC, ei.created_at ASC
      "#,
    )
    .bind(&patient_id)
    .fetch_all(&self.pool)
    .await
    .map_err(map_sqlx_error)?;

    let mut entries: Vec<PatientRecordEntryView> = Vec::new();
    let mut entry_index_by_exam_id: HashMap<String, usize> = HashMap::new();

    for row in rows {
      let exam_id = row.get::<String, _>("exam_id");
      let idx = if let Some(existing_idx) = entry_index_by_exam_id.get(&exam_id) {
        *existing_idx
      } else {
        let created_idx = entries.len();
        entry_index_by_exam_id.insert(exam_id.clone(), created_idx);
        entries.push(PatientRecordEntryView {
          exam_id: exam_id.clone(),
          exam_date: row.get::<String, _>("exam_date"),
          status: row.get::<String, _>("status"),
          requester_name: row.get::<Option<String>, _>("requester_name"),
          items: Vec::new(),
        });
        created_idx
      };

      if let Ok(exam_item_id) = row.try_get::<String, _>("exam_item_id") {
        let result_value = row.get::<Option<String>, _>("result_value");
        let result_flag = row.get::<Option<String>, _>("result_flag");
        entries[idx].items.push(PatientRecordExamItemView {
          exam_item_id,
          name: row.get::<String, _>("item_name"),
          unit: row.get::<Option<String>, _>("unit"),
          method: row.get::<Option<String>, _>("method"),
          reference_range: row.get::<Option<String>, _>("reference_range"),
          result_value: result_value.clone(),
          result_flag: result_flag.clone(),
          report_available: result_value.is_some() || result_flag.is_some(),
        });
      }
    }

    Ok(PatientRecordView { patient, entries })
  }

  async fn list_exam_catalog(&self) -> Result<Vec<ExamCatalogItemView>, PatientRepositoryError> {
    Ok(vec![
      ExamCatalogItemView {
        id: "glicose".to_string(),
        name: "Glicose".to_string(),
        category_id: "bioquimica".to_string(),
        category_title: "Bioquimica".to_string(),
        price_cents: 1000,
      },
      ExamCatalogItemView {
        id: "colesterol-total".to_string(),
        name: "Colesterol Total".to_string(),
        category_id: "bioquimica".to_string(),
        category_title: "Bioquimica".to_string(),
        price_cents: 1000,
      },
      ExamCatalogItemView {
        id: "triglicerideos".to_string(),
        name: "Triglicerideos".to_string(),
        category_id: "bioquimica".to_string(),
        category_title: "Bioquimica".to_string(),
        price_cents: 1000,
      },
      ExamCatalogItemView {
        id: "ureia-creatinina".to_string(),
        name: "Bioquimica 2 (Ureia/Creatinina)".to_string(),
        category_id: "bioquimica".to_string(),
        category_title: "Bioquimica".to_string(),
        price_cents: 2500,
      },
      ExamCatalogItemView {
        id: "hemograma-completo".to_string(),
        name: "Hemograma Completo".to_string(),
        category_id: "hematologia".to_string(),
        category_title: "Hematologia".to_string(),
        price_cents: 2000,
      },
      ExamCatalogItemView {
        id: "beta-hcg".to_string(),
        name: "Beta HCG Qualitativo".to_string(),
        category_id: "imunologia".to_string(),
        category_title: "Imunologia".to_string(),
        price_cents: 2000,
      },
    ])
  }

  async fn create_attendance(
    &self,
    input: CreateAttendanceInput,
  ) -> Result<PatientRecordEntryView, PatientRepositoryError> {
    let mut tx = self.pool.begin().await.map_err(map_sqlx_error)?;

    let patient_id = input.patient_id;
    let exam_date = input.exam_date;
    let status = normalize_text(input.status).unwrap_or_else(|| "waiting".to_string());
    let requester_id = normalize_text(input.requester_id);
    let procedure_type = normalize_text(input.procedure_type);
    let delivered_to = normalize_text(input.delivered_to);
    let notes = normalize_text(input.notes);

    let exam_row = sqlx::query(
      r#"
      INSERT INTO exams (patient_id, requester_id, exam_date, status, procedure_type, delivered_to, notes, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))
      RETURNING id, exam_date, status
      "#,
    )
    .bind(&patient_id)
    .bind(requester_id.as_deref())
    .bind(&exam_date)
    .bind(&status)
    .bind(procedure_type.as_deref())
    .bind(delivered_to.as_deref())
    .bind(notes.as_deref())
    .fetch_one(&mut *tx)
    .await
    .map_err(map_sqlx_error)?;

    let exam_id = exam_row.get::<String, _>("id");
    let created_exam_date = exam_row.get::<String, _>("exam_date");
    let created_status = exam_row.get::<String, _>("status");

    let requester_name = if let Some(requester_id_value) = requester_id.as_deref() {
      let requester_row = sqlx::query(
        r#"
        SELECT name
        FROM requesters
        WHERE id = ?1
        "#,
      )
      .bind(requester_id_value)
      .fetch_optional(&mut *tx)
      .await
      .map_err(map_sqlx_error)?;

      requester_row.map(|row| row.get::<String, _>("name"))
    } else {
      None
    };

    let mut items = Vec::with_capacity(input.items.len());
    for item in input.items {
      let item_row = sqlx::query(
        r#"
        INSERT INTO exam_items (exam_id, name, unit, method, reference_range, result_value, result_flag, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, NULL, NULL, datetime('now'), datetime('now'))
        RETURNING id, name, unit, method, reference_range, result_value, result_flag
        "#,
      )
      .bind(&exam_id)
      .bind(item.name)
      .bind(normalize_text(item.unit).as_deref())
      .bind(normalize_text(item.method).as_deref())
      .bind(normalize_text(item.reference_range).as_deref())
      .fetch_one(&mut *tx)
      .await
      .map_err(map_sqlx_error)?;

      items.push(PatientRecordExamItemView {
        exam_item_id: item_row.get::<String, _>("id"),
        name: item_row.get::<String, _>("name"),
        unit: item_row.get::<Option<String>, _>("unit"),
        method: item_row.get::<Option<String>, _>("method"),
        reference_range: item_row.get::<Option<String>, _>("reference_range"),
        result_value: item_row.get::<Option<String>, _>("result_value"),
        result_flag: item_row.get::<Option<String>, _>("result_flag"),
        report_available: false,
      });
    }

    tx.commit().await.map_err(map_sqlx_error)?;

    Ok(PatientRecordEntryView {
      exam_id,
      exam_date: created_exam_date,
      status: created_status,
      requester_name,
      items,
    })
  }

  async fn list_attendance_queue(
    &self,
    input: AttendanceQueueQueryInput,
  ) -> Result<Vec<AttendanceQueueItemView>, PatientRepositoryError> {
    let mut qb = QueryBuilder::<Sqlite>::new(
      r#"
      SELECT
        e.id AS attendance_id,
        e.patient_id AS patient_id,
        p.full_name AS patient_name,
        p.cpf AS patient_cpf,
        e.exam_date AS exam_date,
        e.status AS status,
        e.updated_at AS updated_at,
        ei.name AS exam_name
      FROM exams e
      JOIN patients p ON p.id = e.patient_id
      LEFT JOIN exam_items ei ON ei.exam_id = e.id
      WHERE 1 = 1
      "#,
    );

    if let Some(date) = input.date {
      let date = date.trim().to_string();
      if !date.is_empty() {
        qb.push(" AND e.exam_date = ");
        qb.push_bind(date);
      }
    }

    if let Some(status) = input.status {
      let status = status.trim().to_string();
      if !status.is_empty() {
        qb.push(" AND e.status = ");
        qb.push_bind(status);
      }
    }

    if let Some(query) = input.query {
      let query = query.trim().to_string();
      if !query.is_empty() {
        let like = format!("%{}%", query.to_lowercase());
        qb.push(
          " AND (lower(p.full_name) LIKE ",
        );
        qb.push_bind(like.clone());
        qb.push(" OR p.cpf LIKE ");
        qb.push_bind(like.clone());
        qb.push(" OR lower(e.id) LIKE ");
        qb.push_bind(like.clone());
        qb.push(" OR lower(coalesce(ei.name, '')) LIKE ");
        qb.push_bind(like);
        qb.push(")");
      }
    }

    qb.push(" ORDER BY e.exam_date DESC, e.created_at DESC, ei.created_at ASC");

    let rows = qb
      .build()
      .fetch_all(&self.pool)
      .await
      .map_err(map_sqlx_error)?;

    let mut entries: Vec<AttendanceQueueItemView> = Vec::new();
    let mut index_by_attendance_id: HashMap<String, usize> = HashMap::new();

    for row in rows {
      let attendance_id = row.get::<String, _>("attendance_id");
      let idx = if let Some(existing_idx) = index_by_attendance_id.get(&attendance_id) {
        *existing_idx
      } else {
        let created_idx = entries.len();
        index_by_attendance_id.insert(attendance_id.clone(), created_idx);
        entries.push(AttendanceQueueItemView {
          attendance_id,
          patient_id: row.get::<String, _>("patient_id"),
          patient_name: row.get::<String, _>("patient_name"),
          patient_cpf: row.get::<String, _>("patient_cpf"),
          exam_date: row.get::<String, _>("exam_date"),
          status: row.get::<String, _>("status"),
          exam_names: Vec::new(),
          updated_at: row.get::<String, _>("updated_at"),
        });
        created_idx
      };

      if let Ok(exam_name) = row.try_get::<String, _>("exam_name") {
        if !entries[idx].exam_names.iter().any(|value| value == &exam_name) {
          entries[idx].exam_names.push(exam_name);
        }
      }
    }

    Ok(entries)
  }

  async fn complete_attendance(
    &self,
    input: CompleteAttendanceInput,
  ) -> Result<AttendanceQueueItemView, PatientRepositoryError> {
    let updated = sqlx::query(
      r#"
      UPDATE exams
      SET status = 'completed', updated_at = datetime('now')
      WHERE id = ?1
      "#,
    )
    .bind(&input.attendance_id)
    .execute(&self.pool)
    .await
    .map_err(map_sqlx_error)?;

    if updated.rows_affected() == 0 {
      return Err(PatientRepositoryError::NotFound);
    }

    self.get_attendance_by_id(&input.attendance_id).await
  }
}

fn normalize_text(value: Option<String>) -> Option<String> {
  value.and_then(|raw| {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
      None
    } else {
      Some(trimmed.to_string())
    }
  })
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
