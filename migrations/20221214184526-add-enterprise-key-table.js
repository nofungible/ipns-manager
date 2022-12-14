module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('EnterpriseKey', {
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
  down: async (queryInterface) => {
    await queryInterface.dropTable('EnterpriseKey');
  }
};