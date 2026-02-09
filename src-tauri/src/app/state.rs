use std::sync::Arc;

use crate::application::patients::create_patient::CreatePatientUseCase;

#[derive(Clone)]
pub struct AppState {
  pub create_patient_use_case: Arc<CreatePatientUseCase>,
}
