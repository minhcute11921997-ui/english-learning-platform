---
name: dev-scaffold
description: >-
  Công cụ phát triển nhanh cho dự án. Sử dụng khi cần tạo nhanh component React,
  page, Sequelize model, Express route, hoặc full CRUD. Cũng hỗ trợ test API, reset
  database, và kiểm tra biến môi trường.
---

# 🏗️ Dev Scaffold Skill

Công cụ phát triển nhanh cho dự án English Learning.

## Scaffolding (Tạo nhanh file)

### Tạo React Component
```bash
cd E:\doan\tools
node dev/scaffolder.js component VocabCard
```
→ Tạo `client/src/components/VocabCard.jsx`

### Tạo React Page
```bash
node dev/scaffolder.js page DashboardPage
```
→ Tạo `client/src/pages/DashboardPage.jsx`

### Tạo Sequelize Model
```bash
node dev/scaffolder.js model Vocabulary
```
→ Tạo `server/src/models/Vocabulary.js`

### Tạo Express Route
```bash
node dev/scaffolder.js route vocabulary
```
→ Tạo `server/src/routes/vocabulary.routes.js`

### Tạo Full CRUD (Model + Controller + Route)
```bash
node dev/scaffolder.js crud Vocabulary
```
→ Tạo cả 3 file: model, controller, route

## Công cụ phát triển khác

### Test API Endpoints
```bash
node dev/api-tester.js           # Test tất cả
node dev/api-tester.js --auth    # Test auth endpoints
node dev/api-tester.js --vocab   # Test vocabulary endpoints
```

### Reset & Seed Database
```bash
node dev/db-reset.js             # Reset DB
node dev/db-reset.js --seed      # Reset + seed data
node dev/db-reset.js --seed-only # Chỉ seed (không reset)
```

### Kiểm tra biến môi trường
```bash
node dev/env-checker.js
```
Kiểm tra tất cả biến cần thiết trong `.env`
