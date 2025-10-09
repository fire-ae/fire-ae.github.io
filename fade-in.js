document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".fade-in");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("appear");
        observer.unobserve(entry.target); // optional, fade only once
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
});
