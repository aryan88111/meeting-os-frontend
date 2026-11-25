# Stage 1: Build Frontend Assets
FROM node:22-alpine AS builder

WORKDIR /app

# Optional build-time Vite & OpenAPI environment variables
ARG VITE_API_URL=""
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_SUPABASE_PUBLISHABLE_KEY=""
ARG BACKEND_URL="https://meeting-os-backend.onrender.com"
ARG OPENAPI_SPEC_URL=""
ARG OPENAPI_STRICT="false"

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV BACKEND_URL=$BACKEND_URL
ENV OPENAPI_SPEC_URL=$OPENAPI_SPEC_URL
ENV OPENAPI_STRICT=$OPENAPI_STRICT

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Sync OpenAPI spec from backend, regenerate API client, and build Vite SPA bundle
RUN npm run build:ci

# Stage 2: Serve with Lightweight Nginx Alpine
FROM nginx:1.27-alpine AS runner

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config template and runtime configuration script
COPY nginx.conf /etc/nginx/nginx.render.template
COPY docker-entrypoint.d/25-render-nginx.sh /docker-entrypoint.d/25-render-nginx.sh
RUN chmod +x /docker-entrypoint.d/25-render-nginx.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
