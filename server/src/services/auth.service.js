const jwt = require('jsonwebtoken');
const config = require('../config/app');
const AppError = require('../utils/AppError');
const { User } = require('../models');

class AuthService {
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

    const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  static async register({ username, email, password, full_name, role = 'learner' }) {
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

    const user = await User.create({
      username,
      email,
      password_hash: password,
      full_name,
      role
    });

    const tokens = this.generateTokens(user);
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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  }

  static async refreshToken(token) {
    if (!token) {
      throw new AppError('Refresh token không hợp lệ.', 400);
    }

    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret);
      const user = await User.findByPk(decoded.id);

      if (!user || !user.is_active) {
        throw new AppError('Tài khoản không tồn tại hoặc đã bị khóa.', 401);
      }

      const tokens = this.generateTokens(user);
      return { user, ...tokens };
    } catch (err) {
      throw new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
  }
}

module.exports = AuthService;
