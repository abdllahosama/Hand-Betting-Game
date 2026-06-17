# syntax=docker/dockerfile:1

# ---- Build stage: compile the static site ----
FROM node:20-alpine AS build
WORKDIR /app

# Disable Husky during install (no .git / hooks needed in CI builds).
ENV HUSKY=0

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Build the app (type-check + Vite production build → /app/dist).
COPY . .
RUN npm run build

# ---- Runtime stage: serve with Nginx ----
FROM nginx:1.27-alpine AS runtime

# SPA-aware Nginx config (history fallback + asset caching).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static build output.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check Coolify can read. Use 127.0.0.1 (not "localhost"): nginx listens
# on IPv4 only, while "localhost" may resolve to IPv6 (::1) first and fail.
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
