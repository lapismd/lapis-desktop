use super::{
    DbReply, DbRequest, RunResult, SqlStatement, SqlValue, engine_error, invalid, sql_guard,
};
use std::{collections::BTreeMap, io, path::Path};

struct OpenDatabase {
    _database: turso::Database,
    connection: turso::Connection,
}

pub struct NativeDatabase {
    open: Option<OpenDatabase>,
    poisoned: bool,
}

impl NativeDatabase {
    pub async fn open(directory: &Path, profile_id: &str) -> io::Result<Self> {
        let id = uuid::Uuid::parse_str(profile_id)
            .map_err(|_| invalid("Invalid database profile identity"))?;
        if !directory.is_absolute() {
            return Err(invalid("Native database profile must be absolute"));
        }
        std::fs::create_dir_all(directory)?;
        let path = directory.canonicalize()?.join(format!("{id}.db"));
        if std::fs::symlink_metadata(&path).is_ok_and(|metadata| metadata.file_type().is_symlink())
        {
            return Err(invalid("Database paths cannot be symlinks"));
        }
        let database = turso::Builder::new_local(
            path.to_str()
                .ok_or_else(|| invalid("Database profile is not UTF-8"))?,
        )
        .experimental_attach(false)
        .experimental_vacuum(false)
        .experimental_index_method(true)
        .build()
        .await
        .map_err(engine_error)?;
        let connection = database.connect().map_err(engine_error)?;
        Ok(Self {
            open: Some(OpenDatabase {
                _database: database,
                connection,
            }),
            poisoned: false,
        })
    }

    pub async fn execute(&mut self, request: DbRequest) -> io::Result<DbReply> {
        request.validate()?;
        if self.poisoned {
            return Err(io::Error::other(
                "Database requires recovery after failed rollback",
            ));
        }
        let connection = &self
            .open
            .as_ref()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotConnected, "Database is closed"))?
            .connection;
        match request {
            DbRequest::Exec { sql } => {
                for sql in sql_guard::statements(&sql)? {
                    let mut rows = connection.query(sql, ()).await.map_err(engine_error)?;
                    while rows.next().await.map_err(engine_error)?.is_some() {}
                }
                Ok(DbReply::Empty)
            }
            DbRequest::Run { statement } => Ok(DbReply::Run {
                result: run(connection, &statement).await?,
            }),
            DbRequest::Get { statement } => Ok(DbReply::Rows {
                rows: query(connection, &statement, true).await?,
            }),
            DbRequest::All { statement } => Ok(DbReply::Rows {
                rows: query(connection, &statement, false).await?,
            }),
            DbRequest::Batch {
                statements,
                behavior,
            } => {
                let begin = match behavior.as_deref().unwrap_or("immediate") {
                    "deferred" => "BEGIN DEFERRED",
                    "exclusive" => "BEGIN EXCLUSIVE",
                    _ => "BEGIN IMMEDIATE",
                };
                connection.execute(begin, ()).await.map_err(engine_error)?;
                let result = async {
                    let mut results = Vec::new();
                    for statement in statements {
                        results.push(run(connection, &statement).await?);
                    }
                    connection
                        .execute("COMMIT", ())
                        .await
                        .map_err(engine_error)?;
                    Ok(DbReply::Batch { results })
                }
                .await;
                if result.is_err()
                    && let Err(error) = connection.execute("ROLLBACK", ()).await
                {
                    self.poisoned = true;
                    return Err(io::Error::other(format!(
                        "Database rollback failed: {error}"
                    )));
                }
                result
            }
        }
    }

    pub async fn close(&mut self) -> io::Result<()> {
        if let Some(open) = &self.open {
            let mut rows = open
                .connection
                .query("PRAGMA wal_checkpoint(TRUNCATE)", ())
                .await
                .map_err(engine_error)?;
            while let Some(row) = rows.next().await.map_err(engine_error)? {
                if row.get::<i64>(0).map_err(engine_error)? != 0 {
                    return Err(io::Error::new(
                        io::ErrorKind::WouldBlock,
                        "Database checkpoint is busy",
                    ));
                }
            }
        }
        self.open = None;
        Ok(())
    }
}

async fn run(connection: &turso::Connection, statement: &SqlStatement) -> io::Result<RunResult> {
    {
        let mut rows = connection
            .query(&statement.sql, statement.args.parameters()?)
            .await
            .map_err(engine_error)?;
        while rows.next().await.map_err(engine_error)?.is_some() {}
    }
    let mut count = connection
        .query("SELECT changes()", ())
        .await
        .map_err(engine_error)?;
    let changes = count
        .next()
        .await
        .map_err(engine_error)?
        .ok_or_else(|| io::Error::other("Database omitted its change count"))?
        .get::<i64>(0)
        .map_err(engine_error)?;
    Ok(RunResult {
        changes: u64::try_from(changes)
            .map_err(|_| io::Error::other("Database returned a negative change count"))?,
        last_insert_rowid: connection.last_insert_rowid().to_string(),
    })
}

async fn query(
    connection: &turso::Connection,
    statement: &SqlStatement,
    first_only: bool,
) -> io::Result<Vec<BTreeMap<String, SqlValue>>> {
    let mut rows = connection
        .query(&statement.sql, statement.args.parameters()?)
        .await
        .map_err(engine_error)?;
    let names = rows.column_names();
    let mut result = Vec::new();
    let mut count = 0;
    let mut size = 0;
    while let Some(row) = rows.next().await.map_err(engine_error)? {
        count += 1;
        if count > 100_000 {
            return Err(invalid("Database result exceeds 100,000 rows"));
        }
        let mut values = BTreeMap::new();
        for (index, name) in names.iter().enumerate() {
            values.insert(
                name.clone(),
                SqlValue::from_engine(row.get_value(index).map_err(engine_error)?)?,
            );
        }
        size += serde_json::to_vec(&values)?.len();
        if size > 16 * 1024 * 1024 {
            return Err(invalid("Database result exceeds 16 MiB"));
        }
        if !first_only || result.is_empty() {
            result.push(values);
        }
    }
    Ok(result)
}
