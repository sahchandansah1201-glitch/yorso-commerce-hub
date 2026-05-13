FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY apps/api ./apps/api
COPY packages/contracts ./packages/contracts

RUN npm run api:build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV YORSO_API_HOST=0.0.0.0
ENV YORSO_API_PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
