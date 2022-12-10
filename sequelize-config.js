require('dotenv')();

module.exports = {
    "development": {
        "username": process.env.IPNS_DATABASE_USERNAME,
        "password": process.env.IPNS_DATABASE_PASSWORD,
        "database": process.env.IPNS_DATABASE,
        "host": "127.0.0.1",
        "dialect": "postgres"
    }
};