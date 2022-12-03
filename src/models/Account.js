const { DataTypes } = require('sequelize');

module.exports = function Account(sequelize) {
    sequelize.define('Account', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        hash: {
          type: DataTypes.STRING,
          allowNull: false
        },
        walletAddress: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'wallet_address'
        },
        secretKey: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          field: 'secret_key'
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
      tableName: 'Account'
    });
};