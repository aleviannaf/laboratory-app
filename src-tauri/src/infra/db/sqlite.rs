use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::{path::Path, time::Duration};

pub async fn create_sqlite_pool(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
  let db_url = format!(
    "sqlite://{}",
    Path::new(db_path).to_string_lossy().replace('\\', "/")
  );

  SqlitePoolOptions::new()
    .max_connections(5)
    .acquire_timeout(Duration::from_secs(10))
    .connect(&db_url)
    .await
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
  sqlx::migrate!("src/infra/db/migrations").run(pool).await?;
  Ok(())
}
