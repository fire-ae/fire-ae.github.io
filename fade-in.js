document.addEventListener("DOMContentLoaded", () => {
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("appear");
            else entry.target.classList.remove("appear");
        });
    }, appearOptions);

    faders.forEach(fader => observer.observe(fader));
});
