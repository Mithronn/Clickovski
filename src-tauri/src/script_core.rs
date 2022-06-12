use std::{
    cell::RefCell,
    sync::{
        mpsc::{channel, Receiver, Sender, TryRecvError},
        Arc, Mutex,
    },
    thread,
    time::{Duration, Instant},
};
use tauri::api::notification::Notification;

use enigo::*;

// #[derive(Debug)]
// #[cfg_attr(feature = "with_serde", derive(Serialize, Deserialize))]
#[derive(Debug)]
pub struct StateCore {
    pub key: RefCell<Arc<Mutex<String>>>,
    pub key_type: RefCell<Arc<Mutex<String>>>,
    pub mode: RefCell<String>,
    pub delay_for_notifications: RefCell<String>,
    pub is_program_running: RefCell<bool>,
    pub channel_sender: RefCell<Sender<bool>>,
    pub channel_reciever: RefCell<Arc<Mutex<Receiver<bool>>>>,
    pub date: Instant,
    pub enigo_engine: RefCell<Arc<Mutex<Enigo>>>,
    pub notification: Notification,
    pub notification_identifier: RefCell<String>,
}

unsafe impl std::marker::Sync for StateCore {}

impl StateCore {
    pub fn new() -> StateCore {
        let (sender, receiver): (Sender<bool>, Receiver<bool>) = channel();
        return StateCore {
            key: RefCell::new(Arc::new(Mutex::new(String::from("Left")))),
            key_type: RefCell::new(Arc::new(Mutex::new(String::from("Mouse")))),
            mode: RefCell::new(String::from("withTimer")),
            delay_for_notifications: RefCell::new(String::from("200")),
            is_program_running: RefCell::new(false),
            date: Instant::now(),
            channel_sender: RefCell::new(sender),
            channel_reciever: RefCell::new(Arc::new(Mutex::new(receiver))),
            enigo_engine: RefCell::new(Arc::new(Mutex::new(Enigo::new()))),
            notification: Notification::new(""),
            notification_identifier: RefCell::new(String::from("")),
        };
    }

    pub fn startLauncher(&self) {
        self.state_change(true);

        if *self.mode.borrow() == "withTimer" {
            println!("{:?}", Key::Raw(0x38));
            self.setInterval(&self.delay_for_notifications.borrow().parse().unwrap());
        } else if *self.mode.borrow() == "withToggle" {
            // let engine_mutex = self.enigo_engine.borrow().clone().lock().unwrap();
            // let key_type_state = &*self.key_type.borrow().clone().lock().unwrap();
            // let key_state = &*self.key.borrow().clone().lock().unwrap();

            if &*self.key_type.borrow().clone().lock().unwrap() == "Mouse" {
                if &*self.key.borrow().clone().lock().unwrap() == "left" {
                    self.enigo_engine
                        .borrow()
                        .clone()
                        .lock()
                        .unwrap()
                        .mouse_down(MouseButton::Left);
                } else if &*self.key.borrow().clone().lock().unwrap() == "right" {
                    self.enigo_engine
                        .borrow()
                        .clone()
                        .lock()
                        .unwrap()
                        .mouse_down(MouseButton::Right);
                } else if &*self.key.borrow().clone().lock().unwrap() == "middle" {
                    self.enigo_engine
                        .borrow()
                        .clone()
                        .lock()
                        .unwrap()
                        .mouse_down(MouseButton::Middle);
                }
            } else if &*self.key_type.borrow().clone().lock().unwrap() == "Keyboard" {
                // engine_mutex.key_sequence_parse(&*self.key.borrow().clone().lock().unwrap());
            }
        }
    }

    pub fn stopLauncher(&self) {
        self.state_change(false);

        if *self.mode.borrow() == "withTimer" {
            self.channel_sender.borrow().send(false);
        } else if *self.mode.borrow() == "withToggle" {
            if &*self.key_type.borrow().clone().lock().unwrap() == "Mouse" {
                if &*self.key.borrow().clone().lock().unwrap() == "left" {
                    self.enigo_engine
                        .borrow()
                        .clone()
                        .lock()
                        .unwrap()
                        .mouse_up(MouseButton::Left);
                } else if &*self.key.borrow().clone().lock().unwrap() == "right" {
                    self.enigo_engine
                        .borrow()
                        .clone()
                        .lock()
                        .unwrap()
                        .mouse_up(MouseButton::Right);
                } else if &*self.key.borrow().clone().lock().unwrap() == "middle" {
                    self.enigo_engine
                        .borrow()
                        .clone()
                        .lock()
                        .unwrap()
                        .mouse_up(MouseButton::Middle);
                }
            } else if &*self.key_type.borrow().clone().lock().unwrap() == "Keyboard" {
                // engine_mutex.key_sequence_parse(&*self.key.borrow().clone().lock().unwrap());
            }
        }
    }

    pub fn state_change(&self, state: bool) {
        *self.is_program_running.borrow_mut() = state;
    }

    pub fn set_delay(&self, delay: &i64) {
        *self.delay_for_notifications.borrow_mut() = delay.to_string();
    }

    pub fn set_mode(&self, mode: &String) {
        *self.mode.borrow_mut() = mode.to_string();
    }

    pub fn set_key(&self, key: &str) {
        // TODO key integer to find key or find some better solution
        *self.key.borrow_mut() = Arc::new(Mutex::new(key.to_string()));
    }

    pub fn set_key_type(&self, key_type: &String) {
        *self.key_type.borrow_mut() = Arc::new(Mutex::new(key_type.to_string()));
    }

    fn setInterval(
        &self,
        // f: F,
        delay: &u64,
    ) {
        let receiver = self.channel_reciever.borrow().clone();
        let enigoEngine = self.enigo_engine.borrow().clone();
        let wait_time = Duration::from_millis(*delay);
        let key_type_state = self.key_type.borrow().clone();
        let key_state = self.key.borrow().clone();

        thread::spawn(move || loop {
            match receiver.lock().unwrap().try_recv() {
                Ok(_) | Err(TryRecvError::Disconnected) => {
                    // println!("{:?}", receiver.lock().unwrap().try_recv());
                    println!("Terminating. {:?}", thread::current().id());
                    break;
                }
                Err(TryRecvError::Empty) => {
                    // Silencly continue;
                }
            }

            let start = Instant::now();

            let engine_mutex_copy = &mut enigoEngine.lock().unwrap();
            let key_state_copy = &*key_state.lock().unwrap();
            let key_type_state_copy = &*key_type_state.lock().unwrap();
            if key_type_state_copy == "Mouse" {
                if key_state_copy == "left" {
                    engine_mutex_copy.mouse_click(MouseButton::Left);
                } else if key_state_copy == "right" {
                    engine_mutex_copy.mouse_click(MouseButton::Right);
                } else if key_state_copy == "middle" {
                    engine_mutex_copy.mouse_click(MouseButton::Middle);
                }
            } else if key_type_state_copy == "Keyboard" {
                engine_mutex_copy.key_sequence_parse(key_state_copy);
            }
            // println!("started {}", Instant::now().elapsed().as_micros());

            let runtime = start.elapsed();
            if let Some(remaining) = wait_time.checked_sub(runtime) {
                thread::sleep(remaining);
            }
        });
    }
}
