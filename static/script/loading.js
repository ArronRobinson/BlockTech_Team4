document.addEventListener("DOMContentLoaded", function () {
    const loader = document.getElementById("loadingScreen");

    if (loader) {
        setTimeout(() => {
            loader.style.display = "none";
            console.log("Loading screen is hidden! ✅");
        }, 1000); // Wacht 1 seconde
    } else {
        console.error("⚠️ Loading screen not found!");
    }
});