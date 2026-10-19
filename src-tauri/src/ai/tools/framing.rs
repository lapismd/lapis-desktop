use serde::{Serialize, de::DeserializeOwned};
use std::io;
use tokio::io::{AsyncBufRead, AsyncBufReadExt, AsyncWrite, AsyncWriteExt};

pub(super) const FRAME_BYTES: usize = 1_048_576;
pub(super) async fn read<T: DeserializeOwned>(
    reader: &mut (impl AsyncBufRead + Unpin),
) -> io::Result<T> {
    let mut bytes = Vec::new();
    loop {
        let chunk = reader.fill_buf().await?;
        if chunk.is_empty() {
            return Err(io::Error::from(io::ErrorKind::UnexpectedEof));
        }
        let count = chunk
            .iter()
            .position(|b| *b == b'\n')
            .map(|n| n + 1)
            .unwrap_or(chunk.len());
        if bytes.len() + count > FRAME_BYTES {
            return Err(super::unavailable());
        }
        let complete = chunk[count - 1] == b'\n';
        bytes.extend_from_slice(&chunk[..count]);
        reader.consume(count);
        if complete {
            return serde_json::from_slice(&bytes).map_err(|_| super::unavailable());
        }
    }
}
pub(super) async fn write(
    writer: &mut (impl AsyncWrite + Unpin),
    value: &impl Serialize,
) -> io::Result<()> {
    // The protocol only serializes bounded snapshots and already bounded payloads.
    let mut bytes = serde_json::to_vec(value).map_err(|_| super::unavailable())?;
    if bytes.len() >= FRAME_BYTES {
        return Err(super::unavailable());
    }
    bytes.push(b'\n');
    writer.write_all(&bytes).await?;
    writer.flush().await
}
