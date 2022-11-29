(() => {
    const actionHandlers = {
        'create-api-key': createAPIKey,
        'create-link-url': submitCreateLinkDevice,
        'copy-target-text': copyTargetText,
        'create-record': createIPNSRecord,
        'hide-element': hideElement,
        'delete-api-key': deleteAPIKey
    };

    const statusKey =  {
        1: 'status-deploying',
        2: 'status-deployed',
        3: 'status-error'
    };

    hideElements();
    attachGestureHandlers();
    populateAddressList();
    populateAPIKeyList();

    function attachGestureHandlers() {
        document.querySelectorAll('.password-reveal').forEach((el) => {
            el.addEventListener('click', (evt) => {
                const input = evt.currentTarget.parentElement.getElementsByTagName('input').item(0);

                if (input.type === 'text') {
                    input.type = 'password';
                } else {
                    input.type = 'text';
                }
            });
        });

        document.querySelectorAll('.action-controller').forEach((el) => {
            el.addEventListener('click', (evt) => {
                const action = evt.currentTarget.getAttribute('data-action');

                if (actionHandlers[action]) {
                    actionHandlers[action](evt.currentTarget);
                }
            });
        });
    }

    function copyTargetText(el) {
        const target = el.getAttribute('data-target');
        const text = document.querySelector(target).innerText;

        if (!text) {
            return false;
        }

        copyText(text);

        el.innerText = '✅';

        setTimeout(() => {
            el.innerText = '📋';
        }, 5000);
    }

    function copyText(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .catch(function (err) {
                    console.error('Failed to copy settings to clipboard', err);
                });
        } else if (window.clipboardData) {
            try {
                window.clipboardData.setData("Text", text);
            } catch (err) {
                throw new Error('Unable to copy to clipboard');
            }
        } else {
            throw new Error('Unable to copy to clipboard');
        }
    }

    async function submitCreateLinkDevice() {
        document.querySelector('#copy-link-device-url').innerText = '📋';
        document.querySelector('#link-device-url').innerText = '';

        const {key} = await request('POST', '/api/account/device/link');
        const url = `${location.protocol}//${location.host}/account/device/link?key=${key}`;

        document.querySelector('#link-device-url').innerText = url;
    }

    async function request(method, path, body) {
        const response = await fetch(
            `${location.protocol}//${location.host}${path}`,
            Object.assign({
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            }, body ? {body: JSON.stringify(body)} : {})
        );

        return response.json();
    }

    async function populateAddressList() {
        const records = await request('GET', '/api/record/list');

        if (records && records.length) {
            document.querySelector('#address-table').innerHTML = '';

            records.forEach(async (r) => {
                if (r.status === 1) {
                    let timeout;

                    checkStatus(r.id);
                }

                document.querySelector('#address-table').innerHTML += 
                    `<div class="address-item">
                        <span id="address-status-${r.id}" class="address-status ${statusKey[r.status] ? statusKey[r.status] : ''}"></span>
                        <span class="address-alias" data-id="${r.id}" contenteditable>${r.alias}</span>
                        <div class="cid-input">
                            <span>Content CID:</span><input id="cid-input-${r.id}" type="text">
                        </div>
                        <p class="address-line">
                            <span class="address-label">IPNS:</span>
                            <span id="ipns-hash-${r.id}" class="address">${r.ipfs.key ? r.ipfs.key : ''}</span>
                            <span class="interactive action-controller" data-action="copy-target-text" data-target="#ipns-hash-${r.id}" style="margin-left: 5px; vertical-align: middle;">📋</span>
                        </p>
                        <p class="address-line">
                            <span class="address-label">CID:</span>
                            <span id="ipns-cid-${r.id}" class="address">${r.ipfs.cid ? r.ipfs.cid : ''}</span>
                            <span class="interactive action-controller" data-action="copy-target-text" data-target="#ipns-cid-${r.id}" style="margin-left: 5px; vertical-align: middle;">📋</span>
                        </p>
                        <p class="button deploy-record" data-target="#cid-input-${r.id}" data-id="${r.id}">DEPLOY</p>
                        <p class="button delete-record" data-id="${r.id}">DELETE</p>
                    </div>`;
            });

            document.querySelectorAll('#address-table .action-controller').forEach((el) => {
                el.addEventListener('click', (evt) => {
                    const action = evt.currentTarget.getAttribute('data-action');
    
                    if (actionHandlers[action]) {
                        actionHandlers[action](evt.currentTarget);
                    }
                });
            });

            document.querySelectorAll('.address-item .password-reveal').forEach((el) => {
                el.addEventListener('click', (evt) => {
                    const input = evt.currentTarget.parentElement.getElementsByTagName('input').item(0);
    
                    if (input.type === 'text') {
                        input.type = 'password';
                    } else {
                        input.type = 'text';
                    }
                });
            });

            document.querySelectorAll('.address-item .deploy-record').forEach((el) => {
                el.addEventListener('click', async function() {
                    if (!window.confirm('Are you sure you want to deploy this CID?')) {
                        return false;
                    }

                    const target = document.querySelector(el.getAttribute('data-target'));
                    const id = el.getAttribute('data-id');
                    const newCid = target.value;
    
                    if (newCid) {
                        await request('PUT', `/api/record/${id}`, {cid: newCid});

                        let timeout;

                        checkStatus(id, timeout);
                    }
                });
            });

            document.querySelectorAll('.address-item .delete-record').forEach((el) => {
                el.addEventListener('click', async () => {
                    if (window.confirm('Are you sure you want to delete this IPNS address?')) {
                        const id = el.getAttribute('data-id');
    
                        await request('DELETE', `/api/record/${id}`);

                        el.parentElement.remove();
                    }
                });
            });

            const keytimeouts = {};

            document.querySelectorAll('.address-item .address-alias').forEach((el) => {
                el.addEventListener('keyup', (evt) => {
                    const id = evt.currentTarget.getAttribute('data-id');

                    keytimeouts[id] && clearTimeout(keytimeouts[id]);

                    ((id, el) => {
                        keytimeouts[id] = setTimeout(() => {
                            updateAPIKeyAlias(id, el.innerText);
                        }, 1000);
                    })(id, evt.currentTarget);
                });
            });

            document.querySelector('#address-table').classList.remove('hidden');
            document.querySelector('#no-address-message').classList.add('hidden');
        } else {
            document.querySelector('#no-address-message').classList.remove('hidden');
        }
    }

    async function createIPNSRecord() {
        const alias = document.querySelector('#new-key-alias').value;

        if (alias) {
            const {id} = await request('POST', '/api/record', {alias});

            if (id) {
                document.querySelector('#new-key-alias').value = '';
                document.querySelector('#new-key-alias').innerText = '';
                populateAddressList();
            }
        }
    }

    async function checkStatus(id, timeout) {
        timeout && clearTimeout(timeout);

        try {
            const record = await request('GET', `/api/record/${id}`);

            if (!record || record.status === undefined) {
                return false;
            }

            const statusEl = document.querySelector(`#address-status-${id}`);
            const statusStr = statusKey[record.status];

            statusEl.setAttribute('class' , `address-status ${statusStr}`);

            if (record.status === 1) {
                timeout = setTimeout(() => checkStatus(id), 3000);
            }
        } catch (err) {
            console.error('Failed to check address status');
            console.error(err);
        }
    }

    function hideElement(el) {
        const target = el.getAttribute('data-target');

        let cache = localStorage.getItem('HIDE_ELEMENTS');

        if (cache) {
            cache = JSON.parse(cache);
        } else {
            cache = [];
        }

        cache.push(target);
        cache = new Set(cache);

        localStorage.setItem('HIDE_ELEMENTS', JSON.stringify(Array.from(cache)));
        hideElements();
    }

    function hideElements() { 
        let cache = localStorage.getItem('HIDE_ELEMENTS');

        if (cache) {
            cache = JSON.parse(cache);

            cache.forEach((t) => {
                const el = document.querySelector(t);

                if (el) {
                    el.classList.add('hidden');
                }
            });
        }
    }

    async function populateAPIKeyList() {
        const tokenList = await request('GET', '/api/account/token/list');

        document.querySelector('#api-key-table').innerHTML = '';

        if (!tokenList || !tokenList.length) {
            document.querySelector('#api-key-table').innerHTML =
                `<div id="no-api-keys-message" class="api-key-item">
                    <h2>No API Keys</h2>
                    <br>
                    <p>You don't have any API keys yet!</p>
                </div>`;

            return false;
        }

        tokenList.reverse().forEach((t) => {
            document.querySelector('#api-key-table').innerHTML += 
                `<div id="api-key-${t.id}" class="api-key-item">
                    <h2>${t.alias}</h2>
                    <br>
                    <div class="new-api-key-container hidden">
                        <p id="new-api-key-${t.id}" class="url"></p>
                        <span class="interactive action-controller" data-action="copy-target-text" data-target="#new-api-key-${t.id}" style="margin-left: 5px; vertical-align: middle;">📋</span>
                        <p class="tooltip">
                            This is your new API key.
                            <br><br>
                            Store it in a safe place.
                            <br>
                            Only give it to trusted applications.
                            <br><br>
                            For your security, this key will NOT be provided again once the page is closed.
                        </p>
                    </div>
                    <p class="label">Allowed URLs</p>
                    <p class="origin-list">${t.urlSet.join(', ')}</p>
                    <p class="label">Permissions</p>
                    <div class="permission-list">${t.permissionSet.join(' - ')}</div>
                    <br><br>
                    <span class="button action-controller" data-action="delete-api-key" data-target="${t.id}">DELETE_KEY</span>
                </div>`;
        });

        document.querySelector('#api-key-table').querySelectorAll('.action-controller').forEach((el) => {
            el.addEventListener('click', (evt) => {
                const action = evt.currentTarget.getAttribute('data-action');

                if (actionHandlers[action]) {
                    actionHandlers[action](evt.currentTarget);
                }
            });
        });
    }

    async function createAPIKey() {
        const alias = document.querySelector('#new-api-key-alias').value;
        const urlCsv = document.querySelector('#new-api-key-url-csv').value;
        const permissionCsv = document.querySelector('#new-api-key-permissions').value;
        const validPermCsvSet = [
            'READ',
            'WRITE',
            'READ,WRITE',
            'READ,WRITE,SELF_ONLY'
        ];

        if (!alias || !permissionCsv || !validPermCsvSet.includes(permissionCsv)) {
            return false;
        }

        document.querySelector('#new-api-key-alias').value = '';
        document.querySelector('#new-api-key-url-csv').value = '';
        document.querySelector('#new-api-key-alias').innerText = '';
        document.querySelector('#new-api-key-url-csv').innerText = '';
        document.querySelector('#new-api-key-permissions').value = 'NONE';

        const {token, id} = {} = await request('POST', '/api/account/token', {
            alias,
            permissionSet: permissionCsv.split(',').map((s) => s.trim()),
            urlSet: urlCsv ? urlCsv.split(',').map((s) => s.trim()) : null
        });

        if (!token) {
            return false;
        }

        await populateAPIKeyList();

        document.querySelector(`#api-key-${id}`).querySelector('.url').innerText = token;
        document.querySelector(`#api-key-${id}`).querySelector('.new-api-key-container').classList.remove('hidden');
        document.querySelector(`#api-key-${id}`).querySelectorAll('.action-controller').forEach((el) => {
            el.addEventListener('click', (evt) => {
                const action = evt.currentTarget.getAttribute('data-action');

                if (actionHandlers[action]) {
                    actionHandlers[action](evt.currentTarget);
                }
            });
        });
    }

    async function updateAPIKeyAlias(id, alias) {
        await request('PATCH', `/api/record/${id}`, {alias});
    }  

    async function deleteAPIKey(el) {
        if (!window.confirm("Are you sure you want to delete this API key?")) {
            return false;
        }

        const id = el.getAttribute('data-target');
        const {success} = await request('DELETE', `/api/account/token/${id}`);

        if (success !== true) {
            return false;
        }

        return populateAPIKeyList();
    }
})();