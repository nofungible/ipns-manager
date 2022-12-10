const { DataTypes } = require('sequelize');

module.exports = function Banned(sequelize) {
    sequelize.define('Banned', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        identifier: {
            type: DataTypes.STRING,
            allowNull: false
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
      tableName: 'Banned'
    });
};