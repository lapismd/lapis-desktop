use super::{
    Binding, Outcome, framing,
    protocol::{Request, Response},
    unavailable, unknown,
};
use std::{
    io,
    sync::{Arc, Weak},
};
use tokio::{
    io::{AsyncReadExt, BufReader},
    net::{UnixListener, UnixStream},
    sync::watch,
    task::JoinSet,
};

pub(super) async fn serve(
    binding: Weak<Binding>,
    listener: UnixListener,
    mut stop: watch::Receiver<bool>,
) -> io::Result<()> {
    let mut connections = JoinSet::new();
    let mut total = 0;
    let result = loop {
        tokio::select! {
            biased;
            _ = stop.changed() => break Ok(()),
            Some(_) = connections.join_next(), if !connections.is_empty() => {},
            accepted = listener.accept() => {
                let (stream, _) = match accepted { Ok(value) => value, Err(error) => break Err(error) };
                total += 1;
                if total > 4096 { break Err(unavailable()); }
                if connections.len() >= 10 { drop(stream); continue; }
                let Some(binding) = binding.upgrade() else { break Ok(()); };
                connections.spawn(connection(binding, stream, stop.clone()));
            }
        }
    };
    if let Some(binding) = binding.upgrade() {
        binding.fence()?;
    }
    // Stop is signalled by fence; each connection releases its exact invocation.
    while connections.join_next().await.is_some() {}
    result
}
async fn connection(
    binding: Arc<Binding>,
    stream: UnixStream,
    mut stop: watch::Receiver<bool>,
) -> io::Result<()> {
    let (reader, mut writer) = stream.into_split();
    let mut reader = BufReader::new(reader);
    let request = tokio::select! {
        biased;
        _ = stop.changed() => return Err(unavailable()),
        result = tokio::time::timeout(binding.limits.handshake, framing::read::<Request>(&mut reader)) => result.map_err(|_| unavailable())??,
    };
    let response = match request {
        Request::Snapshot { credential } => {
            binding.authenticate(&credential)?;
            Response::Snapshot {
                tools: binding.tools.clone(),
            }
        }
        Request::Call {
            credential,
            name,
            arguments,
        } => {
            binding.authenticate(&credential)?;
            let (id, receiver) = match binding.begin(name, arguments) {
                Ok(value) => value,
                Err(outcome) => {
                    return tokio::time::timeout(
                        binding.limits.handshake,
                        framing::write(&mut writer, &Response::Result { outcome }),
                    )
                    .await
                    .map_err(|_| unknown())?;
                }
            };
            // Keeping this guard outside select signals cancellation on future drop too.
            struct Cancel(Arc<Binding>, uuid::Uuid);
            impl Drop for Cancel {
                fn drop(&mut self) {
                    let _ = self.0.cancel(self.1);
                }
            }
            let _cancel = Cancel(binding.clone(), id);
            let mut byte = [0];
            let outcome = tokio::select! {
                biased;
                _ = stop.changed() => { binding.cancel(id)?; Outcome::Unknown {} },
                _ = reader.read(&mut byte) => { binding.cancel(id)?; return Err(unknown()); },
                reply = tokio::time::timeout(binding.limits.call, receiver) => match reply {
                    Ok(Ok(outcome)) => outcome,
                    _ => { binding.cancel(id)?; Outcome::Unknown {} },
                },
            };
            Response::Result { outcome }
        }
    };
    tokio::time::timeout(
        binding.limits.handshake,
        framing::write(&mut writer, &response),
    )
    .await
    .map_err(|_| unknown())?
}
