# Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm i
COPY . .
RUN npm run build


# Serve static
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]