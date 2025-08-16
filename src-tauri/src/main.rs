#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use serde_json::Value;
use tauri::{
    menu::{IconMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, State,
};
use tauri_plugin_notification::NotificationExt;

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
fn change_key_type(state_core: State<StateCore>, invoke_message: String) {
    state_core.set_key_type(&invoke_message);
}

#[tauri::command]
fn show_notification(app_handle: tauri::AppHandle, invoke_message: String) {
    let v: Value = serde_json::from_str(&invoke_message).unwrap_or(serde_json::Value::Null);
    let notification = app_handle
        .notification()
        .builder()
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
    if let Some(update_screen) = window.get_webview_window("updatescreen") {
        update_screen.show().unwrap();
    }
}

#[tauri::command]
async fn close_updater_and_open_main(window: tauri::Window, app_handle: tauri::AppHandle) {
    // Close update screen
    if let Some(update_screen) = window.get_webview_window("updatescreen") {
        update_screen.close().unwrap();
    }
    // Show main window
    if let Some(main_window) = window.get_webview_window("main") {
        main_window.show().unwrap();
    }
    // activate shortcut to main screen
    app_handle.emit("activate_shortcuts", true).unwrap();
}

fn start_stop_global_shortcut_func(state_core: &StateCore, app_handle: &tauri::AppHandle) {
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

    app_handle.emit("start_stop_event", data).unwrap();
}

#[tauri::command]
fn start_stop_global_shortcut_pressed(
    state_core: State<StateCore>,
    app_handle: tauri::AppHandle,
    // invoke_message: bool,
) {
    start_stop_global_shortcut_func(state_core.inner(), &app_handle);
}

#[tauri::command]
fn global_shortcut_register(app_handle: tauri::AppHandle /*invoke_message: bool*/) {
    app_handle.emit("global_shortcut_register", true).unwrap();
}

#[tauri::command]
fn administation_notification(app_handle: tauri::AppHandle, invoke_message: String) {
    let v: Value = serde_json::from_str(&invoke_message).unwrap_or(serde_json::Value::Null);

    if !is_app_elevated() {
        app_handle
            .notification()
            .builder()
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
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_zustand::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None, // Some(vec!["--flag1", "--flag2"]),
        ));

        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }));
    }

    builder
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

            // App Tray Construction
            let clickovski_label = IconMenuItem::with_id(
                app,
                "clickovski".to_string(),
                "Clickovski",
                false,
                Some(app.default_window_icon().unwrap().clone()),
                None::<&str>,
            )?;
            let hide = MenuItem::with_id(app, "hide".to_string(), "Hide", true, None::<&str>)?;
            let hide_clone = hide.clone();
            let hide_clone2 = hide.clone();
            let settings =
                MenuItem::with_id(app, "settings".to_string(), "Settings", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit".to_string(), "Quit", true, None::<&str>)?;
            let seperator = PredefinedMenuItem::separator(app)?;
            let tray_menu = Menu::with_items(
                app,
                &[
                    &clickovski_label,
                    &seperator,
                    &hide,
                    &settings,
                    &seperator,
                    &quit,
                ],
            )?;

            let tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .build(app)?;

            tray.on_menu_event(move |app, event| match event.id.as_ref() {
                "hide" => {
                    if !app
                        .get_webview_window("main")
                        .as_ref()
                        .and_then(|x| Some(x.webview_windows().contains_key("updatescreen")))
                        .unwrap_or(true)
                    {
                        // if the main window is not visible, show it
                        let window = app.get_webview_window("main").unwrap();
                        if !window.is_visible().unwrap() {
                            window.show().unwrap();
                            window.center().unwrap();
                            hide_clone.set_text("Hide").unwrap();
                            window.set_focus().unwrap();
                        } else {
                            window.hide().unwrap();
                            hide_clone.set_text("Show").unwrap();
                        }
                    }
                }
                "settings" => {
                    if !app
                        .get_webview_window("main")
                        .as_ref()
                        .and_then(|x| Some(x.webview_windows().contains_key("updatescreen")))
                        .unwrap_or(true)
                    {
                        if let Some(window) = app.get_webview_window("main") {
                            if !window.is_visible().unwrap() {
                                window.show().unwrap();
                                window.center().unwrap();
                                hide_clone.set_text("Hide").unwrap();
                            }
                            window.set_focus().unwrap();
                            window.emit("routeSettings", true).unwrap();
                        }
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            });

            tray.on_tray_icon_event(move |tray, event| match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    let app = tray.app_handle();

                    if !app
                        .get_webview_window("main")
                        .as_ref()
                        .and_then(|x| Some(x.webview_windows().contains_key("updatescreen")))
                        .unwrap_or(true)
                    {
                        let window = app.get_webview_window("main").unwrap();
                        if !window.is_visible().unwrap() {
                            window.show().unwrap();
                            hide_clone2.set_text("Hide").unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                }
                _ => {}
            });

            use tauri_plugin_zustand::ManagerExt;

            // Register global shortcut on start-up
            let value = app.zustand().try_get_or(
                "launcher-storage",
                "isGlobalShortcut",
                String::from("Alt+S"),
            );

            #[cfg(desktop)]
            {
                use std::str::FromStr;
                use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

                let global_start_stop = Shortcut::from_str(&value)
                    .unwrap_or(Shortcut::new(Some(Modifiers::ALT), Code::KeyS));

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app_handle, shortcut, event| {
                            if shortcut == &global_start_stop {
                                match event.state() {
                                    ShortcutState::Pressed => {
                                        let state_core = app_handle.state::<StateCore>();

                                        start_stop_global_shortcut_func(
                                            state_core.inner(),
                                            app_handle,
                                        );
                                    }
                                    ShortcutState::Released => {}
                                }
                            }
                        })
                        .with_shortcut(global_start_stop)?
                        .build(),
                )?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
