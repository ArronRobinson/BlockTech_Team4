document.addEventListener('DOMContentLoaded', function() {
    // Variables to keep track of the carousel's state
    let currentIndex = 0;
    let recommendations = [];
    let recommendedTitles = []; // Track titles of already recommended podcasts
    
    // DOM elements
    const carousel = document.getElementById('recommendations-carousel');
    const prevBtn = document.getElementById('prev-recommendation');
    const nextBtn = document.getElementById('next-recommendation');
    const generateNewBtn = document.getElementById('generate-new');
    const saveCurrentBtn = document.getElementById('save-current-favorite');
    const currentIndexEl = document.getElementById('current-index');
    const totalCountEl = document.getElementById('total-count');
    
    // Initialize with any existing recommendation
    if (window.podcastData && window.podcastData.available) {
        recommendations.push(window.podcastData);
        recommendedTitles.push(window.podcastData.title);
    }
    
    // Load saved carousel history from session
    if (window.carouselHistory && Array.isArray(window.carouselHistory) && window.carouselHistory.length > 0) {
        // If the first item in history is the same as the current recommendation, skip it
        const startIndex = (window.carouselHistory.length > 0 && 
                          window.podcastData && 
                          window.podcastData.available && 
                          window.carouselHistory[0].title === window.podcastData.title) ? 1 : 0;
        
        // Add all items from history
        for (let i = startIndex; i < window.carouselHistory.length; i++) {
            if (!recommendedTitles.includes(window.carouselHistory[i].title)) {
                recommendations.push(window.carouselHistory[i]);
                recommendedTitles.push(window.carouselHistory[i].title);
                
                // Create and append the slide
                const newSlide = createRecommendationSlide(window.carouselHistory[i], recommendations.length - 1);
                carousel.appendChild(newSlide);
            }
        }
    }
    
    updateCarouselControls();
    if (recommendations.length > 0) {
        checkFavoriteStatus(recommendations[currentIndex].title);
    }
    
    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', showPrevious);
    if (nextBtn) nextBtn.addEventListener('click', showNext);
    if (generateNewBtn) generateNewBtn.addEventListener('click', generateNewRecommendation);
    if (saveCurrentBtn) saveCurrentBtn.addEventListener('click', toggleFavoriteStatus);
    
    // Functions to navigate carousel
    function showPrevious() {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarouselDisplay();
            checkFavoriteStatus(recommendations[currentIndex].title);
        }
    }
    
    function showNext() {
        if (currentIndex < recommendations.length - 1) {
            currentIndex++;
            updateCarouselDisplay();
            checkFavoriteStatus(recommendations[currentIndex].title);
        }
    }
    
    // Update the display of the carousel
    function updateCarouselDisplay() {
        // Update indicator
        currentIndexEl.textContent = currentIndex + 1;
        
        // Update slides
        const slides = carousel.querySelectorAll('.recommendation-slide');
        slides.forEach((slide, i) => {
            if (i === currentIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });
        
        // Update button states
        // prevBtn.disabled = currentIndex === 0;
        // nextBtn.disabled = currentIndex === recommendations.length - 1;

        // Call the function that handles button states
        updateCarouselControls();
        
        // Save current carousel state to the session
        saveCarouselToSession();
    }
    
    // Update carousel controls visibility and state
    function updateCarouselControls() {
        totalCountEl.textContent = recommendations.length;
        currentIndexEl.textContent = currentIndex + 1;
        
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === recommendations.length - 1 || recommendations.length <= 1;
    }
    
    // Save the current carousel data to the session
    function saveCarouselToSession() {
        // Create a simplified version of recommendations for the session
        const sessionData = recommendations.map(podcast => ({
            title: podcast.title,
            description: podcast.description,
            explanation: podcast.explanation,
            tags: podcast.tags,
            spotify_url: podcast.spotify_url,
            embed_url: podcast.embed_url,
            image: podcast.image,
            available: true
        }));
        
        // Send to server to store in session
        fetch('/api/save-carousel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ podcasts: sessionData })
        })
        .catch(error => {
            console.error('Error saving carousel to session:', error);
        });
    }
    
    // Check if current podcast is already a favorite
    function checkFavoriteStatus(podcastTitle) {
        if (!saveCurrentBtn) return;
        
        fetch('/check-favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: podcastTitle })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateFavoriteButton(data.isFavorite);
            }
        })
        .catch(error => {
            console.error('Error checking favorite status:', error);
        });
    }
    
    // Update the UI of the favorite button
    function updateFavoriteButton(isFavorite) {
        if (!saveCurrentBtn) return;
        
        if (isFavorite) {
            saveCurrentBtn.classList.add('saved');
            saveCurrentBtn.innerHTML = `❤️ Saved`;
            saveCurrentBtn.dataset.favorite = 'true';
        } else {
            saveCurrentBtn.classList.remove('saved');
            saveCurrentBtn.innerHTML = `❤️`;
            saveCurrentBtn.dataset.favorite = 'false';
        }
        saveCurrentBtn.disabled = false;
    }
    
    // Toggle favorite status (add if not favorite, remove if already favorite)
    function toggleFavoriteStatus() {
        if (recommendations.length === 0 || currentIndex >= recommendations.length) return;
        
        const currentPodcast = recommendations[currentIndex];
        const isFavorite = saveCurrentBtn.dataset.favorite === 'true';
        
        // Show loading state on button
        if (saveCurrentBtn) {
            saveCurrentBtn.disabled = true;
            saveCurrentBtn.innerHTML = `<span class="loading-spinner"></span>`;
        }
        
        const endpoint = isFavorite ? '/remove-favorite' : '/add-favorite';
        const requestData = isFavorite ? 
            { podcastTitle: currentPodcast.title } : // Use the expected parameter name for removal
            {  // Use the full data for adding
                title: currentPodcast.title,
                description: currentPodcast.description,
                tags: currentPodcast.tags,
                spotify_url: currentPodcast.spotify_url,
                image: currentPodcast.image
            };
        
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Visual feedback for success
                updateFavoriteButton(!isFavorite);
                
                // Show a temporary success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-toast';
                successMessage.textContent = isFavorite ? 'Removed from favorites!' : 'Added to favorites!';
                document.body.appendChild(successMessage);
                
                // Remove the success message after a delay
                setTimeout(() => {
                    successMessage.classList.add('fade-out');
                    setTimeout(() => successMessage.remove(), 500);
                }, 2000);
            } else {
                console.error('Error toggling favorite:', data.message);
                updateFavoriteButton(data.isFavorite || false);
            }
        })
        .catch(error => {
            console.error('Error toggling favorite:', error);
            // Reset button state
            if (saveCurrentBtn) {
                saveCurrentBtn.disabled = false;
                saveCurrentBtn.innerHTML = isFavorite ? `❤️ Saved` : `❤️`;
            }
        });
    }
    
    // Generate a new recommendation using the API
    function generateNewRecommendation() {
        // Show loading state
        generateNewBtn.disabled = true;
        generateNewBtn.textContent = "Loading...";
        
        // Get the survey data
        const surveyData = window.originalSurveyData || 
                          JSON.parse(sessionStorage.getItem('surveyData')) || {};
        
        // Add current recommendations to exclusion list
        const requestData = {
            ...surveyData,
            alreadyRecommended: recommendedTitles
        };
        
        // Call the API
        fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Add new recommendation to the carousel
                const newPodcast = {
                    title: data.podcast.title,
                    description: data.podcast.description,
                    explanation: data.podcast.description,
                    tags: data.podcast.tags || [],
                    spotify_url: data.spotify.spotify_url || "",
                    embed_url: data.spotify.embed_url || "",
                    image: data.spotify.image || "",
                    available: true
                };
                
                // Add to our tracking arrays
                recommendations.push(newPodcast);
                recommendedTitles.push(newPodcast.title);
                
                // Create and append new slide
                const newSlide = createRecommendationSlide(newPodcast, recommendations.length - 1);
                carousel.appendChild(newSlide);
                
                // Update to show the new recommendation
                currentIndex = recommendations.length - 1;
                updateCarouselDisplay();
                updateCarouselControls();
                
                // Save to session
                saveCarouselToSession();
                
                // Check if this is already a favorite
                checkFavoriteStatus(newPodcast.title);
            } else {
                alert("Couldn't find a new recommendation. Please try different preferences.");
            }
        })
        .catch(error => {
            console.error('Error generating recommendation:', error);
            alert("Something went wrong. Please try again.");
        })
        .finally(() => {
            // Reset button state
            generateNewBtn.disabled = false;
            generateNewBtn.textContent = "Recommend another one";
        });
    }
    
    // Create a new recommendation slide
    function createRecommendationSlide(podcast, index) {
        const slide = document.createElement('div');
        slide.className = 'recommendation-slide';
        slide.dataset.index = index;
        
        slide.innerHTML = `
            <section class="podcast-header">
                <div>
                    <p><span class="recommendation-label">We recommend</span></p>
                    <h2>${podcast.title}</h2>
                    <p class="spotify-description">
                        <span class="truncated-description">${podcast.description}</span>
                    </p>
                </div>
                <div>
                    <section class="podcast-image-container" data-name="${podcast.title}">
                        ${podcast.image ? 
                          `<img src="${podcast.image}" alt="${podcast.title}" class="podcast-image">` : 
                          `<img src="/images/podcast-placeholder.jpg" alt="Podcast Placeholder Image" class="podcast-image">`
                        }
                    </section>
                </div>
            </section>
            
            <section class="explanation">
                <h3>Why you might like it</h3>
                <p>${podcast.explanation || "Based on your interests and preferences, we think you'll enjoy this podcast. It matches your taste in content and listening style."}</p>
            </section>
            
            <div class="podcast-tags">
                ${podcast.tags && podcast.tags.length > 0 ? 
                  `<h4>Tags:</h4>
                   <ul class="tag-list">
                       ${podcast.tags.map(tag => `<li class="tag">${tag}</li>`).join('')}
                   </ul>` : 
                  ''
                }
            </div>
            
            <section class="spotify-section">
                <h3>Listen on Spotify</h3>
                ${podcast.embed_url ? 
                  `<div class="spotify-player">
                       <iframe 
                           src="${podcast.embed_url}" 
                           width="100%" 
                           height="232" 
                           frameborder="0" 
                           allowtransparency="true" 
                           allow="encrypted-media">
                       </iframe>
                   </div>` : 
                  podcast.spotify_url ? 
                  `<a href="${podcast.spotify_url}" target="_blank" class="spotify-link">
                       <img src="/images/spotify-logo.png" alt="Spotify Logo" class="spotify-logo">
                       Open in Spotify
                   </a>` : 
                  ''
                }
            </section>
        `;
        
        // Add show more/less button for description if needed
        setTimeout(() => {
            const descEl = slide.querySelector('.truncated-description');
            if (descEl && descEl.scrollHeight > descEl.clientHeight) {
                const button = document.createElement('button');
                button.className = 'show-more-button';
                button.textContent = 'Read more';
                
                button.addEventListener('click', function() {
                    if (descEl.classList.contains('show-full-text')) {
                        descEl.classList.remove('show-full-text');
                        button.textContent = 'Read more';
                        descEl.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        descEl.classList.add('show-full-text');
                        button.textContent = 'Read less';
                    }
                });
                
                descEl.parentNode.insertBefore(button, descEl.nextSibling);
            }
        }, 100);
        
        return slide;
    }
});