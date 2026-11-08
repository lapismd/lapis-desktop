# syntax=docker/dockerfile:1.7

FROM rust:1.99.0-slim-bookworm@sha256:2c3a22f0a5533ea2dd5a16627bc841228151faa2d4de2644ac9987e4a2f1f2fa AS rust
FROM ghcr.io/lapismd/lapis-ci@sha256:91341a81cc9306eed818c4c433cd29ed11d2ea64c703f32685391befe0eca503

LABEL org.opencontainers.image.title="Lapis Desktop CI" \
      org.opencontainers.image.description="Pinned Desktop build tools and verified cross-platform native payloads" \
      org.opencontainers.image.source="https://github.com/lapismd/lapis-desktop" \
      org.opencontainers.image.licenses="Apache-2.0"

COPY --from=rust /usr/local/cargo /usr/local/cargo
COPY --from=rust /usr/local/rustup /usr/local/rustup
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/cache/cargo \
    CARGO_BUILD_JOBS=2 \
    PATH=/opt/tools:/usr/local/cargo/bin:/pnpm:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    clang \
    cmake \
    libayatana-appindicator3-dev \
    libgtk-3-dev \
    libssl-dev \
    libwebkit2gtk-4.1-dev \
    libxdo-dev \
    lsof \
    patchelf \
    pkg-config \
    protobuf-compiler \
    python3 \
    librsvg2-dev \
  && rm -rf /var/lib/apt/lists/* \
  && rustup component add rustfmt clippy --toolchain 1.99.0

COPY scripts/validation/install-tools.mjs /usr/local/share/lapis-desktop-ci/install-tools.mjs
COPY scripts/ci/verify-image.mjs /usr/local/share/lapis-desktop-ci/verify-image.mjs
COPY .ci/desktop-ci.json /usr/local/share/lapis-desktop-ci/desktop-ci.json

RUN node /usr/local/share/lapis-desktop-ci/install-tools.mjs \
  && node /usr/local/share/lapis-desktop-ci/install-tools.mjs \
    --bundle=/opt/lapis-desktop-ci/tools \
  && node /usr/local/share/lapis-desktop-ci/verify-image.mjs \
    /usr/local/share/lapis-desktop-ci/desktop-ci.json

WORKDIR /workspace
