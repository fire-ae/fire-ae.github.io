console.log("Article sidebar script loaded");

document.querySelectorAll('.services-sidebar').forEach(sidebar => {
    const toggle = sidebar.querySelector('.sidebar-toggle');
    const links = sidebar.querySelector('.sidebar-links');

    console.log("Sidebar found:", !!sidebar);
    console.log("Toggle found:", !!toggle);
    console.log("Links found:", !!links);

    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        console.log("Article contents button clicked");
        links.classList.toggle('open');
    });
});
