const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE'
    },
    token_hash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    replaced_by_hash: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'refresh_tokens',
    indexes: [
      { fields: ['user_id', 'revoked_at'] }
    ]
  });

  return RefreshToken;
};
