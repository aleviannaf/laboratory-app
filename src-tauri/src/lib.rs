pub mod app;
pub mod application;
pub mod domain;
pub mod infra;
pub mod interface;

use tauri::Manager;

use crate::app::compose::compose;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .setup(|app| -> Result<(), Box<dyn std::error::Error>> {
      let data_dir = app.path().app_data_dir()?;
      std::fs::create_dir_all(&data_dir)?;

      let db_path = data_dir.join("laboratory.sqlite");

 
      let state = tauri::async_runtime::block_on(async {
        compose(db_path.to_string_lossy().as_ref()).await
      })
      .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, format!("{e:?}")))?;

      app.manage(state);

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      interface::ipc::patients::create_patient,
      interface::ipc::patients::list_patients,
      interface::ipc::patient_records::get_patient_record,
      interface::ipc::patient_records::list_exam_catalog,
      interface::ipc::patient_records::create_attendance,
      interface::ipc::patient_records::list_attendance_queue,
      interface::ipc::patient_records::complete_attendance
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
