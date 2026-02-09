#[derive(Debug)]
pub enum AppError {
  Validation(String),
  Database(String),
  Unexpected(String),
}
