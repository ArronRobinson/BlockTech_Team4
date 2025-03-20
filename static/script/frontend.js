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

// *******
// survey
// *******


document.addEventListener('DOMContentLoaded', function() {
   
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    const nextToStep2 = document.getElementById('next-to-step2');
    const backToStep1 = document.getElementById('back-to-step1');
    const nextToStep3 = document.getElementById('next-to-step3');
    const backToStep2 = document.getElementById('back-to-step2');
    
    const categoryItems = document.querySelectorAll('.category-item');
    const SubcategoryGroup = document.querySelectorAll('.checkbox-grid input[type="checkbox"]');
    const moodCheckboxes = document.querySelectorAll('.mood-options input[type="checkbox"]');


    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // Deselecteer alle andere categorieën
            categoryItems.forEach(otherItem => {
                if (otherItem !== this) {
                    otherItem.classList.remove('selected');
                    const checkbox = otherItem.querySelector('input[type="radio"]');
                    if (checkbox) checkbox.checked = false; // deselecteer de radio button
                }
            });
    
            // Selecteer de aangeklikte categorie
            this.classList.add('selected');
            const checkbox = this.querySelector('input[type="radio"]');
            if (checkbox) checkbox.checked = true; // selecteer de radio button
        });
    });
    


    // clicked kleur verandere


    SubcategoryGroup.forEach(item => {
        item.addEventListener('click', function() {
            const label = this.parentElement;
            label.classList.toggle("selected", this.checked);
        });
    });



    moodCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function () {
           const label = this.closest(".mood-option");
           label.classList.toggle("selected", this.checked);
        });
    });

    
    
    // Navigation: Step 1 to Step 2
    nextToStep2.addEventListener('click', function() {
        const selectedCategories = document.querySelectorAll('.category-item.selected');
        if (selectedCategories.length === 0) {
            alert('Selecteer ten minste één categorie');
            return;
        }
        
        selectedCategories.forEach(category => {
            const categoryName = category.getAttribute('data-category');
            const subcategory = document.querySelector(`.${categoryName}Opties`);
            if (subcategory) {
                subcategory.style.display = 'block';
            } else {
                console.warn(`Geen subcategorie gevonden voor: ${categoryName}`);
            }
        });
    
        // Navigatie naar stap 2
        step1.style.display = 'none';
        step2.style.display = 'block';
    });
    


    
    // Navigation: Step 2 to Step 1
    backToStep1.addEventListener('click', function() {
        location.reload();
    });


       // Navigation: Step 2 to Step 3 
    if (nextToStep3) {
    
        nextToStep3.addEventListener('click', function(e) {
            e.preventDefault(); 

            const selectedInterests = document.querySelectorAll('input[name="interests"]:checked');

    
            step2.style.display = 'none';
            step3.style.display = 'block';
        });
    } else {
        console.error("⚠️ nextToStep3 knop NIET gevonden!");
    }

       // Navigation: Step 3 to Step 2 
    if (backToStep2) {
        backToStep2.addEventListener('click', function() {
            // Verberg stap 3
            step3.style.display = 'none';
            
            // Toon stap 2
            step2.style.display = 'block';
        });
    }
  
   // Form submission validation
    document.getElementById('surveyForm').addEventListener('submit', function(e) {
        const selectedMoods = document.querySelectorAll('input[name="mood"]:checked');
        
        if (selectedMoods.length === 0) {
            e.preventDefault();
            alert('Selecteer ten minste één sfeer voor je podcast');
        }
    });
    
   
  


   
});

document.getElementById("fileInput").addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            document.getElementById("profilePic").src = e.target.result;
        };

        reader.readAsDataURL(file);
    }
})