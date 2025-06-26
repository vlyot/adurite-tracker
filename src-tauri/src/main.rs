#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{App, Manager, Wry};
use reqwest;

#[tauri::command]
async fn get_rolimon_items() -> Result<String, String> {
    let url = "https://api.rolimons.com/items/v1/itemdetails";

    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .header("User-Agent", "Mozilla/5.0 (Tauri)")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch: {}", response.status()));
    }

    let body = response.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}


fn main() {
    tauri::Builder::<Wry>::default()
        .setup(|_app: &mut App<Wry>| Ok(()))
        .invoke_handler(tauri::generate_handler![get_rolimon_items])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
