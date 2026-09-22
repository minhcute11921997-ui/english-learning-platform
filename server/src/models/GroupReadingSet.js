const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GroupReadingSet = sequelize.define('GroupReadingSet', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'groups', key: 'id' }
    },
    reading_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'readings', key: 'id' }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'group_reading_sets',
    indexes: [
      { fields: ['group_id'] },
      { unique: true, fields: ['group_id', 'reading_id'] }
    ]
  });

  return GroupReadingSet;
};
