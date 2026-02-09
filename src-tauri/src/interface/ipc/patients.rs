use tauri::State;

use crate::{
  app::state::AppState,
  domain::patients::dto::{CreatePatientInput, PatientView},
};

#[tauri::command]
pub async fn create_patient(
  state: State<'_, AppState>,
  input: CreatePatientInput,
) -> Result<PatientView, String> {
  state
    .create_patient_use_case
    .execute(input)
    .await
    .map_err(|e| format!("{e:?}"))
}
