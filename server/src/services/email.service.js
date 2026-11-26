/**
 * EmailService — Gửi email xác minh tài khoản & đặt lại mật khẩu.
 * - Nếu SMTP_HOST được cấu hình và nodemailer khả dụng, gửi qua SMTP thực tế.
 * - Ngược lại (development/test), ghi log an toàn và lưu vào bộ nhớ outbox để kiểm thử.
 */

const outbox = [];
const MAX_OUTBOX = 50;

function recordOutbox(entry) {
  outbox.push({ ...entry, sentAt: new Date().toISOString() });
  if (outbox.length > MAX_OUTBOX) {
    outbox.shift();
  }
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  try {
    // Optional dependency: nếu dự án đã cài nodemailer sẽ dùng trực tiếp
    const nodemailer = require('nodemailer');
    return nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined
    });
  } catch {
    return null;
  }
}

class EmailService {
  static async sendMail({ to, subject, text, html, meta = {} }) {
    const from = process.env.EMAIL_FROM || 'EngLearn <noreply@englearn.art>';
    const transporter = createTransporter();

    if (transporter) {
      await transporter.sendMail({ from, to, subject, text, html });
      recordOutbox({ to, subject, transport: 'smtp', ...meta });
      return { delivered: true, transport: 'smtp' };
    }

    recordOutbox({ to, subject, text, transport: 'fallback-log', ...meta });
    if (process.env.NODE_ENV !== 'test') {
      console.info(
        JSON.stringify({
          level: 'info',
          event: 'email_fallback_dispatched',
          to,
          subject,
          timestamp: new Date().toISOString()
        })
      );
    }
    return { delivered: true, transport: 'fallback-log' };
  }

  static async sendPasswordResetEmail(user, rawToken) {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    return this.sendMail({
      to: user.email,
      subject: '[EngLearn] Khôi phục mật khẩu tài khoản',
      text: `Xin chào ${user.full_name || user.username},\n\nBạn đã yêu cầu đặt lại mật khẩu. Truy cập đường dẫn sau trong vòng 15 phút:\n${resetUrl}\n\nNếu bạn không yêu cầu thao tác này, hãy bỏ qua email.`,
      html: `<p>Xin chào <strong>${user.full_name || user.username}</strong>,</p><p>Nhấn vào liên kết sau để đặt lại mật khẩu (hiệu lực 15 phút):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      meta: { type: 'password_reset', resetUrl }
    });
  }

  static async sendVerificationEmail(user, rawToken) {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const verifyUrl = `${clientUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    return this.sendMail({
      to: user.email,
      subject: '[EngLearn] Xác minh địa chỉ email của bạn',
      text: `Xin chào ${user.full_name || user.username},\n\nVui lòng xác minh email tại:\n${verifyUrl}`,
      html: `<p>Xin chào <strong>${user.full_name || user.username}</strong>,</p><p>Vui lòng xác minh địa chỉ email của bạn tại liên kết:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      meta: { type: 'email_verification', verifyUrl }
    });
  }

  static getOutbox() {
    return [...outbox];
  }

  static clearOutbox() {
    outbox.length = 0;
  }
}

module.exports = EmailService;
