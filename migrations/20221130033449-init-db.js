module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Account', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      secretKey: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'secret_key'
      },
      walletAddress: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'wallet_address'
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    await queryInterface.createTable('AccessToken', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      alias: {
        type: Sequelize.STRING,
        allowNull: false
      },
      permissionCsv: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'permission_csv'
      },
      urlCsv: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'url_csv'
      },
      account: {
        type: Sequelize.UUID,
        references: {
          model: 'Account',
          key: 'id'
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    await queryInterface.createTable('Cookie', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account: {
        type: Sequelize.UUID,
        references: {
          model: 'Account',
          key: 'id'
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    await queryInterface.createTable('Record', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      account: {
        type: Sequelize.UUID,
        references: {
          model: 'Account',
          key: 'id'
        },
        allowNull: false,
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      alias: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cid: {
        type: Sequelize.STRING,
        allowNull: true
      },
      json: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },      
      key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      token: {
        type: Sequelize.UUID,
        references: {
          model: 'AccessToken',
          key: 'id'
        },
        allowNull: true,
        onUpdate: 'CASCADE',
        onDelete: 'NO ACTION',
      },
      createdAt: {
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.dropTable('Record'),
      queryInterface.dropTable('AccessToken'),
      queryInterface.dropTable('Cookie'),
      queryInterface.dropTable('Account')
    ]);
  }
};