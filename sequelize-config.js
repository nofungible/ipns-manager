require('dotenv')();

module.exports = {
    "development": {
        "username": IPNS_DATABASE_USERNAME,
        "password": IPNS_DATABASE_PASSWORD,
        "database": IPNS_DATABASE,
        "host": "127.0.0.1",
        "dialect": "postgres"
    }
};