module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('InviteKey', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      key: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
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
    await queryInterface.dropTable('InviteKey');
  }
};