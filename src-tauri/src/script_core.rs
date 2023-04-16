use std::{
    cell::RefCell,
    sync::{
        mpsc::{channel, Receiver, Sender, TryRecvError},
        Arc, Mutex, MutexGuard,
    },
    thread,
    time::{Duration, Instant},
};

use serde::{Deserialize, Serialize};

use crate::dsl::{tokenize, ParseError, Token};
use enigo::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MacroMode {
    Timer,
    Toggle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KeyType {
    Mouse,
    Keyboard,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ToggleType {
    Up,
    Down,
    Press,
}

#[derive(Debug)]
pub struct StateCore {
    pub key: RefCell<Arc<Mutex<String>>>,
    pub key_type: RefCell<Arc<Mutex<KeyType>>>,
    pub mode: RefCell<MacroMode>,
    pub delay_for_notifications: RefCell<String>,
    pub is_program_running: RefCell<bool>,
    pub channel_sender: RefCell<Sender<bool>>,
    pub channel_reciever: RefCell<Arc<Mutex<Receiver<bool>>>>,
    pub date: Instant,
    pub enigo_engine: RefCell<Arc<Mutex<Enigo>>>,
}

unsafe impl std::marker::Sync for StateCore {}

impl StateCore {
    pub fn new() -> StateCore {
        let (sender, receiver): (Sender<bool>, Receiver<bool>) = channel();
        return StateCore {
            key: RefCell::new(Arc::new(Mutex::new(String::from("Left")))),
            key_type: RefCell::new(Arc::new(Mutex::new(KeyType::Mouse))),
            mode: RefCell::new(MacroMode::Timer),
            delay_for_notifications: RefCell::new(String::from("200")),
            is_program_running: RefCell::new(false),
            date: Instant::now(),
            channel_sender: RefCell::new(sender),
            channel_reciever: RefCell::new(Arc::new(Mutex::new(receiver))),
            enigo_engine: RefCell::new(Arc::new(Mutex::new(Enigo::new()))),
        };
    }

    pub fn start_launcher(&self) {
        self.state_change(true);

        let mode_barrow = self.mode.borrow();
        let mode = mode_barrow.clone();
        drop(mode_barrow);

        match mode {
            MacroMode::Timer => {
                let delay_borrow = self.delay_for_notifications.borrow();
                let delay = delay_borrow.parse::<u64>().unwrap_or(100);
                drop(delay_borrow);

                self.set_interval(delay);
            }
            MacroMode::Toggle => {
                let key_type_barrow = self.key_type.borrow();
                let key_type = key_type_barrow.lock().unwrap().clone();
                drop(key_type_barrow);

                match key_type {
                    KeyType::Mouse => {
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
                    }
                    KeyType::Keyboard => {
                        eval_toggle(
                            &mut self.enigo_engine.borrow().clone().lock().unwrap(),
                            self.key.borrow().clone().lock().unwrap().as_str(),
                            &ToggleType::Down,
                        )
                        .unwrap();
                    }
                }
            }
        }
    }

    pub fn stop_launcher(&self) {
        self.state_change(false);

        let mode_barrow = self.mode.borrow();
        let mode = mode_barrow.clone();
        drop(mode_barrow);

        match mode {
            MacroMode::Timer => {
                self.channel_sender.borrow().send(false).unwrap();
            }
            MacroMode::Toggle => {
                let key_type_barrow = self.key_type.borrow();
                let key_type = key_type_barrow.lock().unwrap().clone();
                drop(key_type_barrow);

                match key_type {
                    KeyType::Mouse => {
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
                    }
                    KeyType::Keyboard => {
                        eval_toggle(
                            &mut self.enigo_engine.borrow().clone().lock().unwrap(),
                            self.key.borrow().clone().lock().unwrap().as_str(),
                            &ToggleType::Up,
                        )
                        .unwrap();
                    }
                }
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
        match mode.as_str() {
            "withToggle" => {
                *self.mode.borrow_mut() = MacroMode::Toggle;
            }
            _ | "withTimer" => {
                *self.mode.borrow_mut() = MacroMode::Timer;
            }
        }
    }

    pub fn set_key(&self, key: &str) {
        *self.key.borrow_mut() = Arc::new(Mutex::new(key.to_string()));
    }

    pub fn set_key_type(&self, key_type: &String) {
        match key_type.as_str() {
            "Keyboard" => {
                *self.key_type.borrow_mut() = Arc::new(Mutex::new(KeyType::Keyboard));
            }
            _ | "Mouse" => {
                *self.key_type.borrow_mut() = Arc::new(Mutex::new(KeyType::Mouse));
            }
        }
    }

    fn set_interval(&self, delay: u64) {
        let receiver = self.channel_reciever.borrow().clone();
        let enigo_engine = self.enigo_engine.borrow().clone();
        let wait_time = Duration::from_millis(delay);
        let key_type_state = self.key_type.borrow().clone();
        let key_state = self.key.borrow().clone();

        thread::spawn(move || loop {
            match receiver.lock().unwrap().try_recv() {
                Ok(_) | Err(TryRecvError::Disconnected) => {
                    println!("Terminating... {:?}", thread::current().id());
                    break;
                }
                Err(TryRecvError::Empty) => {
                    // Silencly continue;
                }
            }

            let start = Instant::now();

            let engine_mutex_copy = &mut enigo_engine.lock().unwrap();
            let key_state_copy = &*key_state.lock().unwrap();
            let key_type_state_copy = &*key_type_state.lock().unwrap();

            match key_type_state_copy {
                KeyType::Mouse => {
                    if key_state_copy == "left" {
                        engine_mutex_copy.mouse_click(MouseButton::Left);
                    } else if key_state_copy == "right" {
                        engine_mutex_copy.mouse_click(MouseButton::Right);
                    } else if key_state_copy == "middle" {
                        engine_mutex_copy.mouse_click(MouseButton::Middle);
                    }
                }
                KeyType::Keyboard => {
                    eval(engine_mutex_copy, key_state_copy).unwrap();
                }
            }

            let runtime = start.elapsed();
            if let Some(remaining) = wait_time.checked_sub(runtime) {
                thread::sleep(remaining);
            }
        });
    }
}

fn eval(enigo_engine: &mut MutexGuard<'_, Enigo>, input: &str) -> Result<(), ParseError> {
    for token in tokenize(input)? {
        match token {
            Token::Sequence(buffer) => {
                for key in buffer.chars() {
                    enigo_engine.key_click(Key::Layout(key));
                }
            }
            Token::Unicode(buffer) => enigo_engine.key_sequence(&buffer),
            Token::KeyUp(key) => enigo_engine.key_up(key),
            Token::KeyDown(key) => enigo_engine.key_down(key),
        }
    }
    Ok(())
}

fn eval_toggle(
    enigo_engine: &mut MutexGuard<'_, Enigo>,
    input: &str,
    toggle_type: &ToggleType,
) -> Result<(), ParseError> {
    for token in tokenize(input)?.iter().filter(|x| {
        match toggle_type {
            ToggleType::Up => {
                match *x {
                    Token::KeyUp(_) | Token::Sequence(_) | Token::Unicode(_) => true,

                    //KeyDown tokens wont pass through
                    Token::KeyDown(_) => false,
                }
            }
            ToggleType::Down => {
                match *x {
                    Token::Sequence(_) | Token::Unicode(_) | Token::KeyDown(_) => true,

                    //KeyUp tokens wont pass through
                    Token::KeyUp(_) => false,
                }
            }
            // Can pass anything without keyUp and KeyDown tokens
            _ => true,
        }
    }) {
        // println!("{:?}", token);
        match token {
            Token::Sequence(buffer) => {
                for key in buffer.chars() {
                    enigo_engine.key_click(Key::Layout(key));
                }
            }
            Token::Unicode(buffer) => enigo_engine.key_sequence(&buffer),
            Token::KeyUp(key) => enigo_engine.key_up(*key),
            Token::KeyDown(key) => enigo_engine.key_down(*key),
        }
    }
    Ok(())
}
