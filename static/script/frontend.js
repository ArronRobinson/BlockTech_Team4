document.querySelectorAll(".likeButton").forEach((button) => {
    button.addEventListener("click", () => {
        button.classList.toggle("liked"); // Toggle liked class on button
    });
});



document.addEventListener("DOMContentLoaded", function () {
    const filterSelect = document.getElementById("filter");
    const sortSelect = document.getElementById("sort");
    const podcastList = document.getElementById("podcastList");

    // Function to filter & sort podcasts
    function filterAndSort() {
        let podcastSections = Array.from(document.querySelectorAll("main section"));

        // Apply filter
        if (filterSelect.value === "liked") {
            podcastSections = podcastSections.filter(section =>
                localStorage.getItem(section.dataset.name) === "liked"
            );
        }

        // Apply sorting
        if (sortSelect.value === "name-asc") {
            podcastSections.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
        } else if (sortSelect.value === "name-desc") {
            podcastSections.sort((a, b) => b.dataset.name.localeCompare(a.dataset.name));
        } else if (sortSelect.value === "likes-desc") {
            podcastSections.sort((a, b) => {
                const aLiked = localStorage.getItem(a.dataset.name) === "liked" ? 1 : 0;
                const bLiked = localStorage.getItem(b.dataset.name) === "liked" ? 1 : 0;
                return bLiked - aLiked;
            });
        }

        // Reorder the sections in the DOM
        podcastList.innerHTML = "";
        podcastSections.forEach(section => podcastList.appendChild(section));
    }

    // Event Delegation for Like Button
    podcastList.addEventListener("click", function (event) {
        const button = event.target.closest(".likeButton");
        if (!button) return; // Ignore clicks outside buttons

        const section = button.closest("section");
        const podcastName = section.dataset.name;

        // Toggle like status
        const isLiked = button.classList.toggle("liked");
        const icon = button.querySelector(".likeIcon");
        icon.classList.toggle("liked");

        // Save to localStorage
        localStorage.setItem(podcastName, isLiked ? "liked" : "not-liked");

        // Refresh the sorting & filtering
        filterAndSort();
    });

    // Apply filter & sort when dropdowns change
    filterSelect.addEventListener("change", filterAndSort);
    sortSelect.addEventListener("change", filterAndSort);
});


document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("section").forEach(section => {
        const podcastName = section.dataset.name;
        const ratingValueElement = section.querySelector(".rating-value");

        // Simulating a fetched rating (Replace this with API fetch if needed)
        const rating = getPodcastRating(podcastName); // Example function to get rating

        // Update the displayed rating
        ratingValueElement.textContent = rating.toFixed(1);
    });
});

// Example function to simulate fetching ratings
function getPodcastRating(podcastName) {
    // Simulated ratings (replace with real data)
    const ratings = {
        "Podcast1": 4.2,
        "Podcast2": 3.8,
        "Podcast3": 4.5,
    };

    return ratings[podcastName] || 0.0; // Default to 0.0 if not found
}



// quiz


let nextButton = document.querySelector(".nextButton");
let secondQuestion = document.querySelector(".secondQuestion");
let firstQuestion = document.querySelector(".firstQuestion");
let buttonBack = document.querySelector(".backButton");

nextButton.onclick = showquiz
buttonBack.onclick = reload

function showquiz() {
    secondQuestion.style.display = "grid"
    firstQuestion.style.display = "none"
    buttonBack.style.display = "block"
}

function reload(){
    location.reload();
}


let sport = document.querySelector(".sport");
let sportOption = document.querySelector(".sportOption");
let boeken = document.querySelector(".boeken");
let boekenOption = document.querySelector(".boekenOption");
let koken = document.querySelector(".koken");
let kokenOption = document.querySelector(".kokenOption");
let gamen = document.querySelector(".gamen");
let gamenOption = document.querySelector(".gamenOption");
let muziek = document.querySelector(".muziek");
let muziekOption = document.querySelector(".muziekOption");
let film = document.querySelector(".film");
let filmOption = document.querySelector(".filmOption");
let nieuws = document.querySelector(".nieuws");
let nieuwsOption = document.querySelector(".nieuwsOption");
let kunst = document.querySelector(".kunst");
let kunstOption = document.querySelector(".kunstOption");
let misdaad = document.querySelector(".misdaad");
let misdaadOption = document.querySelector(".misdaadOption");
let geschiedenis = document.querySelector(".geschiedenis");
let geschiedenisOption = document.querySelector(".geschiedenisOption");
let mode = document.querySelector(".mode");
let modeOption = document.querySelector(".modeOption");
let lifestyle = document.querySelector(".lifestyle");
let lifestyleOption = document.querySelector(".lifestyleOption");



sport.addEventListener("change",showSport);
boeken.addEventListener("change",showBoeken);
koken.addEventListener("change",showKoken);
gamen.addEventListener("change",showGamen);
muziek.addEventListener("change",showMuziek);
film.addEventListener("change",showFilm);
nieuws.addEventListener("change",showNieuws);
kunst.addEventListener("change",showKunst);
misdaad.addEventListener("change",showMisdaad);
geschiedenis.addEventListener("change",showGeschiedenis);
mode.addEventListener("change",showMode);
lifestyle.addEventListener("change",showLifestyle);



function showGamen() {
    if (gamen.checked) {
        gamenOption.style.display = "grid"
    } else {
        gamenOption.style.display = "none"
    }
}

function showSport() {
    if (sport.checked) {
        sportOption.style.display = "grid"
    } else {
        sportOption.style.display = "none"
    }
}

function showBoeken() {
    if (boeken.checked) {
        boekenOption.style.display = "grid"
    } else {
        boekenOption.style.display = "none"
    }
}

function showKoken() {
    if (koken.checked) {
        kokenOption.style.display = "grid"
    } else {
        kokenOption.style.display = "none"
    }
}

function showMuziek() {
    if (muziek.checked) {
        muziekOption.style.display = "grid"
    } else {
        muziekOption.style.display = "none"
    }
}

function showFilm() {
    if (film.checked) {
        filmOption.style.display= "grid"
    } else {
        filmOption.style.display= "none"
    }
}

function showNieuws() {
    if (nieuws.checked) {
        nieuwsOption.style.display = "grid"
    } else {
        nieuwsOption.style.display = "none"
    }
}

function showKunst() {
    if (kunst.checked) {
        kunstOption.style.display = "grid"
    } else {
        kunstOption.style.display = "none"
    }
}

function showMisdaad() {
    if (misdaad.checked) {
        misdaadOption.style.display = "grid"
    } else {
        misdaadOption.style.display = "none"
    }
}

function showGeschiedenis() {
    if (geschiedenis.checked) {
        geschiedenisOption.style.display = "grid"
    } else {
        geschiedenisOption.style.display = "none"
    }
}

function showMode() {
    if (mode.checked) {
        modeOption.style.display = "grid"
    } else {
        modeOption.style.display = "none"
    }
}

function showLifestyle() {
    if (lifestyle.checked) {
        lifestyleOption.style.display = "grid"
    } else {
        lifestyleOption.style.display = "none"
    }
}



document.addEventListener("DOMContentLoaded", function () {
    const checkboxes = document.querySelectorAll("input[name='hobby']");

    function updateCheckboxes() {
        let checkedCount = document.querySelectorAll("input[name='hobby']:checked").length;

        checkboxes.forEach(checkbox => {
            if (checkedCount >= 3) {
                // Disable checkboxes die niet aangevinkt zijn
                checkbox.disabled = !checkbox.checked;
            } else {
                // Zorg dat alles weer aanklikbaar is als er minder dan 3 zijn aangevinkt
                checkbox.disabled = false;
            }
        });
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", updateCheckboxes);
    });
});
