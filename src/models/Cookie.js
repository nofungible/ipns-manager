const { DataTypes } = require('sequelize');

module.exports = function Cookie(sequelize) {
    sequelize.define('Cookie', {
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
        //   onDelete: 'CASCADE',
        // },
        hash: {
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
      tableName: 'Cookie'
    });
};