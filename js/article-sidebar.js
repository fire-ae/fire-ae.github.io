document.querySelectorAll('.services-sidebar').forEach(sidebar => {
    const toggle = sidebar.querySelector('.sidebar-toggle');
    const links = sidebar.querySelector('.sidebar-links');

    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.textContent = isOpen
            ? '✕ Close article contents'
            : '☰ Article contents';
    });
});
