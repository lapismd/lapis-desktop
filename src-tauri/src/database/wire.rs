use super::{invalid, sql_guard};
use serde::{Deserialize, Serialize};
use std::{borrow::Cow, collections::BTreeMap, io};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(
    tag = "type",
    content = "value",
    rename_all = "lowercase",
    deny_unknown_fields
)]
pub enum SqlValue {
    Null,
    Integer(String),
    Real(f64),
    Text(String),
    Blob(Vec<u8>),
}

impl SqlValue {
    pub(crate) fn parameter(&self) -> io::Result<turso::Value> {
        Ok(match self {
            Self::Null => turso::Value::Null,
            Self::Integer(value) => {
                let parsed = value
                    .parse::<i64>()
                    .map_err(|_| invalid("Invalid signed 64-bit integer"))?;
                if parsed.to_string() != *value {
                    return Err(invalid("Integer must use canonical decimal encoding"));
                }
                turso::Value::Integer(parsed)
            }
            Self::Real(value) if value.is_finite() => turso::Value::Real(*value),
            Self::Real(_) => return Err(invalid("Real parameters must be finite")),
            Self::Text(value) => turso::Value::Text(value.clone()),
            Self::Blob(value) => turso::Value::Blob(value.clone()),
        })
    }

    pub(crate) fn from_engine(value: turso::Value) -> io::Result<Self> {
        Ok(match value {
            turso::Value::Null => Self::Null,
            turso::Value::Integer(value) => Self::Integer(value.to_string()),
            turso::Value::Real(value) if value.is_finite() => Self::Real(value),
            turso::Value::Real(_) => return Err(invalid("Database returned a non-finite real")),
            turso::Value::Text(value) => Self::Text(value),
            turso::Value::Blob(value) => Self::Blob(value),
        })
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum SqlArgs {
    Positional(Vec<SqlValue>),
    Named(BTreeMap<String, SqlValue>),
}

impl Default for SqlArgs {
    fn default() -> Self {
        Self::Positional(Vec::new())
    }
}

impl SqlArgs {
    pub(crate) fn parameters(&self) -> io::Result<turso::params::Params> {
        Ok(match self {
            Self::Positional(values) => turso::params::Params::Positional(
                values
                    .iter()
                    .map(SqlValue::parameter)
                    .collect::<io::Result<_>>()?,
            ),
            Self::Named(values) => {
                let mut result = Vec::new();
                for (name, value) in values {
                    if name.len() > 256 || !name.starts_with([':', '@', '$', '?']) {
                        return Err(invalid("Named parameters must include their SQL prefix"));
                    }
                    result.push((Cow::Owned(name.clone()), value.parameter()?));
                }
                turso::params::Params::Named(result)
            }
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SqlStatement {
    pub sql: String,
    #[serde(default)]
    pub args: SqlArgs,
}

impl SqlStatement {
    pub(crate) fn validate(&self) -> io::Result<()> {
        sql_guard::validate(&self.sql)?;
        self.args.parameters()?;
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "operation", rename_all = "kebab-case", deny_unknown_fields)]
pub enum DbRequest {
    Exec {
        sql: String,
    },
    Run {
        statement: SqlStatement,
    },
    Get {
        statement: SqlStatement,
    },
    All {
        statement: SqlStatement,
    },
    Batch {
        statements: Vec<SqlStatement>,
        behavior: Option<String>,
    },
}

impl DbRequest {
    pub(crate) fn validate(&self) -> io::Result<()> {
        if serde_json::to_vec(self)?.len() > 4 * 1024 * 1024 {
            return Err(invalid("Database input exceeds 4 MiB"));
        }
        match self {
            Self::Exec { sql } => sql_guard::validate(sql),
            Self::Run { statement } | Self::Get { statement } | Self::All { statement } => {
                statement.validate()
            }
            Self::Batch {
                statements,
                behavior,
            } => {
                if statements.len() > 1024 {
                    return Err(invalid("Batch exceeds 1,024 statements"));
                }
                if behavior
                    .as_deref()
                    .is_some_and(|mode| !matches!(mode, "deferred" | "immediate" | "exclusive"))
                {
                    return Err(invalid("Unsupported transaction behavior"));
                }
                for statement in statements {
                    statement.validate()?;
                }
                Ok(())
            }
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunResult {
    pub changes: u64,
    pub last_insert_rowid: String,
}

#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum DbReply {
    Empty,
    Run {
        result: RunResult,
    },
    Rows {
        rows: Vec<BTreeMap<String, SqlValue>>,
    },
    Batch {
        results: Vec<RunResult>,
    },
}
