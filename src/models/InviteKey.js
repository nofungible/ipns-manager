const { DataTypes } = require('sequelize');

module.exports = function InviteKey(sequelize) {
    sequelize.define('InviteKey', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        key: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        createdAt: {
          type: DataTypes.DATE,
          field: 'created_at'
        },
        updatedAt: {
          type: DataTypes.DATE,
          field: 'updated_at'
        }
    }, {
      tableName: 'InviteKey'
    });
};