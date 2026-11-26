const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminAuditLog = sequelize.define('AdminAuditLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL'
    },
    action: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    target_type: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    target_id: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true
    }
  }, {
    tableName: 'admin_audit_logs',
    indexes: [
      { fields: ['admin_id', 'created_at'] },
      { fields: ['action', 'created_at'] }
    ]
  });

  return AdminAuditLog;
};
