# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
RUN npm ci
COPY . .
RUN npm run build --workspace=apps/api

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --omit=dev
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 3001
USER node
CMD ["node", "dist/index.js"]
