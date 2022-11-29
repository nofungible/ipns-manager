'use strict';

/**
 * @TODO hash password on client side with random salt sent by the server. calculate on return to ensure client hash. once this is verified by the server create a bcrypt hash of the client hash.
 * @TODO never show the secret key (user id) create a map of session key > secret key signed by the user's current password hash.
 * this allows them to have secure access w/o exposing the user id(secret key) via the JWT payload. This also alolows the user to
 * be able to invalidate device sessions by resetting their password and by revoking a specific session key from the map.
 * 
 * @TODO hash password on the client side before sending it to the backend
 * @TODO maybe don't use the password on the account link page. have some kind of code that you get when you generate the device link url.
 * @TODO make device link URLs short lived
 * @TODO Sticky footer w/ donation message, donation page
 */

const DB_FILE = `${__dirname}/address_map.json`;
const KEY_FILE = `${__dirname}/server_key.json`;
const COOKIE_NAME = 'NO_FUNGIBLE_DNS_SESSION';

const fs = require('fs');
const {v4: uuid} = require('uuid');

try {
    fs.writeFileSync(DB_FILE, JSON.stringify({__salt: uuid(), __session: {}, __record: {}}), { flag: 'wx' });
} catch (err) {
    if (err.code !== 'EEXIST') {
        throw err;
    }
}

try {
    fs.writeFileSync(KEY_FILE, JSON.stringify({key: uuid(), apiKey: uuid()}), { flag: 'wx' });
} catch (err) {
    if (err.code !== 'EEXIST') {
        throw err;
    }
}

const {key: SERVER_KEY, apiKey: SERVER_API_KEY} = require(KEY_FILE);
const LINK_KEY = uuid();

const axios = require('axios');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const express = require('express');
const jwt = require('jsonwebtoken');
const {exec} = require('child_process');
const {promisify} = require('util');
const {createHmac} = require('crypto');

const db = require(DB_FILE);
const app = express();
const state = {linkKeyMap: {}};

let cacheDbTimeout;

app.use(express.static(`${__dirname}/www`));
app.use(express.json());
app.use(cookieParser());
app.use(noCacheHeaders);
// Unauthenticated Routes

app.post('/api/account/create', verifyPw, _async(async (req, res) => {
    const {pw} = req.body;
    const hash = await promisify(bcrypt.hash)(pw, 10);
    const accountId = uuid();

    db.__record[accountId] = {id: accountId, hash, keyMap: {}, apiKeyMap: {}};

    const authToken = await generateAuthToken(accountId);

    res.cookie(COOKIE_NAME, authToken, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    return res.send({id: accountId});
}));

app.put('/api/account/device/link', verifyPw, _async(async (req, res) => {
    if (!req.body.token) {
        return res.send({success: false});
    }

    const {account, session} = {} = await validateDeviceLinkSession(req.body.token);

    if (!account) {
        return res.send({success: false});
    }

    const valid = await promisify(bcrypt.compare)(req.body.pw, account.hash);

    if (!valid) {
        return res.send({success: false});
    }

    delete state.linkKeyMap[session.linkKey];

    const authToken = await generateAuthToken(account.id);

    res.cookie(COOKIE_NAME, authToken, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    return res.send({success: true});
}));

app.post('/api/account/recover', _async(async (req, res, next) => {
    const id = req.body.id;

    if (!id) {
        return res.send({success: false});
    }

    const account = db.__record[id];

    if (!account) {
        return res.send({success: false});
    }

    const valid = await promisify(bcrypt.compare)(req.body.pw, account.hash);

    if (!valid) {
        return res.send({success: false});
    }

    const authToken = await generateAuthToken(account.id);

    res.cookie(COOKIE_NAME, authToken, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    return res.send({success: true});
}));

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

app.get('/account/device/link', _async(async (req, res, next) => {
    const valid = await validateDeviceLinkSession(req.query.key);

    if (!valid) {
        return res.redirect('/error');
    }

    return next();
}), (req, res) => {
    res.sendFile(`${__dirname}/www/account-device-link.html`);
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
        return res.redirect('/error');
    }

    const sessionId = verify.id;
    const session = db.__session[sessionId];

    if (!session) {
        return res.redirect('/error');
    }

    const account = db.__record[session.id];

    if (!account) {
        return res.redirect('/error');
    }

    const hash = hashSessionId(sessionId, account.hash);

    if (hash !== session.hash) {
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

    const createdAt = Date.now();
    const id = uuid();
    const key = await generateIPFSKey(id);

    db.__record[req.session.id].keyMap[id] = {
        id,
        alias,
        ipfs: {
            key,
            cid: null,
        },
        cid: null,
        status: 0,
        createdAt,
        updatedAt: createdAt,
        creator: req.session.identifier || null,
        metadata: {}
    };

    return res.send({id, alias, ipfs: {key}});
}));

app.patch('/api/record/:id', cors(), _async(verifyToken), _async(async (req, res) => {
    const record = db.__record[req.session.id].keyMap[req.params.id];

    if (!record) {
        return res.send({success: false});
    }

    const {alias, metadata} = req.body;

    if (!alias && !metadata) {
        return res.send({success: false});
    }

    if (alias) {
        record.alias = alias;
    }

    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
        record.metadata = metadata;
    }

    record.updatedAt = Date.now();

    return res.send(record);
}));

app.delete('/api/record/:id', cors(), _async(verifyToken), _async(async (req, res) => {
    const record = db.__record[req.session.id].keyMap[req.params.id];

    if (!record) {
        return res.send({success: false});
    }

    await deleteIPFSKey(record.id);

    db.removedElements = db.removedElements || [];

    db.removedElements.push(db.__record[req.session.id].keyMap[req.params.id]);

    delete db.__record[req.session.id].keyMap[req.params.id];

    return res.send(record);
}));

app.get('/api/record/list', cors(), _async(verifyToken), _async((req, res) => {
    let records = Object.values(db.__record[req.session.id].keyMap);

    if (req.session.validateIdentifier) {
        records = records.filter((r) => {
            return r.creator && r.creator === req.session.identifier;
        });
    }

    return res.send(records);
}));

app.get('/api/record/:id', cors(), _async(verifyToken), function (req, res) {
    const record = db.__record[req.session.id].keyMap[req.params.id];

    if (req.session.validateIdentifier && (!record.creator || record.creator !== req.session.identifier)) {
        return res.send(null);
    }

    return res.send(record);
});

app.put('/api/record/:id', cors(), _async(verifyToken), _async(async (req, res) => {
    let {cid, json} = req.body;

    if (!cid && !json) {
        return res.send({success: false});
    }

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

    if (req.session.validateIdentifier) {
        const record = db.__record[req.session.id].keyMap[req.params.id];

        if (!record.creator || record.creator !== req.session.identifier) {
            return res.send({success: false, error: 'Invalid permissions'});
        }
    }

    const fileKey = `${__dirname}/CID_TEMP_${Date.now()}.json`;

    if (json) {
        await promisify(exec)(`touch ${fileKey}`);
        await promisify(fs.writeFile)(fileKey, JSON.stringify(json));         

        const {
            err,
            stdout
        } = await promisify(exec)(`ipfs add --quieter ${fileKey}`);

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

        cid = stdout.trim();
    }

    (async () => {
        try {
            await publishIPFSName(req.params.id, encodeURIComponent(cid), req.session.id, {skipCache: !!json});
        } catch (err) {
            console.error('Failed to publish IPFS record');

            return console.error(err);
        }

        if (json) {
            const {cid: existingCID} = db.__record[req.session.id].keyMap[req.params.id];
    
            if (existingCID) {
                promisify(exec)(`ipfs pin rm ${existingCID}`).catch(console.error);
            }
        }

        db.__record[req.session.id].keyMap[req.params.id].cid = cid;

        try {
            await promisify(exec)(`rm ${fileKey}`);
        } catch (err) {
            console.error('Failed to remove IPFS record cache');
            console.error(err);
        }
    })();

    return res.send({success: true, cid});
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

app.get('/api/account/token/list', _async(async (req, res) => {
    const tokenIdSet = Object.keys(db.__record[req.session.id].apiKeyMap);
    const tokenSet = tokenIdSet.reduce((acc, tid) => {
        const session = db.__session[tid] ? JSON.parse(JSON.stringify(db.__session[tid])) : null;

        if (session) {
            acc.push(Object.assign(session, {id: tid, hash: undefined}));
        }

        return acc;
    }, []);

    return res.send(tokenSet);
}));

app.delete('/api/account/token/:id', _async(async (req, res, next) => {
    if (!db.__record[req.session.id].apiKeyMap || !db.__record[req.session.id].apiKeyMap[req.params.id]) {
        return res.send({success: false});
    }

    delete db.__session[req.params.id];
    delete db.__record[req.session.id].apiKeyMap[req.params.id];

    return res.send({success: true});
}));

app.post('/api/account/token', _async(async (req, res, next) => {
    let {alias, urlSet, permissionSet} = req.body;

    if (!alias || !permissionSet || !permissionSet.length) {
        return res.send({success: false});
    }

    urlSet = urlSet || ['*'];

    const account = db.__record[req.session.id];

    if (!account) {
        return res.send({token: null});
    }

    const id = uuid();
    const token = await promisify(jwt.sign)({id}, SERVER_API_KEY);
    const hash = hashSessionId(id, account.hash);

    db.__record[account.id].apiKeyMap[id] = Date.now();
    db.__session[id] = {id: account.id, alias, urlSet, permissionSet, hash};

    return res.send({token, id})
}));

app.post('/api/account/password/reset', _async(async (req, res, next) => {
    const {
        id,
        pw0,
        pw1,
        pw2
    } = req.body;

    if (
        id !== req.session.id
        || !pw0
        || !pw1
        || !pw2
        || pw1 !== pw2
    ) {
        return res.send({success: false})
    }

    const valid = await promisify(bcrypt.compare)(pw0, db.__record[id].hash);

    if (!valid) {
        return res.send({success: false})
    }

    db.__record[id].hash = await promisify(bcrypt.hash)(pw1, 10);

    const cookie = await generateAuthToken(id);

    res.cookie(COOKIE_NAME, cookie, {maxAge: 5 * 365 * 24 * 60 * 60 * 1000, httpOnly: true});

    res.send({success: true});
}));

app.post('/api/account/device/link', _async(async (req, res) => {
    const linkKey = createLinkKey(req.session.id);
    const linkToken = await promisify(jwt.sign)({
        i: linkKey,
        c: Date.now()
    }, LINK_KEY);

    return res.send({key: linkToken});
}));

cacheDb();

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

function cacheDb() {
    cacheDbTimeout && clearTimeout(cacheDbTimeout);

    fs.writeFile(DB_FILE, JSON.stringify(db), function (err) {
        if (err) {
            console.error('Failed to write persistent DB cache');
            console.error(err);

            return process.exit(1);
        }

        cacheDbTimeout = setTimeout(cacheDb, 5000);
    });
}

async function generateAuthToken(accountId) {
    const sessionId = createAccountSession(accountId);

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
    db.__record[sessionId].keyMap[id].status = 1;

    let cacheTimeout;
    let timeout;
    let controller;

    const now = Date.now();

    if (skipCache !== true) {
        await promisify(exec)(`touch ${__dirname}/${now}.json`);
    }

    // TODO remove the file, double check cache logic and make sure it will keep trying no matter what. put a stall in if you need to.
    try {
        if (skipCache !== true) {
            await new Promise((resolve, reject) => {
                cache(resource, `${__dirname}/${now}.json`, resolve, reject).then(resolve).catch(reject);
            });
        }

        await new Promise((resolve, reject) => {
            publish(timeout, controller, resolve, reject).then(resolve).catch(reject);
        });

        if (skipCache !== true) {
            await Promise.all([
                promisify(exec)(`ipfs pin rm ${resource}`),
                promisify(exec)(`rm ${__dirname}/${now}.json`)
            ]);
        }
    } catch (err) {
        console.error(err);
    }

    async function cache(cid, fileName, resolve, reject, retries = 1) {
        console.log('caching', cid);

        const controller = new AbortController();

        cacheTimeout && clearTimeout(cacheTimeout);

        cacheTimeout = setTimeout(() => {
            controller.abort();
        }, 10000);

        try {
            const {
                error
            } = await promisify(exec)(`curl -X GET https://cloudflare-ipfs.com/ipfs/${encodeURIComponent(cid)} > ${fileName}`, {signal: controller.signal});
        
            if (error) {
                return reject(error);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                return setTimeout(() => {
                    return cache(cid, fileName, resolve, reject, retries + 1);
                }, retries > 2 ? 10000 : 5000);
            }

            return reject(err);
        }

        cacheTimeout && clearTimeout(cacheTimeout);

        await promisify(exec)(`ipfs add ${fileName}`);

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
            } = await promisify(exec)(`ipfs name publish --key=${encodeURIComponent(id)} ${encodeURIComponent(resource)}`, {signal: controller.signal});

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
            db.__record[sessionId].keyMap[id].status = 3;

            return reject(Object.assign(new Error('Failed to publish name resource'), {id, resource, stderr}));
        } else if (stdout.includes('Published to') && stdout.includes(resource)) {
            console.log('published', id, resource);

            db.__record[sessionId].keyMap[id].status = 2;
            db.__record[sessionId].keyMap[id].ipfs.cid = resource;

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

function createAccountSession(accountId) {
    if (!db.__record[accountId] || !db.__record[accountId].hash) {
        throw new Error('Invalid hash payload');
    }

    const sessionId = uuid();
    const sessionHash = hashSessionId(sessionId, db.__record[accountId].hash);

    db.__session[sessionId] = {hash: sessionHash, createdAt: Date.now(), id: accountId};

    return sessionId;
}

function createLinkKey(accountId) {
    if (!db.__record[accountId] || !db.__record[accountId].hash) {
        throw new Error('Invalid hash payload');
    }

    const linkKey = uuid();
    const linkHash = hashSessionId(linkKey, db.__record[accountId].hash);

    state.linkKeyMap[linkKey] = {hash: linkHash, createdAt: Date.now(), id: accountId};

    return linkKey;
} 

function hashSessionId(sessionId, pwHash) {
    return createHmac('sha256', pwHash)
        .update(sessionId)
        .digest('hex');
}

async function validateDeviceLinkSession(token) {
    const {
        i: linkKey,
        c: createdAt
    } = (await promisify(jwt.verify)(token, LINK_KEY)) || {};

    if (
        (!linkKey || !createdAt)
        || (Date.now() - parseInt(createdAt) > 300000)
        || !state.linkKeyMap[linkKey]
    ) {
        return false;
    }

    const linkKeySession = state.linkKeyMap[linkKey];

    if (!linkKeySession) {
        return false;
    }

    const account = db.__record[linkKeySession.id];

    if (!account) {
        return false;
    }

    const hash = hashSessionId(linkKey, account.hash);

    if (hash !== linkKeySession.hash) {
        return false;
    }

    return {account, session: {linkKey, createdAt}};
}

async function validateAPIToken(req) {
    const bearerToken = req.headers['no-fungible-auth-token'] || req.headers['authorization'];

    if (!bearerToken) {
        return false;
    }

    const token = bearerToken.split('Bearer ')[1];

    if (!token) {
        return false;
    }

    const {
        id: sessionId,
    } = (await promisify(jwt.verify)(token, SERVER_API_KEY)) || {};

    if (!sessionId) {
        return false;
    }

    const session = db.__session[sessionId];

    if (!session) {
        return false;
    }

    const {id, hash: storedHash} = session;
    const account = db.__record[id];

    if (!account) {
        return false;
    }

    const hash = hashSessionId(sessionId, account.hash);

    if (hash !== storedHash) {
        return false;
    }

    return {session, sessionId};
}

async function verifyToken(req, res, next) {
    if (req.session) {
        return next();
    }

    const permissionMap = {
        READ: ['GET'],
        WRITE: ['POST', 'PUT']
    };

    const {
        session: {
            id,
            urlSet,
            permissionSet,
        } = {},
        sessionId
    } = {} = await validateAPIToken(req);

    if (!id) {
        return res.send({success: false});
    }

    const permissionList = permissionSet.reduce((acc, p) => [...acc, ...(permissionMap[p] || [])], []);

    if (!permissionList.includes(req.method)) {
        return res.send({success: false});
    }

    if (urlSet && urlSet.length && !urlSet.includes(req.hostname) && JSON.stringify(urlSet) !== JSON.stringify(['*'])) {
        return res.send({success: false});
    }

    req.session = {id};
    req.session.identifier = sessionId;

    if (permissionSet.includes('SELF_ONLY')) {
        req.session.validateIdentifier = true;
    }

    return next();
}

// Beware input exec is viable to take an injection attack hit
// async function createPointerResourceLocalCache(cid) {
//     try {
//         console.log('caching', cid);

//         const now = Date.now();

//         const {
//             error,
//             stdout,
//             stderr
//         } = await promisify(exec)(`touch ${__dirname}/${now}.json && curl -X GET https://cloudflare-ipfs.com/ipfs/${encodeURIComponent(cid)} > ${__dirname}/${now}.json && ipfs add ${__dirname}/${now}.json`);
    
//         if (!stdout.includes(cid)) {
//             const err = new Error('Failed to cache name resource - unknown output', error, stderr, stdout);

//             err.stderr = 'IPFS_CID_MISMATCH';

//             throw err;
//         }

//         return `${__dirname}/${now}.json`;
//     } catch (err) {
//         console.error(err);
//     }
// }
