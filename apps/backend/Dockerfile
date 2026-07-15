FROM node:24-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

RUN npm ci --workspace @carbexpenses/backend --include-workspace-root

COPY apps/backend apps/backend

RUN DATABASE_URL=mysql://prisma:prisma@localhost:3306/prisma \
    npm run prisma:generate --workspace @carbexpenses/backend
RUN npm run build --workspace @carbexpenses/backend

FROM node:24-alpine AS runtime

WORKDIR /workspace

ENV NODE_ENV=production
ENV BACKEND_PORT=3000

COPY --from=build /workspace/package.json ./package.json
COPY --from=build /workspace/package-lock.json ./package-lock.json
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/backend/package.json apps/backend/package.json
COPY --from=build /workspace/apps/backend/prisma.config.ts apps/backend/prisma.config.ts
COPY --from=build /workspace/apps/backend/dist apps/backend/dist
COPY --from=build /workspace/apps/backend/prisma apps/backend/prisma
COPY --chmod=755 apps/backend/docker-entrypoint.sh apps/backend/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["apps/backend/docker-entrypoint.sh"]
