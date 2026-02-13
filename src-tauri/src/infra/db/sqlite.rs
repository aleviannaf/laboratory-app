use sqlx::{
  sqlite::{SqliteConnectOptions, SqlitePoolOptions},
  SqlitePool,
};
use std::{path::Path, time::Duration};

pub async fn create_sqlite_pool(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
  let options = SqliteConnectOptions::new()
    .filename(Path::new(db_path))
    .create_if_missing(true);

  SqlitePoolOptions::new()
    .max_connections(5)
    .acquire_timeout(Duration::from_secs(10))
    .connect_with(options)
    .await
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
  sqlx::migrate!("src/infra/db/migrations").run(pool).await?;
  Ok(())
}
