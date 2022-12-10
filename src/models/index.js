const Account = require('./Account');
const AccessToken = require('./AccessToken');
const Cookie = require('./Cookie');
const Record = require('./Record');
const InviteKey = require('./InviteKey');
const { Sequelize, DataTypes } = require('sequelize');
const Banned = require('./Banned');

const sequelize = new Sequelize({
    database: process.env.IPNS_DATABASE,
    username: process.env.IPNS_DATABASE_USERNAME,
    password: process.env.IPNS_DATABASE_PASSWORD,
    dialect: 'postgres',
    logging: false
});

Account(sequelize);
AccessToken(sequelize);
Cookie(sequelize);
Record(sequelize);
InviteKey(sequelize);
Banned(sequelize);

sequelize.models.Account.hasMany(sequelize.models.AccessToken, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'account'
    }
});

sequelize.models.AccessToken.belongsTo(sequelize.models.Account, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'account'
    }
});

sequelize.models.Account.hasMany(sequelize.models.Record, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'account'
    }
});

sequelize.models.Record.belongsTo(sequelize.models.Account, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'account'
    }
});

sequelize.models.Account.hasMany(sequelize.models.Cookie, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'account'
    }
});

sequelize.models.Cookie.belongsTo(sequelize.models.Account, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'account'
    }
});

sequelize.models.AccessToken.hasMany(sequelize.models.Record, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'token'
    }
});

sequelize.models.Record.belongsTo(sequelize.models.AccessToken, {
    foreignKey: {
        type: DataTypes.UUID,
        name: 'token'
    }
});

(async () => {
    try {
        await sequelize.authenticate();

        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Failed to connect to database');
        console.error(error);
        process.exit(1);
    }
})();

module.exports = Object.assign({}, sequelize.models, {sequelize});