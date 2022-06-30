#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use serde_json::{Result, Value};
use std::process;
use tauri::{
    api::notification::Notification, CustomMenuItem, Manager, Menu, State, SystemTray,
    SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_autostart::MacosLauncher;

mod script_core;
use script_core::StateCore;

#[tauri::command]
fn start_launcher(state_core: State<'_, StateCore>) -> bool {
    // let v: Value = serde_json::from_str(&invoke_message).unwrap();
    state_core.startLauncher();

    return true;
}

#[tauri::command]
fn stop_launcher(state_core: State<'_, StateCore>) -> bool {
    state_core.stopLauncher();

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
fn show_notification(
    state_core: State<'_, StateCore>,
    app_handle: tauri::AppHandle,
    invoke_message: String,
) {
    let v: Value = serde_json::from_str(&invoke_message).unwrap();
    let notification = Notification::new(&app_handle.config().tauri.bundle.identifier)
        .body(v.get("body").and_then(|value| value.as_str()).unwrap());
    if v.as_object().unwrap().contains_key("title") {
        notification
            .title(v.get("title").and_then(|value| value.as_str()).unwrap())
            .show();
    } else {
        notification.show();
    }
}

#[tauri::command]
async fn close_updater_and_open_main(window: tauri::Window) {
    // Close update screen
    if let Some(update_screen) = window.get_window("updatescreen") {
        update_screen.close().unwrap();
    }
    // Show main window
    window.get_window("main").unwrap().show().unwrap();
    // activate shortcut to main screen
    window
        .get_window("main")
        .unwrap()
        .emit("activate_shortcuts", true);
}

#[tauri::command]
fn start_stop_global_shortcut_pressed(
    state_core: State<'_, StateCore>,
    app_handle: tauri::AppHandle,
    invoke_message: bool,
) {
    let data = serde_json::json!({
        "isRunning": *state_core.is_program_running.borrow(),
        "isMode": &*state_core.mode.borrow(),
        "isDelay":&*state_core.delay_for_notifications.borrow(),
    });

    app_handle.emit_all("start_stop_event", data);
}

#[tauri::command]
fn global_shortcut_register(app_handle: tauri::AppHandle, invoke_message: bool) {
    app_handle.emit_all("global_shortcut_register", true);
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
        .manage(StateCore::new())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            false,
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
            start_stop_global_shortcut_pressed,
            global_shortcut_register,
        ])
        .setup(|app| Ok(()))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                let item_handle = app.tray_handle().get_item(&"hide");

                if !window.windows().contains_key("updatescreen") {
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
                        let window = app.get_window("main").unwrap();

                        if !window.windows().contains_key("updatescreen") {
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
                        let window = app.get_window("main").unwrap();

                        if !window.windows().contains_key("updatescreen") {
                            if !window.is_visible().unwrap() {
                                window.show().unwrap();

                                app.tray_handle()
                                    .get_item(&"hide")
                                    .set_title("Hide")
                                    .unwrap();
                            }
                            window.set_focus().unwrap();

                            window.emit("routeSettings", true);
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

// pub fn listenerBuilder<
//   F: Fn(tauri::Event, &StateCore) -> () + Send + 'static + std::marker::Sync,
// >(
//   app: &mut tauri::App,
//   state_coree: &StateCore,
//   eventName: &str,
//   f: F,
// ) -> tauri::EventHandler {
//   let mut state_core_cloned = state_coree.clone();
//   app.listen_global(eventName, move |event| f(event, &state_core_cloned))
// }

// let start_listener_id = listenerBuilder(
//   app,
//   &state_core,
//   &"start",
//   move |event: tauri::Event, state_coree: &StateCore| {
//     let mut state_core_cloned = &mut state_coree.clone();
//     state_core_cloned.startLauncher(200);
//     println!("start event received {:?}", event.payload());
//   },
// );
