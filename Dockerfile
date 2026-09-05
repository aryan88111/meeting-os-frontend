# Stage 1: Build Frontend Assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build Vite SPA production bundle
RUN npm run build

# Stage 2: Serve with Lightweight Nginx Alpine
FROM nginx:1.27-alpine AS runner

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
