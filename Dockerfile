# Stage 1: Builder
FROM node:20.19-alpine AS builder

WORKDIR /app

# Prisma resolves DATABASE_URL while loading prisma.config.ts during generate.
# This build-only value is overridden by runtime env vars in Docker/CI.
ARG DATABASE_URL=mysql://root:root@localhost:3306/eatit_build
ENV DATABASE_URL=$DATABASE_URL

COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./

RUN npm ci

COPY . .

RUN npx prisma generate && \
    npm run build

# Stage 2: Runtime
FROM node:20.19-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY start.sh ./start.sh

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated

EXPOSE 3000

RUN chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]
