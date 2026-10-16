use super::invalid;
use std::io;

type Inspected<'a> = Vec<(&'a str, Vec<String>)>;

fn inspect(sql: &str) -> io::Result<Inspected<'_>> {
    let mut input = sql.char_indices().peekable();
    let mut result = Vec::new();
    let mut words = Vec::new();
    let mut start = 0;
    while let Some((index, character)) = input.next() {
        match character {
            '-' if input.peek().is_some_and(|(_, c)| *c == '-') => {
                input.next();
                for (_, next) in input.by_ref() {
                    if next == '\n' {
                        break;
                    }
                }
            }
            '/' if input.peek().is_some_and(|(_, c)| *c == '*') => {
                input.next();
                let mut ended = false;
                while let Some((_, next)) = input.next() {
                    if next == '*' && input.peek().is_some_and(|(_, c)| *c == '/') {
                        input.next();
                        ended = true;
                        break;
                    }
                }
                if !ended {
                    return Err(invalid("Unterminated SQL comment"));
                }
            }
            '\'' | '"' | '`' | '[' => {
                let end = if character == '[' { ']' } else { character };
                let mut value = String::new();
                let mut ended = false;
                while let Some((_, next)) = input.next() {
                    if next == end {
                        if input.peek().is_some_and(|(_, c)| *c == end) {
                            input.next();
                            value.push(end);
                            continue;
                        }
                        ended = true;
                        break;
                    }
                    value.push(next);
                }
                if !ended {
                    return Err(invalid("Unterminated SQL quote"));
                }
                if character != '\'' {
                    words.push(value.to_lowercase());
                }
            }
            ';' => {
                if !words.is_empty() {
                    result.push((&sql[start..index], std::mem::take(&mut words)));
                }
                start = index + 1;
            }
            c if c.is_alphanumeric() || c == '_' => {
                let mut word = String::from(c);
                while let Some((_, next)) = input.peek().copied() {
                    if !next.is_alphanumeric() && next != '_' {
                        break;
                    }
                    word.push(input.next().unwrap().1);
                }
                words.push(word.to_lowercase());
            }
            '.' => words.push(".".to_owned()),
            _ => {}
        }
    }
    if !words.is_empty() {
        result.push((&sql[start..], words));
    }
    Ok(result)
}

pub fn statements(sql: &str) -> io::Result<Vec<&str>> {
    Ok(inspect(sql)?.into_iter().map(|(sql, _)| sql).collect())
}

pub fn validate(sql: &str) -> io::Result<()> {
    if sql.len() > 128 * 1024 || sql.contains('\0') {
        return Err(invalid("SQL exceeds the statement limit or contains NUL"));
    }
    for (_, words) in inspect(sql)? {
        if !matches!(
            words[0].as_str(),
            "select"
                | "insert"
                | "update"
                | "delete"
                | "create"
                | "alter"
                | "drop"
                | "with"
                | "explain"
                | "pragma"
        ) {
            return Err(invalid("SQL command is unavailable to the renderer"));
        }
        if words.iter().any(|word| {
            matches!(
                word.as_str(),
                "attach"
                    | "detach"
                    | "vacuum"
                    | "load_extension"
                    | "readfile"
                    | "writefile"
                    | "fsdir"
                    | "zipfile"
                    | "virtual"
                    | "eval"
                    | "edit"
            ) || (word.starts_with("pragma_")
                && !matches!(
                    word.as_str(),
                    "pragma_table_info"
                        | "pragma_index_list"
                        | "pragma_index_info"
                        | "pragma_foreign_key_list"
                ))
        }) {
            return Err(invalid("SQL file or extension access is unavailable"));
        }
        if words[0] == "pragma" {
            let name = if words.get(2).is_some_and(|word| word == ".")
                && words
                    .get(1)
                    .is_some_and(|word| matches!(word.as_str(), "main" | "temp"))
            {
                words.get(3)
            } else {
                words.get(1)
            };
            if !name.is_some_and(|name| {
                matches!(
                    name.as_str(),
                    "table_info" | "index_list" | "index_info" | "foreign_key_list"
                )
            }) {
                return Err(invalid("Only schema introspection pragmas are available"));
            }
        }
    }
    Ok(())
}
