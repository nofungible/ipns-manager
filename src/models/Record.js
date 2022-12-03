const { DataTypes } = require('sequelize');

module.exports = function Record(sequelize) {
    sequelize.define('Record', {
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
        alias: {
          type: DataTypes.STRING,
          allowNull: false
        },
        cid: {
          type: DataTypes.STRING,
          allowNull: true
        },
        json: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },      
        key: {
          type: DataTypes.STRING,
          allowNull: false
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        // token: {
        //   type: DataTypes.UUID,
        //   references: {
        //     model: 'AccessToken',
        //     key: 'id'
        //   },
        //   allowNull: true,
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
      tableName: 'Record'
    });
};