# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./

RUN npm ci

# Copier le code source
COPY . .

# Générer Prisma Client et compiler TypeScript
RUN npx prisma generate && \
    npm run build

# Stage 2: Runtime
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Installer les dépendances de production uniquement
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY .env ./.env
COPY start.sh ./start.sh

RUN npm ci --omit=dev && \
    npx prisma generate

# Copier les fichiers compilés du builder
COPY --from=builder /app/dist ./dist

# Copier le client Prisma généré
COPY --from=builder /app/generated ./generated

# Exposer le port
EXPOSE 3000

RUN chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]
