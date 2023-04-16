#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use serde_json::Value;
use std::process;
use tauri::{
    api::notification::Notification, CustomMenuItem, Manager, State, SystemTray, SystemTrayEvent,
    SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_autostart::MacosLauncher;

mod dsl;
mod script_core;
mod windows;

use crate::windows::win::is_app_elevated;
use script_core::{MacroMode, StateCore};

#[tauri::command]
fn start_launcher(state_core: State<'_, StateCore>) -> bool {
    state_core.start_launcher();

    return true;
}

#[tauri::command]
fn stop_launcher(state_core: State<'_, StateCore>) -> bool {
    state_core.stop_launcher();

    return true;
}

#[tauri::command]
fn change_delay(state_core: State<'_, StateCore>, invoke_message: i64) {
    state_core.set_delay(&invoke_message);
}

#[tauri::command]
fn change_mode(state_core: State<'_, StateCore>, invoke_message: String) {
    state_core.set_mode(&invoke_message);
}

#[tauri::command]
fn change_key(state_core: State<'_, StateCore>, invoke_message: String) {
    state_core.set_key(&invoke_message);
}

#[tauri::command]
fn change_key_type(state_core: State<'_, StateCore>, invoke_message: String) {
    state_core.set_key_type(&invoke_message);
}

#[tauri::command]
fn show_notification(app_handle: tauri::AppHandle, invoke_message: String) {
    let v: Value = serde_json::from_str(&invoke_message).unwrap_or(serde_json::Value::Null);
    let notification = Notification::new(&app_handle.config().tauri.bundle.identifier)
        .body(v.get("body").and_then(|value| value.as_str()).unwrap_or(""));

    // if has a title property assign it to the notification and then show it
    // otherwise directly show it
    if v.as_object()
        .and_then(|x| Some(x.contains_key("title")))
        .unwrap_or(false)
    {
        notification
            .title(
                v.get("title")
                    .and_then(|value| value.as_str())
                    .unwrap_or(""),
            )
            .show()
            .unwrap();
    } else {
        notification.show().unwrap();
    }
}

#[tauri::command]
async fn open_updater_on_mount(window: tauri::Window) {
    if let Some(update_screen) = window.get_window("updatescreen") {
        update_screen.show().unwrap();
    }
}

#[tauri::command]
async fn close_updater_and_open_main(window: tauri::Window, app_handle: tauri::AppHandle) {
    // Close update screen
    if let Some(update_screen) = window.get_window("updatescreen") {
        update_screen.close().unwrap();
    }
    // Show main window
    if let Some(main_window) = window.get_window("main") {
        main_window.show().unwrap();
    }
    // activate shortcut to main screen
    app_handle.emit_all("activate_shortcuts", true).unwrap();
}

#[tauri::command]
fn start_stop_global_shortcut_pressed(
    state_core: State<'_, StateCore>,
    app_handle: tauri::AppHandle,
    invoke_message: bool,
) {
    let is_running_ref = state_core.is_program_running.borrow();
    let is_mode_ref = state_core.mode.borrow();
    let is_delay_ref = state_core.delay_for_notifications.borrow();

    let is_running = *is_running_ref;
    let is_mode = match *is_mode_ref {
        MacroMode::Timer => "withTimer",
        MacroMode::Toggle => "withToggle",
    };
    let is_delay = is_delay_ref.clone();

    drop(is_running_ref);
    drop(is_mode_ref);
    drop(is_delay_ref);

    let data = serde_json::json!({
        "isRunning": is_running,
        "isMode": is_mode,
        "isDelay": is_delay,
    });

    app_handle.emit_all("start_stop_event", data).unwrap();
}

#[tauri::command]
fn global_shortcut_register(app_handle: tauri::AppHandle, invoke_message: bool) {
    app_handle
        .emit_all("global_shortcut_register", true)
        .unwrap();
}

#[tauri::command]
fn administation_notification(app_handle: tauri::AppHandle, invoke_message: String) {
    let v: Value = serde_json::from_str(&invoke_message).unwrap_or(serde_json::Value::Null);

    if !is_app_elevated() {
        Notification::new(&app_handle.config().tauri.bundle.identifier)
            .title(
                v.get("title")
                    .and_then(|value| value.as_str())
                    .unwrap_or(""),
            )
            .body(v.get("body").and_then(|value| value.as_str()).unwrap_or(""))
            .show()
            .unwrap();
    }
}

fn main() {
    // App Tray Construction
    let clickovski_label = CustomMenuItem::new("clickovski".to_string(), "Clickovski").disabled();
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let settings = CustomMenuItem::new("settings".to_string(), "Settings");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let tray_menu = SystemTrayMenu::new()
        .add_item(clickovski_label)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide)
        .add_item(settings)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    let system_tray = SystemTray::new().with_menu(tray_menu);

    let builder = tauri::Builder::default();
    builder
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            start_launcher,
            stop_launcher,
            change_delay,
            change_mode,
            change_key,
            change_key_type,
            show_notification,
            close_updater_and_open_main,
            open_updater_on_mount,
            start_stop_global_shortcut_pressed,
            global_shortcut_register,
            administation_notification,
        ])
        .setup(|app| {
            app.manage(StateCore::new());

            Ok(())
        })
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let item_handle = app.tray_handle().get_item(&"hide");

                if !app
                    .get_window("main")
                    .as_ref()
                    .and_then(|x| Some(x.windows().contains_key("updatescreen")))
                    .unwrap_or(true)
                {
                    let window = app.get_window("main").unwrap();
                    if !window.is_visible().unwrap() {
                        window.show().unwrap();
                        item_handle.set_title("Hide").unwrap();
                        window.set_focus().unwrap();
                    }
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                let item_handle = app.tray_handle().get_item(&id);
                match id.as_str() {
                    "hide" => {
                        if !app
                            .get_window("main")
                            .as_ref()
                            .and_then(|x| Some(x.windows().contains_key("updatescreen")))
                            .unwrap_or(true)
                        {
                            let window = app.get_window("main").unwrap();

                            if !window.is_visible().unwrap() {
                                window.show().unwrap();
                                item_handle.set_title("Hide").unwrap();
                                window.set_focus().unwrap();
                            } else {
                                window.hide().unwrap();
                                // you can also `set_selected`, `set_enabled` and `set_native_image` (macOS only).
                                item_handle.set_title("Show").unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                    }
                    "settings" => {
                        if !app
                            .get_window("main")
                            .as_ref()
                            .and_then(|x| Some(x.windows().contains_key("updatescreen")))
                            .unwrap_or(true)
                        {
                            let window = app.get_window("main").unwrap();

                            if !window.is_visible().unwrap() {
                                window.show().unwrap();

                                app.tray_handle()
                                    .get_item(&"hide")
                                    .set_title("Hide")
                                    .unwrap();
                            }
                            window.set_focus().unwrap();

                            window.emit("routeSettings", true).unwrap();
                        }
                    }
                    "quit" => {
                        process::exit(0);
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .system_tray(system_tray)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
