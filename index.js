'use strict';

const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'temp');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

require('dotenv').config()

const {Account, AccessToken, Cookie, Record} = require('./src/models');

const KEY_FILE = `${__dirname}/server_key.json`;
const COOKIE_NAME = 'NO_FUNGIBLE_DNS_SESSION';

const {v4: uuid} = require('uuid');
const {getPkhfromPk, verifySignature} = require('@taquito/utils');

try {
    fs.writeFileSync(KEY_FILE, JSON.stringify({key: uuid(), apiKey: uuid()}), { flag: 'wx' });
} catch (err) {
    if (err.code !== 'EEXIST') {
        throw err;
    }
}

const {key: SERVER_KEY, apiKey: SERVER_API_KEY} = require(KEY_FILE);

const axios = require('axios');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const express = require('express');
const jwt = require('jsonwebtoken');
const {exec} = require('child_process');
const {promisify} = require('util');
const {createHmac} = require('crypto');

const app = express();

app.use(express.static(`${process.cwd()}/www`));
app.use(express.json());
app.use(cookieParser());
app.use(noCacheHeaders);

/**
 * Unauthenticated Routes
 */

app.post('/api/account/create', verifyPw, _async(async (req, res) => {
    const {pw, message, pubkey, address, signature} = req.body;

    if (!verifySignature(message, pubkey, signature)) {
        console.error('Invalid signature');

        return res.send({success: false});
    }

    if (getPkhfromPk(pubkey) !== address) {
        console.error('Address mismatch');

        return res.send({success: false});
    }

    const hash = await promisify(bcrypt.hash)(pw, 10);
    const [account, created] = await Account.findOrCreate({
        where: {walletAddress: address},
        defaults: {
            hash,
            walletAddress: address
        }
    });

    if (!created) {
        console.error('Account exists');

        return res.send({success: false});
    }

    const cookie = await createAccountCookie(account);

    res.cookie(COOKIE_NAME, cookie, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    return res.send({key: account.secretKey});
}));

// @TODO store device info
app.put('/api/account/device/link', _async(async (req, res) => {
    const {message, pubkey, address, signature} = req.body;

    if (!verifySignature(message, pubkey, signature)) {
        console.error('Invalid signature');

        return res.send({success: false});
    }

    if (getPkhfromPk(pubkey) !== address) {
        console.error('Address mismatch');

        return res.send({success: false});
    }

    const account = await Account.findOne({where: {walletAddress: address}});

    if (!account) {
        console.error('Account does not exist');

        return res.send({success: false});
    }

    const cookie = await createAccountCookie(account);

    res.cookie(COOKIE_NAME, cookie, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    return res.send({success: true});
}));

app.post('/api/account/recover', _async(async (req, res, next) => {
    const key = req.body.key;

    if (!key) {
        return res.send({success: false});
    }

    const account = await Account.findOne({where: {secretKey: key}});

    if (!account) {
        return res.send({success: false});
    }

    const valid = await promisify(bcrypt.compare)(req.body.pw, account.hash);

    if (!valid) {
        return res.send({success: false});
    }

    const cookie = await createAccountCookie(account);

    res.cookie(COOKIE_NAME, cookie, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    return res.send({success: true});
}));

app.use((err, req, res, next) => {
    console.error('Request failure:', err);

    return res.send({success: false});
});

app.get('/', (req, res) => {
    if (req.cookies[COOKIE_NAME]) {
        return res.redirect('/manage');
    }

    return res.redirect('/about');
});

app.get('/sign-out', (req, res) => {
    res.clearCookie(COOKIE_NAME);

    return res.redirect('/');
});

app.get('/about', (req, res) => {
    res.sendFile(`${__dirname}/www/about.html`);
});

app.get('/account/register', (req, res) => {
    res.sendFile(`${__dirname}/www/account-register.html`);
});

app.get('/account/recover', (req, res) => {
    res.sendFile(`${__dirname}/www/account-recover.html`);
});

app.get('/account/password/reset', (req, res) => {
    res.sendFile(`${__dirname}/www/account-password-reset.html`);
});

app.get('/about', (req, res) => {
    res.sendFile(`${__dirname}/www/about.html`);
});

app.get('/error', (req, res) => {
    res.sendFile(`${__dirname}/www/error.html`);
});

app.get('/manage', (req, res, next) => {
    if (req.cookies[COOKIE_NAME]) {
        return next();
    }

    return res.redirect('/account/register');
});

// Authenticated Routes

app.use(_async(async (req, res, next) => {
    if (!req.cookies[COOKIE_NAME]) {
        return next();
    }

    const verify = await promisify(jwt.verify)(req.cookies[COOKIE_NAME], SERVER_KEY);

    if (!verify || !verify.id) {
        console.error('bad jwt');

        return res.redirect('/error');
    }

    const cookieId = verify.id;

    const {
        Account: account,
        hash: cookieHash
    } = await Cookie.findByPk(cookieId, {
        include: {
            model: Account
        }
    });

    if (!account) {
        console.error('no account');

        return res.redirect('/error');
    }

    if (hashText(cookieId, account.hash) !== cookieHash) {
        console.error('session hash mismatch');

        return res.redirect('/error');
    }

    req.session = {id: account.id};

    return next();
}));

app.post('/api/record', cors(), _async(verifyToken), _async(async (req, res) => {
    const {alias} = req.body;

    if (!alias) {
        return res.send({success: false});
    }

    const recordCount = await Record.count({where: {account: req.session.id}});

    if (recordCount > 5) {
        return res.send({success: false});
    }

    const id = uuid();
    const record = await Record.create(
        Object.assign({
            id,
            key: await generateIPFSKey(id),
            account: req.session.id,
            alias
        }, req.session.identifier ? {token: req.session.identifier} : {})
    );

    return res.send(record);
}));

app.get('/api/record/list', cors(), _async(verifyToken), _async(async (req, res) => {
    const records = await Record.findAll({
        where: Object.assign(
            {account: req.session.id}
            , req.session.identifier ? {token: req.session.identifier} : {}
        )
    });

    return res.send(records);
}));

// PATCH is not an allowed action with API tokens, so we don't need to verify record ownership.
app.patch('/api/record/:id', _async(verifyToken), _async(async (req, res) => {
    const {alias} = req.body;

    if (!alias) {
        return res.send({success: false});
    }

    const record = await Record.findOne({
        where: {
            id: req.params.id,
            account: req.session.id
        }
    });

    if (!record) {
        return res.send({success: false});
    }

    record.alias = alias;

    await record.save();

    return res.send(Object.assign({}, record.toJSON(), {alias}));
}));

app.delete('/api/record/:id', cors(), _async(verifyToken), _async(fetchVerifiedRecord), _async(async (req, res) => {
    const {
        key,
        cid,
        json
    } = req.verifiedRecord;

    await deleteIPFSKey(key);

    if (json) {
        try {
            await promisify(exec)(`docker exec ipfs-kubo ipfs pin rm ${cid}`);
        } catch (err) {
            console.error('Failed to remove DELETE record pin', err);
        }
    }

    // @TODO retain records some way
    await req.verifiedRecord.destroy();

    return res.send(req.verifiedRecord);
}));

app.get('/api/record/:id', cors(), _async(verifyToken), _async(fetchVerifiedRecord), function (req, res) {
    return res.send(req.verifiedRecord);
});

app.put(
    '/api/record/:id',
    cors(),
    _async(verifyToken),
    // Verify valid payload exists.
    (req, res, next) => {
        let {cid, json} = req.body;

        if (!cid && !json) {
            return res.send({success: false});
        }

        // Ensure JSON doesn't exceed size limitation, and that it's valid JSON.
        if (json) {
            if (Buffer.byteLength(json, 'utf8') > 10000000) {
                return res.send({success: false, error: 'JSON size exceeded'});
            }
    
            try {
                json = JSON.parse(json);
            } catch (err) {
                console.error('Failed to parse JSON');
    
                return res.send({success: false, error: 'JSON invalid'})
            }
        }

        return next();
    },
    _async(fetchVerifiedRecord),
    _async(async (req, res) => {
        let {cid, json} = req.body;

        const fileName = `CID_TEMP_${Date.now()}.json`;
        const fileKey = `${__dirname}/temp/${fileName}`;

        // Create JSON file and pin it before creating name records.
        if (json) {
            await promisify(exec)(`touch ${fileKey}`);
            await promisify(fs.writeFile)(fileKey, json);         

            const {
                err,
                stdout
            } = await promisify(exec)(`docker exec ipfs-kubo ipfs add --quieter /data/temp/${fileName}`);

            if (err) {
                console.error(err);
                promisify(exec)(`rm ${fileKey}`).catch(console.error);

                return res.send({success: false, error: 'err'});
            }

            if (!stdout.trim()) {
                console.error('no cid for json');
                promisify(exec)(`rm ${fileKey}`).catch(console.error);

                return res.send({success: false, error: 'err'});
            }

            // Override CID with JSON file CID
            cid = stdout.trim();
        }

        // Publish name in background.
        (async () => {
            try {
                // Skip caching CID content when storing raw JSON for user.
                await publishIPFSName(req.params.id, encodeURIComponent(cid), req.session.id, {skipCache: !!json});
            } catch (err) {
                console.error('Failed to publish IPFS record');

                return console.error(err);
            }

            // Remove pinned JSON file now that the other JSON file/name has been published.
            if (json) {
                const {cid: existingCID} = req.verifiedRecord;
        
                if (existingCID) {
                    promisify(exec)(`docker exec ipfs-kubo ipfs pin rm ${existingCID}`).catch(console.error);
                }

                req.verifiedRecord.json = true;
            } else {
                req.verifiedRecord.json = false;
            }

            req.verifiedRecord.cid = cid;

            await req.verifiedRecord.save();

            // Remove pin cache file.
            try {
                await promisify(exec)(`rm ${fileKey}`);
            } catch (err) {
                console.error('Failed to remove IPFS record cache');
                console.error(err);
            }
        })();

        return res.send(Object.assign({}, req.verifiedRecord.toJSON(), {cid, json: !!json}));
    }));

app.use((req, res, next) => {
    if (!req.session) {
        return res.redirect('/error');
    }

    return next();
});

app.get('/manage', (req, res) => {
    res.sendFile(`${__dirname}/www/manage.html`);
});

app.post('/api/account/token', _async(async (req, res, next) => {
    let {
        alias,
        urlCsv,
        permissionCsv
    } = req.body;

    alias = alias.trim();
    urlCsv = urlCsv ? urlCsv.trim() : null;
    permissionCsv = permissionCsv.trim();

    const validPermissionCsvSet = [
        'READ',
        'WRITE',
        'READ,WRITE',
        'READ,WRITE,SELF_ONLY'
    ];

    if (!alias || !permissionCsv || !validPermissionCsvSet.includes(permissionCsv)) {
        return res.send({success: false});
    }

    const {
        id: accountId,
        hash: accountHash,
    } = (await Account.findByPk(req.session.id)) || {};

    if (!accountHash) {
        return res.send({token: null});
    }

    const id = uuid();
    const token = await promisify(jwt.sign)({id}, SERVER_API_KEY);
    const hash = hashText(id, accountHash); 

    await AccessToken.create({
        id,
        alias,
        permissionCsv,
        urlCsv,
        account: accountId,
        hash
    });

    return res.send({token, id})
}));

app.get('/api/account/token/list', _async(async (req, res) => {
    const tokens = await AccessToken.findAll({
        where: {
            account: req.session.id
        }
    });

    return res.send(tokens);
}));

app.delete('/api/account/token/:id', _async(async (req, res, next) => {
    const token = await AccessToken.findOne({
        where: {
            id: req.params.id,
            account: req.session.id
        }
    });

    if (!token) {
        return res.send({success: false});
    }

    await token.destroy();

    return res.send({success: true});
}));

app.post('/api/account/password/reset', _async(async (req, res, next) => {
    const {
        key: secretKey,
        pw0,
        pw1,
        pw2
    } = req.body;

    if (
        !secretKey
        || !pw0
        || !pw1
        || !pw2
        || pw1 !== pw2
    ) {
        return res.send({success: false})
    }

    const account = await Account.findOne({
        where: {
            id: req.session.id,
            secretKey
        }
    });

    if (!account) {
        return res.send({success: false})
    }

    const valid = await promisify(bcrypt.compare)(pw0, account.hash);

    if (!valid) {
        return res.send({success: false})
    }

    account.hash = await promisify(bcrypt.hash)(pw1, 10);

    account.save();

    const cookie = await createAccountCookie(id);

    res.cookie(COOKIE_NAME, cookie, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    res.send({success: true});
}));

app.use((err, req, res, next) => {
    console.error('Request failure:', err);

    return res.redirect('/error');
});

app.listen(3031);

function _async(cb) {
    return function (req, res, next) {
        return Promise.resolve()
            .then(() => {
                return cb(req, res, next);
            })
            .catch(next);
    };
}

async function createAccountCookie(account) {
    const sessionId = uuid();
    const sessionHash = hashText(sessionId, account.hash);

    await Cookie.create({
        id: sessionId,
        account: account.id,
        hash: sessionHash
    });

    return promisify(jwt.sign)({id: sessionId}, SERVER_KEY);
}

async function generateIPFSKey(name) {
    const {Id: key} = (await axios({
        method: 'POST',
        url: `http://127.0.0.1:5001/api/v0/key/gen?arg=${name}`
    })).data;

    return key;
}

async function deleteIPFSKey(name) {
    const {keys: [{Id: key} = {}] = []} = (await axios({
        method: 'POST',
        url: `http://127.0.0.1:5001/api/v0/key/rm?arg=${name}`
    })).data;

    return key;
}

async function publishIPFSName(id, resource, sessionId, {skipCache} = {}) {
    await Record.update({status: 1}, {where: {id}});

    let cacheTimeout;
    let timeout;
    let controller;

    const now = Date.now();

    if (skipCache !== true) {
        await promisify(exec)(`touch ${__dirname}/temp/${now}.json`);
    }

    try {
        if (skipCache !== true) {
            try {
                // @TODO This probably should go, or be rewritten w/o public gateways. Rate limits can't be bottleneck.
                await new Promise((resolve, reject) => {
                    cache(resource, `${__dirname}/temp/${now}.json`, resolve, reject).then(resolve).catch(reject);
                });
            } catch (err) {
                console.error('Pin caching failed', err);
                // try {
                //     await promisify(exec)(`docker exec ipfs-kubo ipfs get ${resource}`);
                // } catch (err) {
                //     console.error('Fallback pin caching failed', err);
                //     resolve();
                // }
            }
        }

        await new Promise((resolve, reject) => {
            publish(timeout, controller, resolve, reject).then(resolve).catch(reject);
        });

        if (skipCache !== true) {
            promisify(exec)(`docker exec ipfs-kubo ipfs pin rm ${resource}`).catch(console.error);
            promisify(exec)(`rm ${__dirname}/temp/${now}.json`).catch(console.error);
        }
    } catch (err) {
        console.error(err);

        await Record.update({status: 3}, {where: {id}});
    }

    async function cache(cid, fileName, resolve, reject, retries = 1) {
        cid = encodeURIComponent(cid);

        console.log('caching', cid);

        const controller = new AbortController();

        cacheTimeout && clearTimeout(cacheTimeout);

        cacheTimeout = setTimeout(() => {
            controller.abort();
        }, 10000);

        try {
            const {
                error
                // @TODO Deal with cloudflare not working. We need a better pin fetching solution here even.
            } = await promisify(exec)(`curl -X GET https://cloudflare-ipfs.com/ipfs/${cid} > ${fileName}`, {signal: controller.signal});
        
            if (error) {
                return reject(error);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return setTimeout(() => {
                    return cache(cid, fileName, resolve, reject, retries + 1);
                }, retries > 2 ? 10000 : 5000);
            }

            reject(err);
        }

        cacheTimeout && clearTimeout(cacheTimeout);

        const internalFile = `/data/temp/${fileName.split('/').slice(-1).pop()}`;

        await promisify(exec)(`docker exec ipfs-kubo ipfs add ${internalFile}`);

        resolve();
    }

    async function publish(timeout, controller, resolve, reject, retries) {
        retries = retries || 1;

        if (retries > 5) {
            return reject(Object.assign(new Error('Too many IPNS publish attempts'), {id, resource}));
        }

        console.log('publishing', id, resource);

        controller && controller.abort();
        timeout && clearTimeout(timeout);

        controller = new AbortController();
        timeout = setTimeout(() => {
            controller.abort();
        }, retries > 2 ? 10000 : 30000);

        let stdout, stderr;

        try {
            const {
                stdout: out,
                stderr: err
            } = await promisify(exec)(`docker exec ipfs-kubo ipfs name publish --key=${encodeURIComponent(id)} ${encodeURIComponent(resource)}`, {signal: controller.signal});

            timeout && clearTimeout(timeout);

            stdout = out;
            stderr = err;
        } catch (err) {
            timeout && clearTimeout(timeout);

            if (err.name === 'AbortError') {
                setTimeout(() => {
                    return publish(timeout, controller, resolve, reject, retries + 1);
                }, retries > 2 ? 10000 : 5000);
            }
    
            return reject(err);
        }
    
        if (stderr) {
            await Record.update({status: 3}, {where: {id}});

            return reject(Object.assign(new Error('Failed to publish name resource'), {id, resource, stderr}));
        } else if (stdout.includes('Published to') && stdout.includes(resource)) {
            console.log('published', id, resource);

            await Record.update({status: 2, cid: resource}, {where: {id}});

            return resolve();
        }

        return reject(Object.assign(new Error('Invalid publish output'), {stdout}));
    }
}

function verifyPw(req, res, next) {
    if (!req.body.pw) {
        return res.send({success: false});
    }

    return next();
}

function noCacheHeaders(req, res, next) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
    res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
    res.setHeader("Expires", "0");
    next();
}

function hashText(text, secret) {
    return createHmac('sha256', secret)
        .update(text)
        .digest('hex');
}

async function validateAPIToken(req) {
    const bearerToken = req.headers['no-fungible-auth-token'] || req.headers['authorization'];

    if (!bearerToken) {
        return null;
    }

    const ciphertext = bearerToken.split('Bearer ')[1];

    if (!ciphertext) {
        return null;
    }

    const {
        id: tokenId,
    } = (await promisify(jwt.verify)(ciphertext, SERVER_API_KEY)) || {};

    if (!tokenId) {
        return null;
    }

    const accessToken = await AccessToken.findByPk(tokenId, {include: Account});

    const {
        id: tokenPk,
        Account: {
            hash: accountHash
        } = {},
        hash: tokenHash
    } = accessToken || {};

    if (!accountHash || !tokenHash) {
        return null;
    }

    const hash = hashText(tokenPk, accountHash);

    if (hash !== tokenHash) {
        return null;
    }

    return accessToken;
}

async function fetchVerifiedRecord(req, res, next) {
    const record = await Record.findOne({
        where: Object.assign({
            id: req.params.id,
            account: req.session.id
        }, req.session.identifier ? {token: req.session.identifier} : {})
    });

    if (!record) {
        return res.send({success: false});
    }

    req.verifiedRecord = record;

    return next();
}

async function verifyToken(req, res, next) {
    if (req.session) {
        return next();
    }

    const permissionMap = {
        READ: ['GET'],
        WRITE: ['POST', 'PUT', 'DELETE']
    };

    const {
        id: tokenId,
        Account: {
            id: accountId
        },
        permissionCsv,
        urlCsv
    } = (await validateAPIToken(req)) || {};

    if (!accountId) {
        return res.send({success: false});
    }

    const permissionList = permissionCsv.split(',').reduce((acc, p) => [...acc, ...(permissionMap[p] || [])], []);

    if (
        !permissionList.includes(req.method)
        || urlCsv && !urlCsv.split(',').includes(req.hostname)
    ) {
        return res.send({success: false});
    }

    req.session = {id: accountId};

    if (permissionCsv.contains('SELF_ONLY')) {
        req.session.identifier = tokenId;
    }

    return next();
}