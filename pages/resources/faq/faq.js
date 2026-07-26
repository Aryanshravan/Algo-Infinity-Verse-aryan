const faqCategories = document.querySelectorAll(".faq-category");
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
        item.classList.toggle("active");
    });
});

document.addEventListener("click", (e) => {
    const backLink = e.target.closest(".back-to-top");
    if (backLink) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
});

const searchInput = document.getElementById("faqSearch");

searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase().trim();

    faqCategories.forEach(category => {
        const items = category.querySelectorAll(".faq-item");
        let anyVisible = false;

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = !value || text.includes(value);
            item.style.display = matches ? "block" : "none";
            if (matches) anyVisible = true;
        });

        category.style.display = anyVisible ? "block" : "none";
    });
});
