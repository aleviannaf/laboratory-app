#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PatientDomainError {
  FullNameRequired,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PatientRepositoryError {
 
  PersistenceError,

  NotFound,

  Conflict,
}
