# Stage 1: Build ứng dụng React với Node.js
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# Stage 2: Serve the app with the Debian-based Nginx image.
FROM nginx:stable

# Xóa các file mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Sao chép bản build từ Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Sao chép cấu hình Nginx tối ưu cho SPA và reverse proxy API
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
