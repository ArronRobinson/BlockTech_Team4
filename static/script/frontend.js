// Deze code is geschreven met behulp van met Antrophic's Claude 3.7 Sonnet  en OpenAI's ChatGPT 4o

document.addEventListener("DOMContentLoaded", function () {
    const filterSelect = document.getElementById("filter");
    const sortSelect = document.getElementById("sort");
    const podcastList = document.getElementById("podcastList");
    const isOnFavoritesPage = window.location.pathname.includes('/favorite');
    
    // Fix loading screen functionality
    const loadingWrapper = document.getElementById("loadingWrapper");
    const submitButton = document.getElementById("submit-button");
    
    // When submit button is clicked, show loading screen
    if (submitButton) {
        submitButton.addEventListener("click", function () {
            if (loadingWrapper) {
                loadingWrapper.style.display = "flex";
            }
        });
    }
    
    // Initialize loading screen on page load - make sure it's hidden initially
    if (loadingWrapper) {
        loadingWrapper.style.display = "none";
    }

    // Update to use only the top navigation save button, not both
    const contentSaveButton = document.getElementById("save-favorite");
    if (contentSaveButton) {
        // Clone the button to remove all event listeners
        const newButton = contentSaveButton.cloneNode(true);
        contentSaveButton.parentNode.replaceChild(newButton, contentSaveButton);
    }

    // Remove the event listener for save-current-favorite button entirely - carousel.js handles this
    const saveCurrentButton = document.getElementById("save-current-favorite");
    if (saveCurrentButton) {
        const newButton = saveCurrentButton.cloneNode(true);
        if (saveCurrentButton.parentNode) {
            saveCurrentButton.parentNode.replaceChild(newButton, saveCurrentButton);
        }
    }

    
    // This ensures that dynamically added elements will also have the event listener
    document.addEventListener('click', function(e) {
        // Only for favorites page
        if (!isOnFavoritesPage) return;
        
        // Check if the clicked element is a like button or inside one
        const likeButton = e.target.closest('.likeButton');
        if (!likeButton) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Find the closest section which contains the podcast data
        const section = likeButton.closest('section');
        if (!section) return;
        
        const podcastName = section.getAttribute('data-name');
        if (!podcastName) return;
        
        // Visual feedback - disable button while processing
        likeButton.disabled = true;
        likeButton.style.opacity = '0.5';
        
        removeFavorite(podcastName, section);
    });

    function removeFavorite(podcastName, section) {
        // Show loading indication on the button
        if (section) {
            const likeButton = section.querySelector('.likeButton');
            if (likeButton) {
                likeButton.disabled = true;
                likeButton.style.opacity = '0.5';
            }
        }
        
        fetch('/remove-favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ podcastTitle: podcastName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove the li element from the DOM
                const listItem = section.closest('.podcast-item');
                if (listItem) {
                    listItem.remove();
                }
                
                // Check if we need to show the empty message
                const remainingItems = document.querySelectorAll('.podcast-item');
                const emptyMessage = document.querySelector('.empty-message');
                
                // If no items left and no empty message, show the empty message
                if (remainingItems.length === 0 && !emptyMessage) {
                    const main = document.querySelector('main');
                    const newEmptyMessage = document.createElement('div');
                    newEmptyMessage.className = 'empty-message';
                    newEmptyMessage.textContent = 'No favorite podcasts yet. Discover new podcasts in the survey!';
                    
                    // Make sure controls stay at the top if they exist
                    const controls = document.querySelector('.controls');
                    if (controls && main) {
                        // Insert after controls
                        controls.after(newEmptyMessage);
                    } else if (main) {
                        main.appendChild(newEmptyMessage);
                    }
                }
            } else {
                console.error('Error removing favorite:', data.message);
                // Re-enable the button if there was an error
                if (section) {
                    const likeButton = section.querySelector('.likeButton');
                    if (likeButton) {
                        likeButton.disabled = false;
                        likeButton.style.opacity = '1';
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Re-enable the button if there was an error
            if (section) {
                const likeButton = section.querySelector('.likeButton');
                if (likeButton) {
                    likeButton.disabled = false;
                    likeButton.style.opacity = '1';
                }
            }
        });
    }

    // If we're on the favorites page, fetch and display favorites
    if (isOnFavoritesPage) {
        loadFavorites();
    } else {
        // On other pages, initialize the existing filtering/sorting
        filterAndSort();
    }

    // Function to load favorites from the server
    function loadFavorites() {
        // If we're using List.js for filtering/sorting, let it handle the display
        // No need to manually fetch favorites since they're already in the HTML
        if (filterSelect) {
            filterAndSort();
        }
    }

    // Function to display favorites
    function displayFavorites(podcasts) {
        const main = document.querySelector('main');
        
        // Clear existing podcasts but keep controls
        const existingSections = document.querySelectorAll('main > section[data-name]');
        existingSections.forEach(section => section.remove());
        
        // Remove any existing empty message
        const existingEmptyMessage = document.querySelector('.empty-message');
        if (existingEmptyMessage) {
            existingEmptyMessage.remove();
        }
        
        // Show message if no favorites
        if (!podcasts || podcasts.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No favorite podcasts yet. Discover new podcasts in the survey!';
            
            // Make sure to add after controls if they exist
            const controls = document.querySelector('.controls');
            if (controls) {
                controls.after(emptyMessage);
            } else {
                main.appendChild(emptyMessage);
            }
            return;
        }
        
        // Apply filtering and sorting
        let filteredPodcasts = [...podcasts];
        
        if (sortSelect) {
            if (sortSelect.value === "title") { // A-Z
                filteredPodcasts.sort((a, b) => a.title.localeCompare(b.title));
            } else if (sortSelect.value === "title:desc") { // Z-A
                filteredPodcasts.sort((a, b) => b.title.localeCompare(a.title));
            }
        }
        
        // Create and append podcast sections
        filteredPodcasts.forEach(podcast => {
            const section = createPodcastElement(podcast);
            main.appendChild(section);
        });
    }
    
    // Function to create a podcast element
    function createPodcastElement(podcast) {
        // Create the li element
        const li = document.createElement('li');
        li.className = 'podcast-item';
        
        // Create the section element
        const section = document.createElement('section');
        section.setAttribute('data-name', podcast.title);
        
        // Create a wrapper for clickable content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'podcast-content';
        
        // Create podcast image
        const img = document.createElement('img');
        img.src = podcast.image || 'images/360_F_418874697_trvAoXSfjetoptCXpR8N8XvO3R5eLtL4.jpg';
        img.alt = podcast.title;
        
        // Create podcast title
        const title = document.createElement('h2');
        title.textContent = podcast.title;
        title.className = 'title';
        
        // Create like and rating container
        const likeRatingContainer = document.createElement('div');
        likeRatingContainer.className = 'like-rating-container';
        
        // Create like button
        const likeButton = document.createElement('button');
        likeButton.className = 'likeButton liked'; // Already liked
        likeButton.innerHTML = `
            <svg class="likeIcon liked">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.5 3.5 5 5.5 5c1.54 0 3.04.99 3.57 2.36h1.87C15.46 5.99 16.96 5 18.5 5 20.5 5 22 6.5 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
        `;
        
        
        // Create podcast description
        const description = document.createElement('p');
        description.className = 'podcast-description';
        description.textContent = podcast.description || 'No description available';
        
        // Add all elements to the content div
        contentDiv.appendChild(img);
        contentDiv.appendChild(title);
        
        // Add the like button container
        likeRatingContainer.appendChild(likeButton);
        likeRatingContainer.appendChild(ratingDisplay);
        
        // Add description to content div
        contentDiv.appendChild(description);
        
        // Create tags if available
        if (podcast.tags && podcast.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'tags-container';
            
            podcast.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
            
            contentDiv.appendChild(tagsContainer);
        }
        
        // Add all main elements to the section
        section.appendChild(contentDiv);
        section.appendChild(likeRatingContainer);
        
        // Add the section to the li element
        li.appendChild(section);
        
        return li;
    }
    
    // Your existing filter and sort functionality (for other pages)
    function filterAndSort() {
        // Skip if we're on the favorites page
        if (isOnFavoritesPage) return;
        
        // ADD THIS LINE to skip on result page too
        if (window.location.pathname.includes('/recommend')) return;
        
        let podcastSections = Array.from(document.querySelectorAll("main section[data-name]"));

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
        const main = document.querySelector('main');
        if (main && podcastSections.length > 0) {
            // Clear main but preserve controls
            const controls = document.querySelector('.controls');
            main.innerHTML = '';
            if (controls) main.appendChild(controls);
            
            // Add the sorted sections
            podcastSections.forEach(section => main.appendChild(section));
        }
    }

    // Event Delegation for Like Button (for other pages)
    document.addEventListener("click", function (event) {
        // Skip this handler on the favorites page
        if (isOnFavoritesPage) return;
        
        const button = event.target.closest(".likeButton");
        if (!button) return; // Ignore clicks outside buttons

        const section = button.closest("section");
        if (!section) return;
        
        const podcastName = section.dataset.name;

        // Toggle like status
        const isLiked = button.classList.toggle("liked");
        const icon = button.querySelector(".likeIcon");
        if (icon) icon.classList.toggle("liked");

        // Save to localStorage
        localStorage.setItem(podcastName, isLiked ? "liked" : "not-liked");

        // Save to server if liked
        if (isLiked) {
            // Get podcast data from the section
            const podcastData = {
                title: podcastName,
                description: section.querySelector('p')?.textContent || 'No description available',
                image: section.querySelector('img')?.src || '',
                spotify_url: '', // You might need to add this data attribute to your HTML
                tags: []
            };
            
            saveFavorite(podcastData);
        } else {
            // Remove from server if unliked
            removeFavorite(podcastName);
        }

        // Refresh the sorting & filtering
        filterAndSort();
    });

    // Apply filter & sort when dropdowns change
    if (filterSelect) filterSelect.addEventListener("change", function() {
        if (isOnFavoritesPage) {
            loadFavorites();
        } else {
            filterAndSort();
        }
    });
    
    if (sortSelect) sortSelect.addEventListener("change", function() {
        if (isOnFavoritesPage) {
            loadFavorites();
        } else {
            filterAndSort();
        }
    });
});

// Keep all your existing functions below this point

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



// ***
// survey
// ***

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the survey page before accessing survey elements
    const step1 = document.getElementById('step1');
    
    // Only run survey code if survey elements exist
    if (step1) {
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        
        const nextToStep2 = document.getElementById('next-to-step2');
        const backToStep1 = document.getElementById('back-to-step1');
        const nextToStep3 = document.getElementById('next-to-step3');
        const backToStep2 = document.getElementById('back-to-step2');
        
        const categoryItems = document.querySelectorAll('.category-item');
        const SubcategoryGroup = document.querySelectorAll('.checkbox-grid input[type="checkbox"]');
        const moodCheckboxes = document.querySelectorAll('.mood-options input[type="checkbox"]');

        // Category item click handlers
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
        
        // Subcategory click handlers
        SubcategoryGroup.forEach(item => {
            item.addEventListener('click', function() {
                const label = this.parentElement;
                label.classList.toggle("selected", this.checked);
            });
        });

        // Mood checkbox handlers
        moodCheckboxes.forEach(checkbox => {
            checkbox.addEventListener("change", function () {
                const label = this.closest(".mood-option");
                label.classList.toggle("selected", this.checked);
            });
        });
        
        // Navigation handlers
        if (nextToStep2) {
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
        }
        
        if (backToStep1) {
            backToStep1.addEventListener('click', function() {
                location.reload();
            });
        }
        
        if (nextToStep3) {
            nextToStep3.addEventListener('click', function(e) {
                e.preventDefault(); 

                const selectedInterests = document.querySelectorAll('input[name="interests"]:checked');

        
                step2.style.display = 'none';
                step3.style.display = 'block';
            });
        }
        
        if (backToStep2) {
            backToStep2.addEventListener('click', function() {
                // Verberg stap 3
                step3.style.display = 'none';
                
                // Toon stap 2
                step2.style.display = 'block';
            });
        }
        
        // Form validation
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
        
        // File input handler
        const fileInput = document.getElementById("fileInput");
        if (fileInput) {
            fileInput.addEventListener("change", function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const profilePic = document.getElementById("profilePic");
                        if (profilePic) {
                            profilePic.src = e.target.result;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
});

// Improved window load handler for loading screen
window.addEventListener("load", function () {
    const loadingWrapper = document.getElementById("loadingWrapper");
    
    // Check if we're on the survey page
    const isSurveyPage = window.location.pathname.includes('/survey');
    
    // Check if we're on the result page and survey was just submitted
    const isResultPage = window.location.pathname.includes('/recommend');
    const wasSurveySubmitted = sessionStorage.getItem('surveySubmitted') === 'true';
    
    // IMPORTANT: Check if this is a back navigation
    const isBackNavigation = performance.getEntriesByType("navigation")[0].type === "back_forward";
    
    if (loadingWrapper) {
        // Always start with hiding the loading screen on page load
        loadingWrapper.style.display = "none";
        
        // If coming to results from survey submission, clear the flag
        if (isResultPage && wasSurveySubmitted) {
            console.log('Clearing survey submitted flag on result page');
            sessionStorage.removeItem('surveySubmitted');
        }
        
        // If returning to survey via back button, ensure loading screen stays hidden
        if (isSurveyPage && isBackNavigation) {
            console.log('Back navigation to survey detected, keeping loading screen hidden');
            loadingWrapper.style.display = "none";
            sessionStorage.removeItem('surveySubmitted');
        }
    }
    
    // Reset any form submission state if navigating back to survey
    if (isSurveyPage && !isBackNavigation) {
        // Initialize the survey form submission handlers - only if NOT a back navigation
        const surveyForm = document.getElementById('surveyForm');
        if (surveyForm) {
            surveyForm.addEventListener('submit', function(e) {
                const selectedMoods = document.querySelectorAll('input[name="mood"]:checked');
                
                if (selectedMoods.length === 0) {
                    e.preventDefault();
                    alert('Selecteer ten minste één sfeer voor je podcast');
                    return;
                }
                
                if (loadingWrapper) {
                    console.log('Showing loading screen from frontend.js');
                    loadingWrapper.style.display = "flex";
                    sessionStorage.setItem('surveySubmitted', 'true');
                }
            });
        }
    }
});

window.addEventListener("load", function () {
    const loadingScreen = document.querySelector(".loading-screen");
    if (loadingScreen) {
        const loadingWrapper = document.getElementById("loadingWrapper");
        if (loadingWrapper) {
            loadingWrapper.style.display = "none";
        }
    }
});

