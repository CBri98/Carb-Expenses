FROM node:24-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

RUN npm ci --workspace @carbexpenses/frontend --include-workspace-root

COPY apps/frontend apps/frontend

RUN npm run build --workspace @carbexpenses/frontend

FROM node:24-alpine AS runtime

WORKDIR /workspace

ENV NODE_ENV=production
ENV PORT=4200

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/frontend/dist apps/frontend/dist

EXPOSE 4200

CMD ["node", "apps/frontend/dist/carbexpenses/server/server.mjs"]
