const { DataTypes } = require('sequelize');

module.exports = function EnterpriseKey(sequelize) {
    sequelize.define('EnterpriseKey', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        // account: {
        //   type: DataTypes.UUID,
        //   references: {
        //     model: 'Account',
        //     key: 'id'
        //   },
        //   allowNull: false,
        //   onUpdate: 'CASCADE',
        //   onDelete: 'NO ACTION',
        // },
        createdAt: {
          type: DataTypes.DATE,
          field: 'created_at'
        },
        updatedAt: {
          type: DataTypes.DATE,
          field: 'updated_at'
        }
    }, {
      tableName: 'EnterpriseKey'
    });
};