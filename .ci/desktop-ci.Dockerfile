# syntax=docker/dockerfile:1.7

FROM rust:1.99.0-slim-bookworm@sha256:2c3a22f0a5533ea2dd5a16627bc841228151faa2d4de2644ac9987e4a2f1f2fa AS rust
FROM ghcr.io/lapismd/lapis-ci@sha256:91341a81cc9306eed818c4c433cd29ed11d2ea64c703f32685391befe0eca503

ARG GIT_VERSION=2.56.1
ARG GIT_SHA256=f0b0bf89264b9bd2e1c640363e7529643989da76281600473c50745cd34a607f

LABEL org.opencontainers.image.title="Lapis Desktop CI" \
      org.opencontainers.image.description="Pinned Desktop build tools and verified cross-platform native payloads" \
      org.opencontainers.image.source="https://github.com/lapismd/lapis-desktop" \
      org.opencontainers.image.licenses="Apache-2.0"

COPY --from=rust /usr/local/cargo /usr/local/cargo
COPY --from=rust /usr/local/rustup /usr/local/rustup
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/cache/cargo \
    CARGO_BUILD_JOBS=2 \
    PATH=/opt/git/bin:/opt/tools:/usr/local/cargo/bin:/pnpm:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    clang \
    cmake \
    curl \
    gettext \
    libcurl4-gnutls-dev \
    libexpat1-dev \
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
    xz-utils \
    zlib1g-dev \
  && rm -rf /var/lib/apt/lists/* \
  && rustup component add rustfmt clippy --toolchain 1.99.0 \
  && curl --fail --location --retry 5 \
    "https://www.kernel.org/pub/software/scm/git/git-${GIT_VERSION}.tar.xz" \
    --output /tmp/git.tar.xz \
  && echo "${GIT_SHA256}  /tmp/git.tar.xz" | sha256sum --check --strict \
  && mkdir /tmp/git-source \
  && tar --extract --xz --file /tmp/git.tar.xz \
    --directory /tmp/git-source --strip-components=1 \
  && make --directory /tmp/git-source --jobs=2 \
    prefix=/opt/git NO_TCLTK=YesPlease all \
  && make --directory /tmp/git-source \
    prefix=/opt/git NO_TCLTK=YesPlease install \
  && rm -rf /tmp/git-source /tmp/git.tar.xz

COPY scripts/validation/install-tools.mjs /usr/local/share/lapis-desktop-ci/install-tools.mjs
COPY scripts/ci/verify-image.mjs /usr/local/share/lapis-desktop-ci/verify-image.mjs
COPY .ci/desktop-ci.json /usr/local/share/lapis-desktop-ci/desktop-ci.json

RUN node /usr/local/share/lapis-desktop-ci/install-tools.mjs \
  && node /usr/local/share/lapis-desktop-ci/install-tools.mjs \
    --bundle=/opt/lapis-desktop-ci/tools \
  && node /usr/local/share/lapis-desktop-ci/verify-image.mjs \
    /usr/local/share/lapis-desktop-ci/desktop-ci.json

WORKDIR /workspace
