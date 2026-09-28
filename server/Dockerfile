FROM node:20-alpine

WORKDIR /app

# Copy package definition files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source
COPY . .

# Ensure uploads directory exists and set permissions
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 3000

# Tự động đồng bộ cấu trúc bảng và nạp dữ liệu mẫu nếu chưa có, sau đó khởi động server
CMD ["sh", "-c", "node src/seeders/index.js && node src/app.js"]
