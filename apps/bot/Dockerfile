# syntax=docker/dockerfile:1
# Build: docker build -t wynnpool-bot -f apps/bot/Dockerfile .
# Run:   docker run --env DISCORD_TOKEN=... --env CLIENT_ID=... -d wynnpool-bot
#
# Build context must be the repo root (.) so COPY paths resolve correctly.

# -- Build stage -------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy lockfile + workspace manifests (layer caching)
COPY package.json yarn.lock turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/bot/package.json apps/bot/
COPY apps/bot/tsconfig.json apps/bot/

# Copy bot source + shared source (needed to build @wynnpool/shared)
COPY apps/bot/src apps/bot/src
COPY packages/shared/src packages/shared/src

# Install workspace deps (hoisted to root node_modules) then build
RUN yarn install --frozen-lockfile \
 && yarn turbo build --filter=@wynnpool/bot

# -- Runtime stage -----------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Pull over only what runtime needs
COPY --from=build /app/apps/bot/dist ./dist
COPY --from=build /app/apps/bot/package.json ./
# Hoisted node_modules from repo root
COPY --from=build /app/node_modules ./node_modules

# Runtime env
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
