(function () {
    const wallet = new beacon.DAppClient({
        name: 'ipns.nofungible.cloud',
        eventHandlers: {
            ACTIVE_ACCOUNT_SET: {
                handler: async function (activeBeaconAccount) {
                    try {
                        console.log('Beacon Wallet Account Set:', activeBeaconAccount);
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        }
    });

    const authHandlers = {
        'copy-target-text': copyTargetText,
        'register-account': submitRegisterAccount,
        'create-account': submitCreateAccount,
        'reset-password': submitResetPassword,
        'link-device': submitLinkDevice,
        'recover-account': submitRecoverAccount,
        'unlink-account': () => {
            unsyncWallet(wallet);
            document.querySelector('#register-account-container').classList.remove('hidden');
            document.querySelector('#create-account-container').classList.add('hidden');
        }
    };

    attachGestureHandlers();

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

                if (authHandlers[action]) {
                    authHandlers[action](evt.currentTarget);
                }
            });
        });
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

    async function syncWalletCb(cb, force = false) {
        if (!wallet) {
            throw new Error('NO_WALLET');
        }

        await new Promise(async (resolve, reject) => {
            try {
                const activeAccount = await wallet.getActiveAccount();

                if (!activeAccount || force === true) {
                    await syncWallet(wallet);
                }

                resolve();
            } catch (err) {
                reject(err);
                unsyncWallet(wallet).catch(console.error);
            }
        });

        await cb(wallet);
    }

    function syncWallet(wallet) {
        return wallet.requestPermissions();
    }

    function unsyncWallet(wallet) {
        return wallet.removeAllAccounts();
    }

    function submitRegisterAccount() {
        syncWalletCb(async (wallet) => {
            const activeAccount = await wallet.getActiveAccount();

            document.querySelector('#tezos-address').innerText = activeAccount.address;

            document.querySelector('#register-account-container').classList.add('hidden');
            document.querySelector('#create-account-container').classList.remove('hidden');
        }, true).catch(console.error); 
    }

    async function submitCreateAccount() {
        const pw = document.querySelector('#new-account-password-input .input').value;

        if (pw && wallet) {
            const activeAccount = await wallet.getActiveAccount();

            if (!activeAccount) {
                return false;
            }

            const dappUrl = 'ipns.nofungible.cloud';
            const ISO8601formatedTimestamp = new Date().toISOString();
            const input = `Account Registration: ${activeAccount.address}`;
    
            const formattedInput = [
                'Tezos Signed Message:',
                dappUrl,
                ISO8601formatedTimestamp,
                input,
            ].join(' ');
    
            const bytes = window.taquitoUtils.char2Bytes(formattedInput);
            const payloadBytes = '05' + '0100' + window.taquitoUtils.char2Bytes(`${bytes.length}`) + bytes;
            const {signature} = await wallet.requestSignPayload({
                signingType: beacon.SigningType.MICHELINE,
                payload: payloadBytes,
            });

            if (!signature) {
                return false;
            }

            const {key} = await request('POST', '/api/account/create', {pw, message: payloadBytes, signature, address: activeAccount.address, pubkey: activeAccount.publicKey});

            if (!key) {
                return false;
            }

            document.querySelector('#secret-key-container .url').innerText = key;

            document.querySelector('#secret-key-container').classList.remove('hidden');
            document.querySelector('#account-create-submit').classList.add('hidden');
            document.querySelector('#account-create-successful').classList.remove('hidden');
            document.querySelector('#create-account-container').classList.add('hidden');
        }
    }

    async function submitRecoverAccount() {
        const pw = document.querySelector('#pw-input').value;
        const key = document.querySelector('#secret-key-input').value;

        if (pw && key) {
            const {success} = await request('POST', '/api/account/recover', {pw, key: key});

            if (success === true) {
                document.querySelector('#recover-account-success').classList.remove('hidden');
                document.querySelector('#recover-account-submit').classList.add('hidden');
                document.querySelector('#secret-key-input').value = '';                
                document.querySelector('#pw-input').value = '';
                document.querySelector('#secret-key-input').innerText = '';
                document.querySelector('#pw-input').innerText = '';
            }
        }
    }

    async function submitLinkDevice() {
        syncWalletCb(async (wallet) => {
            const activeAccount = await wallet.getActiveAccount();

            if (!activeAccount) {
                return false;
            }

            const dappUrl = 'ipns.nofungible.cloud';
            const ISO8601formatedTimestamp = new Date().toISOString();
            const input = `Account Authentication: ${activeAccount.address}`;
    
            const formattedInput = [
                'Tezos Signed Message:',
                dappUrl,
                ISO8601formatedTimestamp,
                input,
            ].join(' ');
    
            const bytes = window.taquitoUtils.char2Bytes(formattedInput);
            const payloadBytes = '05' + '0100' + window.taquitoUtils.char2Bytes(`${bytes.length}`) + bytes;
            const {signature} = await wallet.requestSignPayload({
                signingType: beacon.SigningType.MICHELINE,
                payload: payloadBytes,
            });
    
            if (!signature) {
                return false;
            }
    
            const {success} = await request('put', '/api/account/device/link', {message: payloadBytes, signature, address: activeAccount.address, pubkey: activeAccount.publicKey});
    
            if (success) {
                window.location.href = `${location.protocol}//${location.host}/manage`;
            }
        }).catch(console.error);
    }

    async function submitResetPassword() {
        const idEl = document.querySelector('#reset-key')
        const pw0El = document.querySelector('#reset-pw0')
        const pw1El = document.querySelector('#reset-pw1')
        const pw2El = document.querySelector('#reset-pw2')
        const id = idEl.value;
        const pw0 = pw0El.value;
        const pw1 = pw1El.value;
        const pw2 = pw2El.value;

        idEl.value = '';
        pw0El.value = '';
        pw1El.value = '';
        pw2El.value = '';

        const {success} = await request('POST', '/api/account/password/reset', {key: id, pw0, pw1, pw2});

        if (success === true) {
            document.querySelector('#pw-reset-success').classList.remove('hidden');
            document.querySelector('#pw-reset-success-tooltip').classList.remove('hidden');
            document.querySelector('#pw-reset-submit').classList.add('hidden');
        }
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
})();