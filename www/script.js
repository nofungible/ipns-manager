(() => {
    document.querySelector('#menu-button').addEventListener('click', function () {
        const el = document.querySelector('#mobile-menu');
    
        if (el.classList.contains('hidden')) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }, false);
})();