(() => {
    const actionHandlers = {
        'copy-target-text': copyTargetText,
        'close-pop-up': closePopUp,
        'open-pop-up': openPopUp
    };

    document.addEventListener('click', function () {
        closePopUp();
    }, false);

    document.querySelector('#pop-up').addEventListener('click', (evt) => {
        evt.stopPropagation();
    }, false);

    document.querySelectorAll('.action-controller').forEach((el) => {
        el.addEventListener('click', (evt) => {
            const action = evt.currentTarget.getAttribute('data-action');

            if (actionHandlers[action]) {
                actionHandlers[action](evt.currentTarget);
            }

            evt.stopPropagation();
        }, false);
    });

    document.querySelector('#menu-button').addEventListener('click', function () {
        const el = document.querySelector('#mobile-menu');
    
        if (el.classList.contains('hidden')) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }, false);

    function closePopUp() {
        document.querySelector('#pop-up-container').classList.add('hidden');
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

    function openPopUp() {
        document.querySelector('#pop-up-container').classList.remove('hidden');
    }
})();