const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AiFeedback = sequelize.define('AiFeedback', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    image_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'SHA-256 của ảnh đã chuẩn hóa (không lưu ảnh gốc)'
    },
    predicted_word: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nhãn AI dự đoán'
    },
    corrected_word: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nhãn đúng do người dùng chọn (nếu AI sai)'
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Người dùng xác nhận dự đoán đúng hay sai'
    },
    tier: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tầng AI đã trả kết quả'
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Độ tin cậy dự đoán'
    }
  }, {
    tableName: 'ai_feedback',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['image_hash'] },
      { fields: ['is_correct'] }
    ]
  });

  return AiFeedback;
};
