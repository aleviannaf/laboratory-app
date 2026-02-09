use super::errors::PatientDomainError;

#[derive(Debug, Clone)]
pub struct Patient {
  pub id: String,
  pub full_name: String,
  pub birth_date: String,
  pub sex: String,
  pub phone: String,
  pub address: String,
  pub created_at: String,
  pub updated_at: String,
}

impl Patient {
  pub fn new(
    id: String,
    full_name: String,
    birth_date: String,
    sex: String,
    phone: String,
    address: String,
    created_at: String,
    updated_at: String,
  ) -> Result<Self, PatientDomainError> {
    if full_name.trim().is_empty() {
      return Err(PatientDomainError::FullNameRequired);
    }

    Ok(Self {
      id,
      full_name,
      birth_date,
      sex,
      phone,
      address,
      created_at,
      updated_at,
    })
  }
}
