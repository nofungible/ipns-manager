const { DataTypes } = require('sequelize');

module.exports = function AccessToken(sequelize) {
    sequelize.define('AccessToken', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        alias: {
          type: DataTypes.STRING,
          allowNull: false
        },
        permissionCsv: {
          type: DataTypes.STRING,
          allowNull: false,
          field: 'permission_csv'
        },
        urlCsv: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'url_csv'
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
      tableName: 'AccessToken'
    });
};