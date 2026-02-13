use std::sync::Arc;

use crate::application::patients::{
  create_patient::CreatePatientUseCase, list_patients::ListPatientsUseCase,
};

#[derive(Clone)]
pub struct AppState {
  pub create_patient_use_case: Arc<CreatePatientUseCase>,
  pub list_patients_use_case: Arc<ListPatientsUseCase>,
}
