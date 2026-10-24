# FROM registry.agahyarai.local/node:20-alpine AS build

# WORKDIR /app
# COPY .npmrc ./
# COPY package*.json ./
# RUN npm ci

# COPY nest-cli.json tsconfig*.json ./
# COPY src ./src
# RUN npm run build && npm prune --omit=dev

# FROM registry.agahyarai.local/node:20-alpine

# WORKDIR /app
# ENV NODE_ENV=production

# COPY --from=build /app/node_modules ./node_modules
# COPY --from=build /app/dist ./dist
# COPY package.json ./

# EXPOSE 5900

# CMD ["node", "dist/main.js"]

FROM docker.agahyarai.local/node:20-alpine

WORKDIR /app/backend

COPY package*.json ./

RUN npm ci

COPY . ./

EXPOSE 5800

CMD ["npm", "run", "start:dev"]
