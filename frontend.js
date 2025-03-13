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

// Update your existing JavaScript to properly handle form elements
document.addEventListener('DOMContentLoaded', function() {
    // Elements for navigation
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    // Navigation buttons
    const nextToStep2 = document.getElementById('next-to-step2');
    const backToStep1 = document.getElementById('back-to-step1');
    const nextToStep3 = document.getElementById('next-to-step3');
    const backToStep2 = document.getElementById('back-to-step2');
    
    // Main category selection
    const categoryItems = document.querySelectorAll('.category-item');
    
    // Add selection functionality to category items
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Toggle selected class
            this.classList.toggle('selected');
            
            // Toggle checkbox
            const checkbox = this.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
        });
    });
    
    // Make checkboxes in subcategory options and mood options update their styling
    const checkboxLabels = document.querySelectorAll('.checkbox-grid label, .mood-option');
    checkboxLabels.forEach(label => {
        label.addEventListener('click', function() {
            // No need to toggle, the browser handles checkbox state
            this.classList.toggle('selected');
        });
    });
    
    // Navigation: Step 1 to Step 2
    if (nextToStep2) {
        nextToStep2.addEventListener('click', function() {
            // Check if at least one category is selected
            const selectedCategories = document.querySelectorAll('.category-item.selected');
            
            if (selectedCategories.length === 0) {
                alert('Selecteer ten minste één categorie');
                return;
            }
            
            // Show subcategories based on selection
            selectedCategories.forEach(category => {
                const categoryName = category.getAttribute('data-category');
                const subcategory = document.querySelector(`.${categoryName}Opties`);
                if (subcategory) {
                    subcategory.style.display = 'block';
                }
            });
            
            // Navigate to step 2
            step1.style.display = 'none';
            step2.style.display = 'block';
        });
    }
    
    // Navigation: Step 2 to Step 1
    if (backToStep1) {
        backToStep1.addEventListener('click', function() {
            step2.style.display = 'none';
            step1.style.display = 'block';
        });
    }
    
    // Navigation: Step 2 to Step 3
    if (nextToStep3) {
        nextToStep3.addEventListener('click', function() {
            // Check if at least one subcategory option is selected
            const selectedInterests = document.querySelectorAll('input[name="interests"]:checked');
            
            if (selectedInterests.length === 0) {
                alert('Selecteer ten minste één specifieke interesse');
                return;
            }
            
            // Navigate to step 3
            step2.style.display = 'none';
            step3.style.display = 'block';
        });
    }
    
    // Navigation: Step 3 to Step 2
    if (backToStep2) {
        backToStep2.addEventListener('click', function() {
            step3.style.display = 'none';
            step2.style.display = 'block';
        });
    }
    
    // Form submission validation
    const surveyForm = document.getElementById('surveyForm');
    if (surveyForm) {
        surveyForm.addEventListener('submit', function(e) {
            const selectedMoods = document.querySelectorAll('input[name="mood"]:checked');
            
            if (selectedMoods.length === 0) {
                e.preventDefault();
                alert('Selecteer ten minste één sfeer voor je podcast');
            }
        });
    }
});
