---
name: ui-improvement
description: >-
  Cải thiện UI/UX cho dự án. Sử dụng khi cần tạo bảng màu Tailwind, kiểm tra accessibility,
  kiểm tra responsive design, tạo design tokens, hoặc chạy Lighthouse audit. Tự động chạy
  các tool trong thư mục tools/ui/.
---

# 🎨 UI Improvement Skill

Cải thiện giao diện và trải nghiệm người dùng.

## Các công cụ có sẵn

### 1. Tạo bảng màu Tailwind CSS
```bash
cd E:\doan\tools
node ui/color-palette.js --theme ocean     # Xanh biển (mặc định)
node ui/color-palette.js --theme forest    # Xanh lá
node ui/color-palette.js --theme sunset    # Cam/vàng
node ui/color-palette.js --theme purple    # Tím
```
Output: `tools/output/colors-{theme}.js` và `.css`

### 2. Tạo Design Tokens
```bash
node ui/design-tokens.js
```
Output: `tools/output/design-tokens.css` và `.js`

### 3. Kiểm tra Accessibility
```bash
node ui/a11y-check.js ../client/src
```
Kiểm tra: alt tags, ARIA labels, keyboard navigation, color contrast

### 4. Kiểm tra Responsive
```bash
node ui/responsive-check.js http://localhost:5173
```
Chụp screenshot ở 6 kích thước: iPhone SE, iPhone 14, iPad Mini, iPad Pro, Laptop, Desktop

### 5. Lighthouse Audit
```bash
node ui/lighthouse-audit.js http://localhost:5173
```
Đánh giá: Performance, Accessibility, Best Practices, SEO

## Quy tắc thiết kế
- Sử dụng Tailwind CSS utility-first
- Mobile-first responsive design
- Minimum touch target: 44x44px
- Color contrast ratio ≥ 4.5:1
- Luôn có alt text cho images
- Sử dụng semantic HTML elements
