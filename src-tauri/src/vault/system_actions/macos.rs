use lapis_app_core::vault::ActionTarget;
use objc2::rc::{Retained, autoreleasepool};
use objc2_app_kit::NSWorkspace;
use objc2_foundation::{NSArray, NSError, NSFileManager, NSString, NSURL};
use std::{io, path::PathBuf};

fn unavailable(message: &'static str) -> io::Error {
    io::Error::new(io::ErrorKind::Unsupported, message)
}

/// The reference pins the selected object across later pathname replacements.
/// Validate its resolved identity against the capability-opened descriptor.
pub fn file_reference(target: &ActionTarget) -> io::Result<Retained<NSURL>> {
    let path = target.verified_path()?;
    let text = path
        .to_str()
        .ok_or_else(|| unavailable("System path is not UTF-8"))?;
    let url = NSURL::fileURLWithPath_isDirectory(&NSString::from_str(text), target.is_directory()?);
    let reference = url
        .fileReferenceURL()
        .filter(|url| url.isFileReferenceURL())
        .ok_or_else(|| unavailable("The filesystem has no stable native file reference"))?;
    let resolved = reference
        .filePathURL()
        .and_then(|url| url.path())
        .ok_or_else(|| unavailable("Native file reference could not resolve"))?;
    target.validate_path(&PathBuf::from(resolved.to_string()))?;
    Ok(reference)
}

pub fn open(target: &ActionTarget) -> io::Result<()> {
    autoreleasepool(|_| {
        let reference = file_reference(target)?;
        if NSWorkspace::sharedWorkspace().openURL(&reference) {
            Ok(())
        } else {
            Err(io::Error::other(
                "The default application could not open this item",
            ))
        }
    })
}

pub fn reveal(target: &ActionTarget) -> io::Result<()> {
    autoreleasepool(|_| {
        let reference = file_reference(target)?;
        NSWorkspace::sharedWorkspace()
            .activateFileViewerSelectingURLs(&NSArray::from_slice(&[reference.as_ref()]));
        Ok(())
    })
}

fn cocoa_error(error: Retained<NSError>) -> io::Error {
    let kind = match error.code() {
        4 | 260 => io::ErrorKind::NotFound,
        257 | 513 => io::ErrorKind::PermissionDenied,
        516 => io::ErrorKind::AlreadyExists,
        518 => io::ErrorKind::Unsupported,
        _ => io::ErrorKind::Other,
    };
    io::Error::new(kind, error.localizedDescription().to_string())
}

pub fn trash(target: &ActionTarget) -> io::Result<Option<PathBuf>> {
    autoreleasepool(|_| {
        let reference = file_reference(target)?;
        let mut resulting = None;
        NSFileManager::defaultManager()
            .trashItemAtURL_resultingItemURL_error(&reference, Some(&mut resulting))
            .map_err(cocoa_error)?;
        Ok(resulting
            .and_then(|url| url.filePathURL())
            .and_then(|url| url.path())
            .map(|path| PathBuf::from(path.to_string())))
    })
}
