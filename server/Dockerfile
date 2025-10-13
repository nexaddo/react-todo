FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm i
COPY tsconfig.json ./
COPY src ./src
# Ensure TS typecheck dependencies available at runtime for tsx loader
RUN npm i -D tsx typescript && npx tsc --noEmit
EXPOSE 3000
CMD ["node", "--env-file=.env", "--enable-source-maps", "--loader", "tsx", "src/index.ts"]