document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the survey page
    const surveyForm = document.getElementById('surveyForm');
    if (surveyForm) {
        // We're on the survey page - add the form submission handler
        surveyForm.addEventListener('submit', function(e) {
            // Create an object to store the form data
            const formData = new FormData(this);
            const surveyData = {};
            
            // Process all form fields, handling arrays properly
            for (const [key, value] of formData.entries()) {
                if (key in surveyData) {
                    // If the key already exists, make it an array
                    if (!Array.isArray(surveyData[key])) {
                        surveyData[key] = [surveyData[key]];
                    }
                    surveyData[key].push(value);
                } else {
                    surveyData[key] = value;
                }
            }
            
            // Store in sessionStorage for later use
            console.log("Storing survey data:", surveyData);
            sessionStorage.setItem('surveyData', JSON.stringify(surveyData));
            
            // Continue with form submission (don't prevent default)
        });
        
        // Exit early since we're not on the results page
        return;
    }
    
    // If we reach here, we're on the results page - implement carousel functionality
    
    // State management for recommendations
    const recommendationsState = {
        items: [],
        currentIndex: 0,
        
        // Initialize with the first recommendation
        init: function(initialRecommendation) {
            if (initialRecommendation && initialRecommendation.available) {
                this.items = [initialRecommendation];
                this.updateUI();
            }
        },
        
        // Add a new recommendation
        addRecommendation: function(recommendation) {
            this.items.push(recommendation);
            this.currentIndex = this.items.length - 1;
            this.updateUI();
        },
        
        // Navigate to previous recommendation
        previous: function() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateUI();
                return true;
            }
            return false;
        },
        
        // Navigate to next recommendation
        next: function() {
            if (this.currentIndex < this.items.length - 1) {
                this.currentIndex++;
                this.updateUI();
                return true;
            }
            return false;
        },
        
        // Get current recommendation
        current: function() {
            return this.items[this.currentIndex];
        },
        
        // Update UI to reflect current state
        updateUI: function() {
            // Update navigation buttons
            document.getElementById('prev-recommendation').disabled = this.currentIndex === 0;
            document.getElementById('next-recommendation').disabled = this.currentIndex === this.items.length - 1;
            
            // Update counter
            document.getElementById('current-index').textContent = this.currentIndex + 1;
            document.getElementById('total-count').textContent = this.items.length;
            
            // Update carousel display
            this.renderCurrentRecommendation();
        },
        
        // Render the current recommendation
        renderCurrentRecommendation: function() {
            const carousel = document.getElementById('recommendations-carousel');
            const currentRec = this.current();
            
            // Create a new slide for the current recommendation
            const slide = document.createElement('div');
            slide.className = 'recommendation-slide active';
            slide.dataset.index = this.currentIndex;
            
            // Remove any currently active slides
            const activeSlides = carousel.querySelectorAll('.recommendation-slide.active');
            activeSlides.forEach(activeSlide => {
                activeSlide.classList.remove('active');
                // We'll remove it after animation completes
                setTimeout(() => activeSlide.remove(), 500);
            });
            
            // Generate HTML for the recommendation
            slide.innerHTML = this.generateRecommendationHTML(currentRec);
            
            // Add the new slide
            carousel.appendChild(slide);
            
            // Initialize any interactive elements in the new slide
            this.initializeSlideInteractivity(slide);
        },
        
        // Generate HTML for a recommendation
        generateRecommendationHTML: function(recommendation) {
            if (!recommendation || !recommendation.available) {
                return `
                    <section class="no-results">
                        <h2>Sorry, we couldn't find a matching podcast</h2>
                        <p>Please try again with different preferences or categories.</p>
                    </section>
                `;
            }
            
            const tagsHTML = recommendation.tags && recommendation.tags.length > 0 
                ? `
                    <div class="podcast-tags">
                        <h4>Tags:</h4>
                        <ul class="tag-list">
                            ${recommendation.tags.map(tag => `<li class="tag">${tag}</li>`).join('')}
                        </ul>
                    </div>
                ` 
                : '';
                
            const spotifyPlayerHTML = recommendation.spotify_url 
                ? `
                    <section class="spotify-section">
                        <h3>Listen on Spotify</h3>
                        <div class="spotify-player">
                            <iframe 
                                src="${recommendation.embed_url || recommendation.spotify_url.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/')}" 
                                width="100%" 
                                height="232" 
                                frameborder="0" 
                                allowtransparency="true" 
                                allow="encrypted-media">
                            </iframe>
                        </div>
                    </section>
                `
                : '';
                
            return `
                <section class="podcast-header">
                    <div>
                        <p><span class="recommendation-label">We recommend</span></p>
                        <h2>${recommendation.title}</h2>
                        <p class="spotify-description">
                            <span class="truncated-description">${recommendation.description}</span>
                        </p>
                    </div>
                    <div>
                        <section class="podcast-image-container" data-name="${recommendation.title}">
                            <img src="${recommendation.image || '/images/podcast-placeholder.jpg'}" alt="${recommendation.title}" class="podcast-image">
                        </section>
                    </div>
                </section>
                
                <section class="explanation">
                    <h3>Why you might like it</h3>
                    <p>${recommendation.explanation || "Based on your interests and preferences, we think you'll enjoy this podcast. It matches your taste in content and listening style."}</p>
                </section>
                
                ${tagsHTML}
                ${spotifyPlayerHTML}
            `;
        },
        
        // Initialize interactivity for a new slide
        initializeSlideInteractivity: function(slide) {
            // Handle "Read more" functionality
            const descriptionEl = slide.querySelector('.truncated-description');
            if (descriptionEl) {
                const isTruncated = descriptionEl.scrollHeight > descriptionEl.clientHeight;
                
                if (isTruncated) {
                    const button = document.createElement('button');
                    button.className = 'show-more-button';
                    button.textContent = 'Read more';
                    
                    button.addEventListener('click', function() {
                        if (descriptionEl.classList.contains('show-full-text')) {
                            descriptionEl.classList.remove('show-full-text');
                            button.textContent = 'Read more';
                            descriptionEl.scrollIntoView({ behavior: 'smooth' });
                        } else {
                            descriptionEl.classList.add('show-full-text');
                            button.textContent = 'Read less';
                        }
                    });
                    
                    descriptionEl.parentNode.insertBefore(button, descriptionEl.nextSibling);
                }
            }
        }
    };
    
    // Check if we're on the results page
    const recommendationsCarousel = document.getElementById('recommendations-carousel');
    if (recommendationsCarousel) {
        // Initialize with the first recommendation
        recommendationsState.init(window.podcastData);
        
        // Set up event listeners for navigation
        const prevButton = document.getElementById('prev-recommendation');
        const nextButton = document.getElementById('next-recommendation');
        const generateNewButton = document.getElementById('generate-new');
        
        if (prevButton) {
            prevButton.addEventListener('click', function() {
                recommendationsState.previous();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', function() {
                recommendationsState.next();
            });
        }
        
        // Replace the event listener for the generate-new button
        if (generateNewButton) {
            generateNewButton.addEventListener('click', async function() {
                this.disabled = true;
                this.textContent = 'Generating...';
                
                try {
                    // First try to get data from window.originalSurveyData
                    let surveyData = window.originalSurveyData;
                    
                    // If not available, try sessionStorage
                    if (!surveyData) {
                        const storedData = sessionStorage.getItem('surveyData');
                        if (storedData) {
                            surveyData = JSON.parse(storedData);
                        }
                    }
                    
                    // Make sure we have the essential fields
                    if (!surveyData || !surveyData.interests || !surveyData.mood) {
                        console.error("Missing survey data:", surveyData);
                        alert("Sorry, we couldn't retrieve your preferences. Please try the survey again.");
                        window.location.href = '/survey';
                        return;
                    }
                    
                    console.log("Using survey data for new recommendation:", surveyData);
                    
                    // Make API call to get a new recommendation
                    const response = await fetch('/api/recommend', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(surveyData)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to get recommendation');
                    }
                    
                    const data = await response.json();
                    
                    if (!data.success || !data.podcast) {
                        throw new Error('Invalid recommendation data');
                    }
                    
                    // Add the new recommendation to our carousel
                    recommendationsState.addRecommendation({
                        title: data.podcast.title,
                        description: data.podcast.description || data.spotify.description,
                        explanation: data.podcast.description,
                        tags: data.podcast.tags || [],
                        spotify_url: data.spotify.spotify_url || "",
                        embed_url: data.spotify.embed_url || "",
                        image: data.spotify.image || "",
                        available: true
                    });
                    
                } catch (error) {
                    console.error('Error generating recommendation:', error);
                    alert('Failed to generate a new recommendation. Please try again.');
                } finally {
                    this.disabled = false;
                    this.textContent = 'Get Another Recommendation';
                }
            });
        }
    }
});