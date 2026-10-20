//! Align native controls in the 40px Lapis header after AppKit relayout.
//! Adapted from the jj-store Tauri shell; no native pointer leaves a live callback.
use block2::RcBlock;
use objc2::{
    rc::{Allocated, Retained},
    runtime::ProtocolObject,
};
use objc2_app_kit::{NSWindow, NSWindowButton, NSWindowDidUpdateNotification, NSWindowStyleMask};
use objc2_foundation::{
    MainThreadMarker, NSNotification, NSNotificationCenter, NSObjectProtocol, NSPoint, NSString,
};
use std::{
    cell::{Cell, RefCell},
    collections::{HashMap, hash_map::Entry},
    ptr::NonNull,
};

struct UpdateObserver(Retained<ProtocolObject<dyn NSObjectProtocol>>);
#[cfg(feature = "e2e")]
static OBSERVER_COUNT: std::sync::atomic::AtomicUsize = std::sync::atomic::AtomicUsize::new(0);

#[cfg(feature = "e2e")]
pub fn observer_count() -> usize {
    OBSERVER_COUNT.load(std::sync::atomic::Ordering::SeqCst)
}

impl Drop for UpdateObserver {
    fn drop(&mut self) {
        // SAFETY: this exact token came from the center, and this owner stays on the UI thread.
        unsafe { NSNotificationCenter::defaultCenter().removeObserver(self.0.as_ref()) };
        #[cfg(feature = "e2e")]
        OBSERVER_COUNT.fetch_sub(1, std::sync::atomic::Ordering::SeqCst);
    }
}
thread_local! {
    static OBSERVERS: RefCell<HashMap<String, UpdateObserver>> = RefCell::new(HashMap::new());
    static ALIGNING: Cell<bool> = const { Cell::new(false) };
}

/// Preserve WebKit's related configuration, with this window's own native caller.
pub fn isolate_related_configuration(features: &tauri::webview::NewWindowFeatures) -> bool {
    if MainThreadMarker::new().is_none() {
        return false;
    }
    let Some(class) = objc2::runtime::AnyClass::get(c"WKUserContentController") else {
        return false;
    };
    let Some(script_class) = objc2::runtime::AnyClass::get(c"WKUserScript") else {
        return false;
    };
    // SAFETY: WebKit supplies this live target configuration on its main-thread
    // new-window callback. A fresh retained controller lets Wry install the
    // child's own scripts/message handler instead of reusing the opener's.
    // The configuration, process pool and opener relationship stay unchanged.
    unsafe {
        let configuration = &features.opener().target_configuration;
        let controller: Retained<_> = objc2::msg_send![class, new];
        configuration.setUserContentController(&controller);
        let script: Allocated<_> = objc2::msg_send![script_class, alloc];
        let script: Retained<_> = objc2::msg_send![script,
            initWithSource: &*NSString::from_str(include_str!("related-policy.js")),
            injectionTime: 0isize, forMainFrameOnly: true];
        controller.addUserScript(&script);
    }
    true
}

pub fn shutdown() {
    if MainThreadMarker::new().is_some() {
        OBSERVERS.with(|owners| {
            owners.borrow_mut().clear();
        });
    }
}

pub fn release(label: &str) {
    if MainThreadMarker::new().is_some() {
        OBSERVERS.with(|owners| {
            owners.borrow_mut().remove(label);
        });
    }
}

pub fn align(window: &tauri::WebviewWindow) {
    let label = window.label().to_owned();
    // Tauri invokes this closure on the UI thread with the live window retained.
    let _ = window.with_webview(move |platform| {
        if MainThreadMarker::new().is_none() {
            return;
        }
        // SAFETY: Tauri supplies this NSWindow pointer for this main-thread callback.
        // The borrow never escapes the callback and no pointer is stored or transferred.
        let Some(window) = (unsafe { platform.ns_window().cast::<NSWindow>().as_ref() }) else {
            return;
        };
        OBSERVERS.with(|owners| {
            let mut owners = owners.borrow_mut();
            if let Entry::Vacant(owner) = owners.entry(label) {
                let callback = RcBlock::new(|notification: NonNull<NSNotification>| {
                    if MainThreadMarker::new().is_none() {
                        return;
                    }
                    // SAFETY: the center supplies a live notification for the duration of the callback.
                    let object = unsafe { notification.as_ref() }.object();
                    if let Some(window) = object
                        .as_deref()
                        .and_then(|object| object.downcast_ref::<NSWindow>())
                    {
                        align_native(window, false);
                    }
                });
                // SAFETY: filter is this live NSWindow; no queue means synchronous delivery on
                // AppKit's posting UI thread. The capture-free callback is sendable, stores no
                // window pointer and borrows only the notification's retained object. The exact
                // observer token is removed on host exit, before its retained owner is dropped.
                let token = unsafe {
                    NSNotificationCenter::defaultCenter()
                        .addObserverForName_object_queue_usingBlock(
                            Some(NSWindowDidUpdateNotification),
                            Some(window),
                            None,
                            &callback,
                        )
                };
                owner.insert(UpdateObserver(token));
                #[cfg(feature = "e2e")]
                OBSERVER_COUNT.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            }
        });
        align_native(window, true);
    });
}

fn align_native(window: &NSWindow, refresh_tracking: bool) {
    if ALIGNING.with(|active| active.replace(true)) {
        return;
    }
    align_buttons(window, refresh_tracking);
    ALIGNING.with(|active| active.set(false));
}

fn align_buttons(window: &NSWindow, refresh_tracking: bool) {
    if window.styleMask().contains(NSWindowStyleMask::FullScreen) {
        return;
    }
    let Some(content) = window.contentView() else {
        return;
    };
    let kinds = [
        NSWindowButton::CloseButton,
        NSWindowButton::MiniaturizeButton,
        NSWindowButton::ZoomButton,
    ];
    let buttons: Vec<_> = kinds
        .into_iter()
        .filter_map(|kind| window.standardWindowButton(kind))
        .collect();
    if buttons.len() != 3 {
        return;
    }
    let close = buttons[0].frame();
    let spacing = buttons[1].frame().origin.x - close.origin.x;
    // SAFETY: the live NSWindow retains the native button hierarchy throughout this callback.
    let Some(parent) = (unsafe { buttons[0].superview() }) else {
        return;
    };
    // SAFETY: the parent remains attached to the same retained live window.
    let Some(container) = (unsafe { parent.superview() }) else {
        return;
    };
    let mut frame = container.frame();
    frame.size.height = 40.0;
    frame.origin.y = window.frame().size.height - frame.size.height;
    let mut changed = frame != container.frame();
    if changed {
        container.setFrame(frame);
    }
    let bounds = content.bounds();
    let center_y = if content.isFlipped() {
        20.0
    } else {
        bounds.size.height - 20.0
    };
    for (index, button) in buttons.iter().enumerate() {
        // SAFETY: native buttons remain attached to the retained live window.
        let Some(parent) = (unsafe { button.superview() }) else {
            continue;
        };
        let current = button.frame();
        let center = parent.convertPoint_fromView(
            NSPoint::new(
                16.0 + spacing * index as f64 + current.size.width / 2.0,
                center_y,
            ),
            Some(&content),
        );
        let origin = NSPoint::new(
            center.x - current.size.width / 2.0,
            center.y - current.size.height / 2.0,
        );
        if (origin.x - current.origin.x).abs() > 0.1 || (origin.y - current.origin.y).abs() > 0.1 {
            button.setFrameOrigin(origin);
            changed = true;
        }
        if changed || refresh_tracking {
            button.updateTrackingAreas();
        }
    }
    if changed || refresh_tracking {
        parent.updateTrackingAreas();
        container.updateTrackingAreas();
    }
}

/// Acceptance reads actual AppKit geometry, never the configured target or a cache.
#[cfg(feature = "e2e")]
pub async fn geometry(window: tauri::WebviewWindow) -> Result<Vec<[f64; 4]>, String> {
    let (send, receive) = std::sync::mpsc::sync_channel(1);
    window
        .with_webview(move |platform| {
            let result = (|| {
                MainThreadMarker::new()?;
                // SAFETY: the live Tauri callback owns this NSWindow borrow; it never escapes.
                let window = unsafe { platform.ns_window().cast::<NSWindow>().as_ref() }?;
                let content = window.contentView()?;
                let mut result = Vec::new();
                for kind in [
                    NSWindowButton::CloseButton,
                    NSWindowButton::MiniaturizeButton,
                    NSWindowButton::ZoomButton,
                ] {
                    let button = window.standardWindowButton(kind)?;
                    // SAFETY: the live window retains the native button and its parent.
                    let parent = unsafe { button.superview() }?;
                    let rect = content.convertRect_fromView(button.frame(), Some(&parent));
                    let top = if content.isFlipped() {
                        rect.origin.y
                    } else {
                        content.bounds().size.height - rect.origin.y - rect.size.height
                    };
                    result.push([rect.origin.x, top, rect.size.width, rect.size.height]);
                }
                Some(result)
            })();
            let _ = send.send(result);
        })
        .map_err(|error| error.to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        receive.recv_timeout(std::time::Duration::from_secs(5))
    })
    .await
    .map_err(|error| error.to_string())?
    .map_err(|error| error.to_string())?
    .ok_or_else(|| "Native controls could not be measured".into())
}

/// E2E-only foreground diagnostics: visible, minimized, current Space, unoccluded, key.
#[cfg(feature = "e2e")]
pub async fn visibility(window: tauri::WebviewWindow) -> Result<[bool; 5], String> {
    let (send, receive) = std::sync::mpsc::sync_channel(1);
    window
        .with_webview(move |platform| {
            let result = (|| {
                MainThreadMarker::new()?;
                // SAFETY: Tauri retains the live NSWindow for this UI-thread callback only.
                let window = unsafe { platform.ns_window().cast::<NSWindow>().as_ref() }?;
                Some([
                    window.isVisible(),
                    window.isMiniaturized(),
                    window.isOnActiveSpace(),
                    window
                        .occlusionState()
                        .contains(objc2_app_kit::NSWindowOcclusionState::Visible),
                    window.isKeyWindow(),
                ])
            })();
            let _ = send.send(result);
        })
        .map_err(|error| error.to_string())?;
    tauri::async_runtime::spawn_blocking(move || {
        receive.recv_timeout(std::time::Duration::from_secs(5))
    })
    .await
    .map_err(|error| error.to_string())?
    .map_err(|error| error.to_string())?
    .ok_or_else(|| "Native visibility could not be measured".into())
}
