(function () {
    const authHandlers = {
        'copy-target-text': copyTargetText,
        'create-account': submitCreateAccount,
        'reset-password': submitResetPassword,
        'link-device': submitLinkDevice,
        'recover-account': submitRecoverAccount
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

    async function submitCreateAccount() {
        const pw = document.querySelector('#new-account-password-input .input').value;

        if (pw) {
            const {id} = await request('POST', '/api/account/create', {pw});

            document.querySelector('#secret-key-container .url').innerText = id;

            document.querySelector('#secret-key-container').classList.remove('hidden');
            document.querySelector('#account-create-submit').classList.add('hidden');
            document.querySelector('#account-create-successful').classList.remove('hidden');
        }
    }

    async function submitRecoverAccount() {
        const pw = document.querySelector('#pw-input').value;
        const key = document.querySelector('#secret-key-input').value;

        if (pw && key) {
            const {success} = await request('POST', '/api/account/recover', {pw, id: key});

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
        const token = location.href.split('?key=')[1];
        const pwInput = document.querySelector('#device-link-pw');
        const pw = pwInput.value;
        const {success} = await request('put', '/api/account/device/link', {pw, token});

        if (success === true) {
            pwInput.value = '';
            document.querySelector('#device-link-success').classList.remove('hidden');
            document.querySelector('#device-link-submit').classList.add('hidden');
        }
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

        const {success} = await request('POST', '/api/account/password/reset', {id, pw0, pw1, pw2});

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