#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PatientDomainError {
  FullNameRequired,
  CpfRequired,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PatientRepositoryError {
 
  PersistenceError,

  NotFound,

  Conflict,
}
