ARG NODE_IMAGE=node:24.16.0-bookworm-slim

FROM ${NODE_IMAGE} AS manifests
WORKDIR /src
COPY . .
RUN test -f package-lock.json && test -d apps/api-service && test -d packages \
    || { echo >&2 "Build context must be the repository root. Run: docker build -f apps/api-service/Dockerfile -t api-service ."; exit 1; }
RUN mkdir -p /manifests \
    && cp --parents package.json package-lock.json /manifests/ \
    && find apps packages -name package.json -exec cp --parents {} /manifests/ \; \
    && find packages -maxdepth 2 -name prisma.config.ts -exec cp --parents {} /manifests/ \; \
    && find packages -name '*.prisma' -exec cp --parents {} /manifests/ \;

FROM ${NODE_IMAGE} AS deps
WORKDIR /opt/app
COPY --from=manifests /manifests/ ./
RUN NODE_ENV=production npm ci --omit=dev

FROM ${NODE_IMAGE} AS build
WORKDIR /opt/app
COPY --from=manifests /manifests/ ./
RUN NODE_ENV=development npm ci
COPY apps/api-service ./apps/api-service
COPY packages ./packages
RUN npm run build -w @mediconcen_coding_test/api-service

FROM ${NODE_IMAGE} AS run
ENV NODE_ENV=production

ARG APP_VERSION=0.0.0-local
ENV npm_package_version=${APP_VERSION}

ARG GIT_SHA=local
ENV GIT_SHA=${GIT_SHA}

LABEL org.opencontainers.image.revision=${GIT_SHA} \
    org.opencontainers.image.version=${APP_VERSION} \
    org.opencontainers.image.title=api-service

WORKDIR /opt/app
COPY --from=deps /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/apps/api-service/dist ./apps/api-service/dist
COPY --from=build /opt/app/apps/api-service/package.json ./apps/api-service/
COPY --from=build /opt/app/packages ./packages

USER node
EXPOSE 3000
STOPSIGNAL SIGTERM

WORKDIR /opt/app/apps/api-service
CMD ["node", "dist/main.js"]
