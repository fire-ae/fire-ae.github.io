// Shared navbar JavaScript
fetch('/navbar.html')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Navbar loading failed: ${response.status}`);
        }
        return response.text();
    })
    .then(html => {
        const container = document.getElementById('site-navbar');
        if (!container) return;

        container.innerHTML = html;

        const toggle = container.querySelector('.navbar-toggle');
        const links = container.querySelector('.navbar-links');

        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            toggle.textContent = isOpen ? '✕' : '☰';
        });
    })
    .catch(error => console.error(error));
