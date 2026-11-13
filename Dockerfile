# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:24-trixie-slim
ARG GO_IMAGE=golang:1.25-trixie
ARG NEKO_BASE_IMAGE=ghcr.io/m1k1o/neko/firefox:3.2.0

FROM ${NODE_IMAGE} AS client
WORKDIR /src
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY client/core/package.json client/core/package.json
RUN npm ci
COPY client client
RUN npm run build --workspace=screen-2-screen-client

FROM ${GO_IMAGE} AS server
WORKDIR /src
ENV DEBIAN_FRONTEND=noninteractive
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      libx11-dev libxrandr-dev libxtst-dev libgtk-3-dev libxcvt-dev \
      libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev; \
    apt-get clean; \
    rm -rf /var/lib/apt/lists/*
COPY server/ .
ARG GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT}
RUN ./build

FROM ${NEKO_BASE_IMAGE}
LABEL net.m1k1o.neko.api-version=3
COPY --from=server /src/bin/plugins/ /etc/neko/plugins/
COPY --from=server /src/bin/neko /usr/bin/neko
COPY --from=client /src/client/dist/ /var/www
EXPOSE 8080 52000-52100/udp
