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


// ********
//  quiz
// ********


let sport = document.querySelector(".sport")
let boeken = document.querySelector(".boeken")
let koken = document.querySelector(".koken")
let gamen = document.querySelector(".gamen")
let muziek = document.querySelector(".muziek")
let film = document.querySelector(".film")

let gamenOpties = document.querySelector(".gamenOpties")

