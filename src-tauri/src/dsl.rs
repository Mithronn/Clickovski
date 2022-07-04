use enigo::Key;
use std::error::Error;
use std::fmt;

/// An error that can occur when parsing DSL
#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    /// When a tag doesn't exist.
    /// Example: {+TEST}{-TEST}
    ///            ^^^^   ^^^^
    UnknownTag(String),

    /// When a { is encountered inside a {TAG}.
    /// Example: {+HELLO{WORLD}
    ///                 ^
    UnexpectedOpen,

    /// When a { is never matched with a }.
    /// Example: {+SHIFT}Hello{-SHIFT
    ///                              ^
    UnmatchedOpen,

    /// Opposite of UnmatchedOpen.
    /// Example: +SHIFT}Hello{-SHIFT}
    ///         ^
    UnmatchedClose,
}
impl Error for ParseError {
    fn description(&self) -> &str {
        match *self {
            ParseError::UnknownTag(_) => "Unknown tag",
            ParseError::UnexpectedOpen => "Unescaped open bracket ({) found inside tag name",
            ParseError::UnmatchedOpen => "Unmatched open bracket ({). No matching close (})",
            ParseError::UnmatchedClose => "Unmatched close bracket (}). No previous open ({)",
        }
    }
}
impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.description())
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum Token {
    Sequence(String),
    Unicode(String),
    KeyUp(Key),
    KeyDown(Key),
}

pub fn tokenize(input: &str) -> Result<Vec<Token>, ParseError> {
    let mut unicode = false;

    let mut tokens = Vec::new();
    let mut buffer = String::new();
    let mut iter = input.chars().peekable();

    fn flush(tokens: &mut Vec<Token>, buffer: String, unicode: bool) {
        if !buffer.is_empty() {
            if unicode {
                tokens.push(Token::Unicode(buffer));
            } else {
                tokens.push(Token::Sequence(buffer));
            }
        }
    }

    while let Some(c) = iter.next() {
        if c == '{' {
            match iter.next() {
                Some('{') => buffer.push('{'),
                Some(mut c) => {
                    flush(&mut tokens, buffer, unicode);
                    buffer = String::new();

                    let mut tag = String::new();
                    loop {
                        tag.push(c);
                        match iter.next() {
                            Some('{') => match iter.peek() {
                                Some(&'{') => {
                                    iter.next();
                                    c = '{'
                                }
                                _ => return Err(ParseError::UnexpectedOpen),
                            },
                            Some('}') => match iter.peek() {
                                Some(&'}') => {
                                    iter.next();
                                    c = '}'
                                }
                                _ => break,
                            },
                            Some(new) => c = new,
                            None => return Err(ParseError::UnmatchedOpen),
                        }
                    }
                    match &*tag {
                        "+UNICODE" => unicode = true,
                        "-UNICODE" => unicode = false,
                        "+SHIFT" => tokens.push(Token::KeyDown(Key::Shift)),
                        "-SHIFT" => tokens.push(Token::KeyUp(Key::Shift)),
                        "+CTRL" => tokens.push(Token::KeyDown(Key::Control)),
                        "-CTRL" => tokens.push(Token::KeyUp(Key::Control)),
                        "+META" => tokens.push(Token::KeyDown(Key::Meta)),
                        "-META" => tokens.push(Token::KeyUp(Key::Meta)),
                        "+ALT" => tokens.push(Token::KeyDown(Key::Alt)),
                        "-ALT" => tokens.push(Token::KeyUp(Key::Alt)),
                        "+BACKSPACE" => tokens.push(Token::KeyDown(Key::Backspace)),
                        "-BACKSPACE" => tokens.push(Token::KeyUp(Key::Backspace)),
                        "+CAPSLOCK" => tokens.push(Token::KeyDown(Key::CapsLock)),
                        "-CAPSLOCK" => tokens.push(Token::KeyUp(Key::CapsLock)),
                        "+TAB" => tokens.push(Token::KeyDown(Key::Tab)),
                        "-TAB" => tokens.push(Token::KeyUp(Key::Tab)),
                        "+DELETE" => tokens.push(Token::KeyDown(Key::Delete)),
                        "-DELETE" => tokens.push(Token::KeyUp(Key::Delete)),
                        "+END" => tokens.push(Token::KeyDown(Key::End)),
                        "-END" => tokens.push(Token::KeyUp(Key::End)),
                        "+ESCAPE" => tokens.push(Token::KeyDown(Key::Escape)),
                        "-ESCAPE" => tokens.push(Token::KeyUp(Key::Escape)),
                        "+PAGEUP" => tokens.push(Token::KeyDown(Key::PageUp)),
                        "-PAGEUP" => tokens.push(Token::KeyUp(Key::PageUp)),
                        "+PAGEDOWN" => tokens.push(Token::KeyDown(Key::PageDown)),
                        "-PAGEDOWN" => tokens.push(Token::KeyUp(Key::PageDown)),
                        "+RETURN" => tokens.push(Token::KeyDown(Key::Return)),
                        "-RETURN" => tokens.push(Token::KeyUp(Key::Return)),
                        "+SPACE" => tokens.push(Token::KeyDown(Key::Space)),
                        "-SPACE" => tokens.push(Token::KeyUp(Key::Space)),
                        "+DOWNARROW" => tokens.push(Token::KeyDown(Key::DownArrow)),
                        "-DOWNARROW" => tokens.push(Token::KeyUp(Key::DownArrow)),
                        "+LEFTARROW" => tokens.push(Token::KeyDown(Key::LeftArrow)),
                        "-LEFTARROW" => tokens.push(Token::KeyUp(Key::LeftArrow)),
                        "+UPARROW" => tokens.push(Token::KeyDown(Key::LeftArrow)),
                        "-UPARROW" => tokens.push(Token::KeyUp(Key::UpArrow)),
                        "+RIGHTARROW" => tokens.push(Token::KeyDown(Key::LeftArrow)),
                        "-RIGHTARROW" => tokens.push(Token::KeyUp(Key::RightArrow)),

                        "+F1" => tokens.push(Token::KeyDown(Key::F1)),
                        "+F2" => tokens.push(Token::KeyDown(Key::F2)),
                        "+F3" => tokens.push(Token::KeyDown(Key::F3)),
                        "+F4" => tokens.push(Token::KeyDown(Key::F4)),
                        "+F5" => tokens.push(Token::KeyDown(Key::F5)),
                        "+F6" => tokens.push(Token::KeyDown(Key::F6)),
                        "+F7" => tokens.push(Token::KeyDown(Key::F7)),
                        "+F8" => tokens.push(Token::KeyDown(Key::F8)),
                        "+F9" => tokens.push(Token::KeyDown(Key::F9)),
                        "+F10" => tokens.push(Token::KeyDown(Key::F10)),
                        "+F11" => tokens.push(Token::KeyDown(Key::F11)),
                        "+F12" => tokens.push(Token::KeyDown(Key::F12)),

                        "-F1" => tokens.push(Token::KeyUp(Key::F1)),
                        "-F2" => tokens.push(Token::KeyUp(Key::F2)),
                        "-F3" => tokens.push(Token::KeyUp(Key::F3)),
                        "-F4" => tokens.push(Token::KeyUp(Key::F4)),
                        "-F5" => tokens.push(Token::KeyUp(Key::F5)),
                        "-F6" => tokens.push(Token::KeyUp(Key::F6)),
                        "-F7" => tokens.push(Token::KeyUp(Key::F7)),
                        "-F8" => tokens.push(Token::KeyUp(Key::F8)),
                        "-F9" => tokens.push(Token::KeyUp(Key::F9)),
                        "-F10" => tokens.push(Token::KeyUp(Key::F10)),
                        "-F11" => tokens.push(Token::KeyUp(Key::F11)),
                        "-F12" => tokens.push(Token::KeyUp(Key::F12)),

                        _ => return Err(ParseError::UnknownTag(tag)),
                    }
                }
                None => return Err(ParseError::UnmatchedOpen),
            }
        } else if c == '}' {
            match iter.next() {
                Some('}') => buffer.push('}'),
                _ => return Err(ParseError::UnmatchedClose),
            }
        } else {
            buffer.push(c);
        }
    }

    flush(&mut tokens, buffer, unicode);

    Ok(tokens)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn success() {
        assert_eq!(
            tokenize("{{Hello World!}} {+CTRL}hi{-CTRL}"),
            Ok(vec![
                Token::Sequence("{Hello World!} ".into()),
                Token::KeyDown(Key::Control),
                Token::Sequence("hi".into()),
                Token::KeyUp(Key::Control)
            ])
        );
    }
    #[test]
    fn unexpected_open() {
        assert_eq!(tokenize("{hello{}world}"), Err(ParseError::UnexpectedOpen));
    }
    #[test]
    fn unmatched_open() {
        assert_eq!(
            tokenize("{this is going to fail"),
            Err(ParseError::UnmatchedOpen)
        );
    }
    #[test]
    fn unmatched_close() {
        assert_eq!(
            tokenize("{+CTRL}{{this}} is going to fail}"),
            Err(ParseError::UnmatchedClose)
        );
    }
}
