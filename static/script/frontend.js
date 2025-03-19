document.querySelectorAll(".likeButton").forEach((button) => {
    button.addEventListener("click", () => {
        button.classList.toggle("liked"); // Toggle liked class on button
    });
});

// Filter and Sort Podcasts
document.addEventListener("DOMContentLoaded", function () {
    const filterSelect = document.getElementById("filter");
    const sortSelect = document.getElementById("sort");
    const podcastList = document.getElementById("podcastList");

    // Function to filter & sort podcasts
    function filterAndSort() {
        let podcastSections = Array.from(document.querySelectorAll("main section"));

        // Apply filter
        if (filterSelect && filterSelect.value === "liked") {
            podcastSections = podcastSections.filter(section =>
                localStorage.getItem(section.dataset.name) === "liked"
            );
        }

        // Apply sorting
        if (sortSelect && sortSelect.value === "name-asc") {
            podcastSections.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
        } else if (sortSelect && sortSelect.value === "name-desc") {
            podcastSections.sort((a, b) => b.dataset.name.localeCompare(a.dataset.name));
        } else if (sortSelect && sortSelect.value === "likes-desc") {
            podcastSections.sort((a, b) => {
                const aLiked = localStorage.getItem(a.dataset.name) === "liked" ? 1 : 0;
                const bLiked = localStorage.getItem(b.dataset.name) === "liked" ? 1 : 0;
                return bLiked - aLiked;
            });
        }

        // Reorder the sections in the DOM
        if (podcastList) {
            podcastList.innerHTML = "";
            podcastSections.forEach(section => podcastList.appendChild(section));
        }
    }

    // Event Delegation for Like Button
    if (podcastList) {
        podcastList.addEventListener("click", function (event) {
            const button = event.target.closest(".likeButton");
            if (!button) return; // Ignore clicks outside buttons

            const section = button.closest("section");
            const podcastName = section.dataset.name;

            // Toggle like status
            const isLiked = button.classList.toggle("liked");
            const icon = button.querySelector(".likeIcon");
            if (icon) icon.classList.toggle("liked");

            // Save to localStorage
            localStorage.setItem(podcastName, isLiked ? "liked" : "not-liked");

            // Refresh the sorting & filtering
            filterAndSort();
        });
    }

    // Apply filter & sort when dropdowns change
    if (filterSelect) filterSelect.addEventListener("change", filterAndSort);
    if (sortSelect) sortSelect.addEventListener("change", filterAndSort);
    
    // Update ratings on page load
    document.querySelectorAll("section").forEach(section => {
        const podcastName = section.dataset.name;
        const ratingValueElement = section.querySelector(".rating-value");

        if (ratingValueElement) {
            // Simulating a fetched rating (Replace this with API fetch if needed)
            const rating = getPodcastRating(podcastName);
            ratingValueElement.textContent = rating.toFixed(1);
        }
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

// Old Quiz Navigation Functions
let nextButton = document.querySelector(".nextButton");
let secondQuestion = document.querySelector(".secondQuestion");
let firstQuestion = document.querySelector(".firstQuestion");
let buttonBack = document.querySelector(".backButton");

if (nextButton) {
    nextButton.onclick = showquiz;
}

if (buttonBack) {
    buttonBack.onclick = reload;
}

function showquiz() {
    if (secondQuestion && firstQuestion) {
        secondQuestion.style.display = "grid";
        firstQuestion.style.display = "none";
        if (buttonBack) buttonBack.style.display = "block";
    }
}

function reload() {
    location.reload();
}

// Interest group show/hide functions
const interestGroups = [
    { checkbox: ".sport", options: ".sportOption" },
    { checkbox: ".boeken", options: ".boekenOption" },
    { checkbox: ".koken", options: ".kokenOption" },
    { checkbox: ".gamen", options: ".gamenOption" },
    { checkbox: ".muziek", options: ".muziekOption" },
    { checkbox: ".film", options: ".filmOption" },
    { checkbox: ".nieuws", options: ".nieuwsOption" },
    { checkbox: ".kunst", options: ".kunstOption" },
    { checkbox: ".misdaad", options: ".misdaadOption" },
    { checkbox: ".geschiedenis", options: ".geschiedenisOption" },
    { checkbox: ".mode", options: ".modeOption" },
    { checkbox: ".lifestyle", options: ".lifestyleOption" },
];

// Attach event listeners for each interest group
interestGroups.forEach(group => {
    const checkbox = document.querySelector(group.checkbox);
    const optionsElement = document.querySelector(group.options);
    
    if (checkbox && optionsElement) {
        checkbox.addEventListener("change", () => {
            optionsElement.style.display = checkbox.checked ? "grid" : "none";
        });
    }
});

// Limit hobby selection

// document.addEventListener("DOMContentLoaded", function () {
//     const categoryItems = document.querySelectorAll(".category-item");

//     function updateCheckboxes() {
//         let checkedItems = document.querySelectorAll("input[name='main_interests']:checked").length;

//         categoryItems.forEach(item => {
//             const checkbox = item.querySelector("input[name='main_interests']");

//             if (checkedItems >= 3 && !checkbox.checked) {
//                 checkbox.disabled = true; // Blokkeer extra checkboxes als er 3 geselecteerd zijn
//                 item.classList.add("disabled"); // Optionele visuele feedback
//             } else {
//                 checkbox.disabled = false; // Heractiveer checkboxes als er minder dan 3 zijn
//                 item.classList.remove("disabled");
//             }
//         });
//     }

//     categoryItems.forEach(item => {
//         item.addEventListener("click", function () {
//             const checkbox = item.querySelector("input[name='main_interests']");

//             if (checkbox.disabled) return; // Stop als de checkbox al geblokkeerd is

//             checkbox.checked = !checkbox.checked; // Toggle de checkbox
//             item.classList.toggle("selected", checkbox.checked); // Visuele feedback
//             updateCheckboxes(); // Update de checkbox-status
//         });
//     });

//     updateCheckboxes(); // Controleer meteen de status bij laden van de pagina
// });



console.log("Script is geladen!");

document.addEventListener('DOMContentLoaded', function() {
    // Elements for navigation
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    // Navigation buttons

    const nextToStep2 = document.getElementById('next-to-step2');

    if (nextToStep2) {
        console.log("Element gevonden: next-to-step2");
        nextToStep2.addEventListener('click', function() {
            console.log("Next button clicked");
        });
    } else {
        console.error("Element #next-to-step2 niet gevonden!");
    }
    
    // const nextToStep2 = document.getElementById('next-to-step2');
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
            const checkbox = this.querySelector('input[type="radio"]');
            checkbox.checked = !checkbox.checked;
        });
    });


    // clicked kleur verandere


    const SubcategoryGroup = document.querySelectorAll('.checkbox-grid input[type="checkbox"]');

    SubcategoryGroup.forEach(item => {
        item.addEventListener('click', function() {
            const label = this.parentElement;
            // Toggle selected class
            label.classList.toggle("selected", this.checked);

        });
    });

    const moodCheckboxes = document.querySelectorAll('.mood-options input[type="checkbox"]');

    moodCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function () {
           const label = this.closest(".mood-option"); // Selecteert het label om de achtergrond te veranderen
           label.classList.toggle("selected", this.checked);
        });
    });

    
    
    // Navigation: Step 1 to Step 2
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
    
    // Navigation: Step 2 to Step 1
    backToStep1.addEventListener('click', function() {
        location.reload();
    });
    
    // Navigation: Step 2 to Step 3
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
    
    // Navigation: Step 3 to Step 2
    backToStep2.addEventListener('click', function() {
        step3.style.display = 'none';
        step2.style.display = 'block';
    });
    
    // Form submission validation
    document.getElementById('surveyForm').addEventListener('submit', function(e) {
        const selectedMoods = document.querySelectorAll('input[name="mood"]:checked');
        
        if (selectedMoods.length === 0) {
            e.preventDefault();
            alert('Selecteer ten minste één sfeer voor je podcast');
        }
    });
});