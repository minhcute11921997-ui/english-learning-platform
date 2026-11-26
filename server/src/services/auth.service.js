const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/app');
const AppError = require('../utils/AppError');
const { User, RefreshToken } = require('../models');
const EmailService = require('./email.service');

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

class AuthService {
  static hashToken(rawToken) {
    return hashToken(rawToken);
  }

  static generateTokens(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const jti = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString('hex');

    const refreshToken = jwt.sign({ id: user.id, jti }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  static async persistRefreshToken(userId, rawRefreshToken) {
    if (!RefreshToken || typeof RefreshToken.create !== 'function') return;
    await RefreshToken.create({
      user_id: userId,
      token_hash: hashToken(rawRefreshToken),
      expires_at: new Date(Date.now() + REFRESH_TTL_MS),
      revoked_at: null
    });
  }

  static async revokeAllUserRefreshTokens(userId) {
    if (!RefreshToken || typeof RefreshToken.findAll !== 'function') return;
    const records = await RefreshToken.findAll({ where: { user_id: userId } });
    const now = new Date();
    for (const record of records) {
      if (!record.revoked_at) {
        record.revoked_at = now;
        if (typeof record.save === 'function') {
          await record.save();
        }
      }
    }
  }

  static async register({ username, email, password, full_name }) {
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError('Email này đã được sử dụng.', 400);
      }
      throw new AppError('Tên đăng nhập này đã tồn tại.', 400);
    }

    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      username,
      email,
      password_hash: password,
      full_name,
      role: 'learner',
      email_verified: false,
      email_verification_token: hashToken(rawVerifyToken)
    });

    const tokens = this.generateTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    EmailService.sendVerificationEmail(user, rawVerifyToken).catch(() => {});

    return { user, ...tokens };
  }

  static async login({ email, password }) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    if (!user.is_active) {
      throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainMin = Math.max(1, Math.ceil((new Date(user.locked_until) - Date.now()) / 60000));
      throw new AppError(
        `Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${remainMin} phút.`,
        423
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const maxAttempts = config?.security?.maxLoginAttempts || 5;
      const lockoutMinutes = config?.security?.lockoutDurationMinutes || 15;
      const nextAttempts = (user.failed_login_attempts || 0) + 1;
      user.failed_login_attempts = nextAttempts;

      if (nextAttempts >= maxAttempts) {
        user.locked_until = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      }
      if (typeof user.save === 'function') {
        await user.save();
      }

      if (nextAttempts >= maxAttempts) {
        throw new AppError(
          `Bạn đã nhập sai mật khẩu ${maxAttempts} lần. Tài khoản tạm khóa ${lockoutMinutes} phút.`,
          423
        );
      }
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    if ((user.failed_login_attempts || 0) > 0 || user.locked_until) {
      user.failed_login_attempts = 0;
      user.locked_until = null;
      if (typeof user.save === 'function') {
        await user.save();
      }
    }

    const tokens = this.generateTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }

  static async refreshToken(token) {
    if (!token) {
      throw new AppError('Refresh token không hợp lệ.', 400);
    }

    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      const tokenHash = hashToken(token);

      let storedRecord = null;
      if (RefreshToken && typeof RefreshToken.findOne === 'function') {
        storedRecord = await RefreshToken.findOne({ where: { token_hash: tokenHash } });
        if (storedRecord) {
          if (storedRecord.revoked_at) {
            throw new AppError('Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.', 401);
          }
          if (storedRecord.expires_at && new Date(storedRecord.expires_at) <= new Date()) {
            throw new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
          }
        }
      }

      const user = await User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        throw new AppError('Tài khoản không tồn tại hoặc đã bị khóa.', 401);
      }

      const tokens = this.generateTokens(user);

      if (storedRecord) {
        storedRecord.revoked_at = new Date();
        storedRecord.replaced_by_hash = hashToken(tokens.refreshToken);
        if (typeof storedRecord.save === 'function') {
          await storedRecord.save();
        }
      }
      await this.persistRefreshToken(user.id, tokens.refreshToken);

      return { user, ...tokens };
    } catch (err) {
      if (err.isOperational) throw err;
      throw new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
  }

  static async logout(token) {
    if (!token || !RefreshToken || typeof RefreshToken.findOne !== 'function') {
      return;
    }

    const tokenHash = hashToken(token);
    const existing = await RefreshToken.findOne({ where: { token_hash: tokenHash } });
    if (existing) {
      if (!existing.revoked_at) {
        existing.revoked_at = new Date();
        if (typeof existing.save === 'function') {
          await existing.save();
        }
      }
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      if (decoded?.id && typeof RefreshToken.create === 'function') {
        await RefreshToken.create({
          user_id: decoded.id,
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + REFRESH_TTL_MS),
          revoked_at: new Date()
        });
      }
    } catch {
      // Bỏ qua token không hợp lệ khi đăng xuất
    }
  }

  static async forgotPassword(email) {
    const genericMsg = 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.';
    if (!email) {
      throw new AppError('Vui lòng nhập email.', 400);
    }

    const user = await User.findOne({ where: { email: String(email).trim() } });
    if (!user || !user.is_active) {
      return { message: genericMsg };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const ttlMinutes = config?.security?.passwordResetTtlMinutes || 15;

    user.password_reset_token = hashToken(rawToken);
    user.password_reset_expires = new Date(Date.now() + ttlMinutes * 60 * 1000);
    if (typeof user.save === 'function') {
      await user.save();
    }

    await EmailService.sendPasswordResetEmail(user, rawToken);

    const payload = { message: genericMsg };
    if ((config?.env || process.env.NODE_ENV) !== 'production') {
      payload.resetToken = rawToken;
    }
    return payload;
  }

  static async resetPassword({ token, newPassword }) {
    if (!token || !newPassword || String(newPassword).length < 6) {
      throw new AppError('Token không hợp lệ hoặc mật khẩu mới phải có ít nhất 6 ký tự.', 400);
    }

    const hashed = hashToken(token);
    const user = await User.findOne({ where: { password_reset_token: hashed } });
    if (!user || !user.password_reset_expires || new Date(user.password_reset_expires) <= new Date()) {
      throw new AppError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
    }

    user.password_hash = newPassword;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    user.failed_login_attempts = 0;
    user.locked_until = null;
    if (typeof user.save === 'function') {
      await user.save();
    }

    await this.revokeAllUserRefreshTokens(user.id);
    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  static async requestEmailVerification(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Người dùng không tồn tại.', 404);
    if (user.email_verified) {
      return { message: 'Email của bạn đã được xác minh trước đó.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.email_verification_token = hashToken(rawToken);
    if (typeof user.save === 'function') {
      await user.save();
    }

    await EmailService.sendVerificationEmail(user, rawToken);
    const payload = { message: 'Email xác minh đã được gửi lại.' };
    if ((config?.env || process.env.NODE_ENV) !== 'production') {
      payload.verificationToken = rawToken;
    }
    return payload;
  }

  static async verifyEmail(token) {
    if (!token) {
      throw new AppError('Mã xác minh email không hợp lệ.', 400);
    }

    const user = await User.findOne({ where: { email_verification_token: hashToken(token) } });
    if (!user) {
      throw new AppError('Mã xác minh email không hợp lệ hoặc đã được sử dụng.', 400);
    }

    user.email_verified = true;
    user.email_verification_token = null;
    if (typeof user.save === 'function') {
      await user.save();
    }

    return { message: 'Xác minh email thành công!' };
  }

  static async verifyGoogleCredential(credential, fetchFn) {
    if (typeof this.googleVerifier === 'function') {
      return this.googleVerifier(credential);
    }

    const doFetch = fetchFn || globalThis.fetch;
    if (typeof doFetch !== 'function') {
      throw new AppError('Môi trường máy chủ không hỗ trợ xác thực Google trực tuyến.', 503);
    }

    const res = await doFetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!res.ok) {
      throw new AppError('Token Google không hợp lệ hoặc đã hết hạn.', 401);
    }

    const payload = await res.json();
    const expectedClientId = config?.google?.clientId;
    if (expectedClientId && payload.aud !== expectedClientId) {
      throw new AppError('Token Google không thuộc ứng dụng này.', 401);
    }

    if (
      payload.iss &&
      payload.iss !== 'https://accounts.google.com' &&
      payload.iss !== 'accounts.google.com'
    ) {
      throw new AppError('Nguồn phát hành token Google không hợp lệ.', 401);
    }

    if (!payload.email || String(payload.email_verified) !== 'true') {
      throw new AppError('Tài khoản Google chưa xác minh địa chỉ email.', 401);
    }

    return {
      sub: payload.sub || '',
      email: String(payload.email).trim().toLowerCase(),
      name: payload.name || '',
      picture: payload.picture || null,
      email_verified: true
    };
  }

  static async loginWithGoogle({ credential, verifier } = {}) {
    if (!credential) {
      throw new AppError('Thiếu thông tin xác thực Google.', 400);
    }

    const profile = typeof verifier === 'function'
      ? await verifier(credential)
      : await this.verifyGoogleCredential(credential);

    if (!profile || !profile.email || !profile.email_verified) {
      throw new AppError('Xác thực tài khoản Google thất bại.', 401);
    }

    let user = await User.findOne({ where: { email: profile.email } });
    if (!user && profile.sub) {
      user = await User.findOne({ where: { google_id: profile.sub } });
    }

    if (user) {
      if (!user.is_active) {
        throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
      }
      user.email_verified = true;
      user.email_verification_token = null;
      user.failed_login_attempts = 0;
      user.locked_until = null;
      if (profile.sub && !user.google_id) {
        user.google_id = profile.sub;
      }
      if (!user.avatar_url && profile.picture) {
        user.avatar_url = profile.picture;
      }
      if (typeof user.save === 'function') {
        await user.save();
      }
    } else {
      const localPart = profile.email.split('@')[0] || 'user';
      let baseUsername = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (baseUsername.length < 3) {
        baseUsername = `user${baseUsername}`.padEnd(6, '0');
      }
      baseUsername = baseUsername.slice(0, 40);

      let username = baseUsername;
      let attempts = 0;
      while (await User.findOne({ where: { username } })) {
        attempts += 1;
        const suffix = crypto.randomBytes(3).toString('hex');
        username = `${baseUsername.slice(0, 40)}${suffix}`;
        if (attempts > 5) break;
      }

      user = await User.create({
        username,
        email: profile.email,
        password_hash: crypto.randomBytes(24).toString('hex'),
        full_name: (profile.name || username).slice(0, 100),
        avatar_url: profile.picture || null,
        role: 'learner',
        email_verified: true,
        google_id: profile.sub || null
      });
    }

    const tokens = this.generateTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return { user, ...tokens };
  }
}

module.exports = AuthService;
