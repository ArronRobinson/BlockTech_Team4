document.addEventListener("DOMContentLoaded", function () {
    const filterSelect = document.getElementById("filter");
    const sortSelect = document.getElementById("sort");
    const podcastList = document.getElementById("podcastList");
    const isOnFavoritesPage = window.location.pathname.includes('/favorite');
    
    // When submit button is clicked, show loading screen
    const submitButton = document.getElementById("submit-button");
    if (submitButton) {
        submitButton.addEventListener("click", function () {
            document.getElementById("loadingWrapper").classList.add("visible");
        });
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

    // NEW APPROACH: Use event delegation for the entire document
    // This ensures that dynamically added elements will also have the event listener
    document.addEventListener('click', function(e) {
        // Only for favorites page
        if (!isOnFavoritesPage) return;
        
        // Check if the clicked element is a like button or inside one
        const likeButton = e.target.closest('.likeButton');
        if (!likeButton) return;
        
        e.preventDefault();
        e.stopPropagation();
        
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
                // Remove section from the DOM
                if (section) {
                    section.remove();
                }
                
                // Check if we need to show the empty message
                const remainingSections = document.querySelectorAll('main > section[data-name]');
                if (remainingSections.length === 0) {
                    const main = document.querySelector('main');
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'empty-message';
                    emptyMessage.textContent = 'No favorite podcasts yet. Discover new podcasts in the survey!';
                    main.appendChild(emptyMessage);
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
        fetch('/api/favorites')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayFavorites(data.favorites);
                } else {
                    console.error('Error:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching favorites:', error);
            });
    }

    // Function to display favorites
    function displayFavorites(podcasts) {
        const main = document.querySelector('main');
        
        // Clear existing podcasts but keep controls
        const existingSections = document.querySelectorAll('main > section[data-name]');
        existingSections.forEach(section => section.remove());
        
        // Show message if no favorites
        if (!podcasts || podcasts.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No favorite podcasts yet. Discover new podcasts in the survey!';
            main.appendChild(emptyMessage);
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
        const section = document.createElement('section');
        section.setAttribute('data-name', podcast.title);
        
        // Create podcast image
        const img = document.createElement('img');
        img.src = podcast.image || 'images/360_F_418874697_trvAoXSfjetoptCXpR8N8XvO3R5eLtL4.jpg';
        img.alt = podcast.title;
        
        // Create podcast title
        const title = document.createElement('h2');
        title.textContent = podcast.title;
        
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
        
        // Create rating display
        const ratingDisplay = document.createElement('div');
        ratingDisplay.className = 'rating-display';
        ratingDisplay.innerHTML = `
            <span class="rating-star">★</span>
            <span class="rating-value">5.0</span> 
        `;
        
        // Create podcast description
        const description = document.createElement('p');
        description.className = 'podcast-description';
        description.textContent = podcast.description || 'No description available';
        
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
            
            section.appendChild(tagsContainer);
        }
        
        // Append all elements
        likeRatingContainer.appendChild(likeButton);
        likeRatingContainer.appendChild(ratingDisplay);
        
        section.appendChild(img);
        section.appendChild(title);
        section.appendChild(likeRatingContainer);
        section.appendChild(description);
        
        // Add click handler for the entire section to go to podcast
        if (podcast.spotify_url) {
            section.addEventListener('click', function(e) {
                // Don't navigate if clicking on the like button
                if (e.target.closest('.likeButton')) return;
                
                window.open(podcast.spotify_url, '_blank');
            });
            section.style.cursor = 'pointer';
        }
        
        return section;
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




window.addEventListener("load", function () {
    document.querySelector(".loading-screen").style.display = "none";
});


document.querySelector(".toggle-password").addEventListener("click", function () {
    let wachtwoordInput = document.getElementById("wachtwoord");

    // Toggle password visibility
    if (wachtwoordInput.type === "password") {
        wachtwoordInput.type = "text";
    } else {
        wachtwoordInput.type = "password";
    }
});