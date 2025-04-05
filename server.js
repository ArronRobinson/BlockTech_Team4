require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const { OpenAI } = require("openai");
const rateLimit = require("express-rate-limit");
const nodemailer = require('nodemailer');
const session = require('express-session');
const uri = `mongodb+srv://${process.env.DATA_USERNAME}:${process.env.DATA_PW}@${process.env.DATA_HOST}/${process.env.DATA_NAME}?retryWrites=true&w=majority`;
const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET_KEY;

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "too many login attempts"
});

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('static'));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Error connecting to MongoDB:", err));

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    favoritePodcasts: [{
        title: String,
        description: String,
        tags: [String],
        spotify_url: String,
        image: String
    }],
});

const User = mongoose.model("User", userSchema);

app.use(session({
    secret: process.env.SESSION_SECRET || 'podcast-recommendation-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app
    .get('/', onindex)
    .get('/signup', onsignup)
    .get('/login', onlogin)
    .get('/favorite', authenticateToken, onfavorite)
    .get('/survey', authenticateToken, onsurvey)
    .get('/recommend', authenticateToken, surveyCompletedCheck, onresult)
    .get('/account', authenticateToken, onaccount)
    .get('/wachtwoordveranderen', authenticateToken, onwwveranderen)

function onsurvey(req, res) {
    res.render('survey', { title: 'Survey Page'});
}

function onaccount(req, res) {
    if (!req.user) {
        return res.redirect('/login');
    }
    res.render('account', { username: req.user.username });
}

function onindex(req, res) {
    res.render('index', { title: 'Index Page' });
}

function onsignup(req, res) {
    res.render('signup', { title: 'Sign Up Page' });
}

function onlogin(req, res) {
    res.render('login', { title: 'Log In Page' });
}

// Update the onresult function to include carousel history from the session
function onresult(req, res) {
    // Check if there's a recommendation in the session
    if (req.session.recommendation) {
        // Include carousel history if it exists
        return res.render('result', {
            ...req.session.recommendation,
            carouselHistory: req.session.carouselHistory || []
        });
    }
    
    // If no recommendation, show empty result
    res.render('result', { 
        title: 'Result Page',
        podcast: null,
        spotify: null,
        carouselHistory: req.session.carouselHistory || []
    });
}

function onwwveranderen(req, res) {
    res.render('wachtwoordveranderen', { title: 'Wachtwoord veranderen'})
}

function onfavorite(req, res) {
    // Get user favorites from database
    User.findById(req.user.userId)
        .then(user => {
            if (!user) {
                return res.redirect('/login');
            }
            res.render('favorite', { 
                title: 'Favorite Page', 
                favoritePodcasts: user.favoritePodcasts || [] 
            });
        })
        .catch(err => {
            console.error("Error retrieving favorites:", err);
            res.status(500).send("Error retrieving favorites");
        });
}

// Spotify API Functions
async function getSpotifyToken() {
    const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials" }),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
                ).toString("base64")}`,
            },
        }
    );
    return response.data.access_token;
}

async function fetchSpotifyPodcast(query) {
    try {
        const token = await getSpotifyToken();
        
        // Search for the podcast show
        const searchResponse = await axios.get(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=show&limit=10`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!searchResponse.data.shows || searchResponse.data.shows.items.length === 0) {
            console.log(`❌ No results from Spotify for "${query}".`);
            return null;
        }

        // Normalize query for better matching
        const normalize = str => str.toLowerCase().replace(/[^a-z0-9 ]/g, '');
        const normalizedQuery = normalize(query);

        // Find closest match
        let bestMatch = searchResponse.data.shows.items.find(show => 
            normalize(show.name) === normalizedQuery
        ) || searchResponse.data.shows.items[0]; // Fallback to first result

        console.log(`✅ Best Match Found: "${bestMatch.name}"`);
        
        // Fetch the latest episodes for this show
        const episodesResponse = await axios.get(
            `https://api.spotify.com/v1/shows/${bestMatch.id}/episodes?limit=3`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const latestEpisodes = episodesResponse.data.items.map(episode => ({
            id: episode.id,
            embed_url: `https://open.spotify.com/embed/episode/${episode.id}`
        }));

        console.log(`🎨 Podcast Image URL: ${bestMatch.images[0]?.url || "No image available"}`);

        return {
            title: bestMatch.name,
            description: bestMatch.description,
            image: bestMatch.images[0]?.url,
            spotify_url: bestMatch.external_urls.spotify,
            embed_url: `https://open.spotify.com/embed/show/${bestMatch.id}`,
            episodes: latestEpisodes
        };

    } catch (error) {
        console.error("Spotify API Error:", error.message);
        return null;
    }
}

// AI Recommendation Functions
function generatePodcastPrompt(userData, triedPodcasts, alreadyRecommendedPodcasts = []) {
    // Combine both sets of podcasts to exclude
    const allExcludedPodcasts = new Set([...Array.from(triedPodcasts), ...alreadyRecommendedPodcasts]);
    
    // Define allowed tags in Dutch
    const allowedTags = [
        'Sports', 'Boeken', 'Koken', 'Gamen', 'Muziek', 'Film', 
        'Nieuws en politiek', 'Kunst', 'Misdaad', 'Geschiedenis', 'Mode', 'Lifestyle'
    ];
    
    return `A user is looking for a podcast recommendation.
    Their interests are: **${userData.interests.join(", ")}**.
    They prefer **${userData.preferred_podcast_length}** episodes.
    The podcast should have a **${userData.mood.join(", ")}** vibe.

    🔹 **Important Requirements**:
    - Recommend only **well-known, popular podcasts that are available on Spotify**.
    - Avoid niche recommendations that may not be widely available.
    - ONLY use these specific tags in the response: ${allowedTags.join(", ")}
    - Select 1-3 tags that best match the podcast from the allowed tags list.
    - Do not invent new tags or categories.
    
    🚫 **DO NOT RECOMMEND** these podcasts: ${Array.from(allExcludedPodcasts).join(", ")}.
    
    **Return structured JSON in this format (without markdown):**
    {
        "title": "Podcast Name",
        "description": "A short explanation of why this podcast is recommended.",
        "tags": ["tag1", "tag2"],
        "spotify_search_query": "Podcast Name"
    }`;
}

async function getValidPodcastRecommendation(userData, alreadyRecommendedPodcasts = []) {
    let maxAttempts = 3; // Try up to 3 times
    let triedPodcasts = new Set(); // Keep track of previous recommendations
    const allowedTags = [
        'Sports', 'Boeken', 'Koken', 'Gamen', 'Muziek', 'Film', 
        'Nieuws en politiek', 'Kunst', 'Misdaad', 'Geschiedenis', 'Mode', 'Lifestyle'
    ];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Attempt ${attempt}: Getting recommendation...`);

        const prompt = generatePodcastPrompt(userData, triedPodcasts, alreadyRecommendedPodcasts);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: `You are a podcast recommendation expert that only uses these specific tags: ${allowedTags.join(", ")}. 
                              Always return structured JSON with tags selected only from this allowed list.` 
                },
                { role: "user", content: prompt }
            ],
        });

        let responseText = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
        let podcastRecommendation;
        
        try {
            podcastRecommendation = JSON.parse(responseText);
            
            // Validate and filter tags to ensure they're from the allowed list
            if (podcastRecommendation.tags && Array.isArray(podcastRecommendation.tags)) {
                podcastRecommendation.tags = podcastRecommendation.tags.filter(tag => 
                    allowedTags.includes(tag)
                );
            } else {
                podcastRecommendation.tags = [];
            }
            
            console.log("AI Recommended Podcast:", podcastRecommendation);
            
            if (triedPodcasts.has(podcastRecommendation.title.toLowerCase())) {
                console.log(`⚠️ Recommended the same podcast again: ${podcastRecommendation.title}. Retrying...`);
                continue; // Skip to the next attempt
            }

            triedPodcasts.add(podcastRecommendation.title.toLowerCase());

            // Fetch actual Spotify details
            const spotifyPodcast = await fetchSpotifyPodcast(podcastRecommendation.title);

            if (spotifyPodcast) {
                console.log("✅ Found on Spotify:", spotifyPodcast.title);
                return { podcastRecommendation, spotifyPodcast };
            } else {
                console.log(`❌ Not found on Spotify: "${podcastRecommendation.title}". Retrying...`);
            }
        } catch (error) {
            console.error("Error parsing AI response:", error, "Response was:", responseText);
            continue; // Try again
        }
    }

    console.log("❌ No valid podcasts found after retries.");
    return null;
}

function authenticateToken (req, res, next) {
    const token = req.cookies.token;
    if(!token) return res.status(401).json({message: "Acces Denied"});
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(401).json({message: "Invalid Token"});
        req.user = user;
        next();
    });
}

function surveyCompletedCheck(req, res, next) {
    if (req.path === '/recommend') {
        // Check if the user has completed the survey in this session
        if (!req.session?.surveyCompleted) {
            return res.render('survey-required', { 
                title: 'Survey Required',
                message: 'Please complete the survey first to get recommendations.'
            });
        }
    }
    next();
}

app.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.redirect("/login");
    } catch (error) {
        res.status(500).json({ message: "Error signing up" });
    }
});

app.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({username});
        if(!user) return res.status(400).json({message: "User not found"});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message: "Invalid credentials"});

        const token = jwt.sign({ userId: user._id, username: user.username}, SECRET_KEY, {expiresIn: "7d"});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 120 * 60 * 1000,
            sameSite: "strict"
        });

        res.redirect("/survey");
    } catch (error) {
        res.status(500).json({message: "error logging in", error: error.message });
    }
});

// Podcast recommendation route
app.post("/recommend", authenticateToken, async (req, res) => {
    try {
        const userData = {
            interests: Array.isArray(req.body.interests) ? req.body.interests : [req.body.interests],
            preferred_podcast_length: req.body.preferred_podcast_length || "medium",
            mood: Array.isArray(req.body.mood) ? req.body.mood : [req.body.mood]
        };

        console.log("Received user data:", userData);

        // Mark that the user has completed the survey in this session
        req.session.surveyCompleted = true;
        req.session.surveyData = userData;

        const finalPodcast = await getValidPodcastRecommendation(userData);

        if (!finalPodcast) {
            return res.render("result", { 
                podcast: null, 
                spotify: null,
                surveyData: userData
            });
        }

        // Save the recommendation in the session
        req.session.recommendation = {
            podcast: finalPodcast.podcastRecommendation,
            spotify: finalPodcast.spotifyPodcast,
            surveyData: userData
        };

        res.render("result", { 
            podcast: finalPodcast.podcastRecommendation, 
            spotify: finalPodcast.spotifyPodcast,
            surveyData: userData
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).send("Something went wrong.");
    }
});

// Add a new endpoint to check if a podcast is in favorites
app.post("/check-favorite", authenticateToken, async (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title) {
            return res.status(400).json({ success: false, message: "Missing podcast title" });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        // Check if podcast is already in favorites - use case insensitive comparison
        const alreadyExists = user.favoritePodcasts.some(podcast => 
            podcast.title.toLowerCase() === title.toLowerCase()
        );
        
        res.status(200).json({ 
            success: true, 
            isFavorite: alreadyExists
        });
    } catch (error) {
        console.error("Error checking favorite status:", error);
        res.status(500).json({ success: false, message: "Error checking favorite status" });
    }
});

// Modify the existing add-favorite route to return isFavorite status
app.post("/add-favorite", authenticateToken, async (req, res) => {
    try {
        const { title, description, tags, spotify_url, image } = req.body;

        if (!title || !spotify_url) {
            return res.status(400).json({ success: false, message: "Invalid podcast data" });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        // Check if podcast is already in favorites - use case insensitive comparison
        const alreadyExists = user.favoritePodcasts.some(podcast => 
            podcast.title.toLowerCase() === title.toLowerCase()
        );
        
        if (alreadyExists) {
            return res.status(200).json({ 
                success: true, 
                isFavorite: true, 
                message: "Podcast already in favorites" 
            });
        }

        // Add to favorites
        user.favoritePodcasts.push({ title, description, tags, spotify_url, image });
        await user.save();

        res.status(200).json({ 
            success: true, 
            isFavorite: true,
            message: "Podcast added to favorites" 
        });
    } catch (error) {
        console.error("Error adding favorite:", error);
        res.status(500).json({ success: false, message: "Error adding favorite" });
    }
});

// Remove favorite podcast
app.post("/remove-favorite", authenticateToken, async (req, res) => {
    try {
        const { podcastTitle } = req.body;
        
        await User.findByIdAndUpdate(req.user.userId, {
            $pull: { favoritePodcasts: { title: podcastTitle } }
        });
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error removing favorite:", error);
        res.status(500).json({ success: false, message: "Error removing favorite" });
    }
});

// API endpoint for getting recommendations without page reload
app.post("/api/recommend", authenticateToken, async (req, res) => {
    try {
        // Log full request body to debug
        console.log("Raw request body:", req.body);
        
        const userData = {
            interests: Array.isArray(req.body.interests) ? req.body.interests : 
                       (req.body.interests ? [req.body.interests] : []),
            preferred_podcast_length: req.body.preferred_podcast_length || "medium",
            mood: Array.isArray(req.body.mood) ? req.body.mood : 
                  (req.body.mood ? [req.body.mood] : [])
        };

        // Get already recommended podcasts to exclude from new recommendations
        const alreadyRecommendedPodcasts = req.body.alreadyRecommended || [];
        console.log("Already recommended podcasts:", alreadyRecommendedPodcasts);

        console.log("Processed user data for API recommendation:", userData);
        
        // Validate that we have the minimum required data
        if (!userData.interests.length || !userData.mood.length) {
            return res.status(400).json({
                success: false,
                message: "Missing required interests or mood preferences"
            });
        }

        // Pass already recommended podcasts to the recommendation function
        const finalPodcast = await getValidPodcastRecommendation(userData, alreadyRecommendedPodcasts);

        if (!finalPodcast) {
            return res.status(404).json({ 
                success: false, 
                message: "No matching podcast found" 
            });
        }

        res.json({ 
            success: true,
            podcast: finalPodcast.podcastRecommendation, 
            spotify: finalPodcast.spotifyPodcast 
        });

    } catch (error) {
        console.error("❌ Error in API recommendation:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "Something went wrong generating a recommendation." 
        });
    }
});

// Add an API endpoint to save carousel history
app.post("/api/save-carousel", authenticateToken, (req, res) => {
    try {
        const { podcasts } = req.body;
        
        if (!Array.isArray(podcasts)) {
            return res.status(400).json({ success: false, message: "Invalid podcasts data" });
        }
        
        // Save the carousel history to the session
        req.session.carouselHistory = podcasts;
        
        res.status(200).json({ success: true, message: "Carousel history saved" });
    } catch (error) {
        console.error("Error saving carousel history:", error);
        res.status(500).json({ success: false, message: "Error saving carousel history" });
    }
});

// Add this middleware function if it doesn't exist already
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
};

// Route for podcast detail without authentication requirement
app.get('/podcast-detail/:title', async (req, res) => {
    try {
        const podcastTitle = decodeURIComponent(req.params.title);
        
        // Check if user is logged in
        if (!req.session.userId) {
            // For non-authenticated users, render a simplified detail page
            return res.render('podcast-detail', {
                podcast: {
                    title: podcastTitle,
                    description: "Please log in to see full podcast details.",
                    image: "/images/podcast-placeholder.jpg",
                    tags: []
                },
                username: "Guest"
            });
        }
        
        // For authenticated users, get their favorites
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Find the podcast in user's favorites
        const podcast = user.favorites.find(p => p.title === podcastTitle);
        
        if (!podcast) {
            return res.status(404).render('error', { 
                message: 'Podcast not found in your favorites',
                username: user.username 
            });
        }
        
        // Check if we need to fetch Spotify embed data
        if (!podcast.embed_url && podcast.spotify_url) {
            try {
                const spotifyId = extractSpotifyId(podcast.spotify_url);
                if (spotifyId) {
                    podcast.embed_url = `https://open.spotify.com/embed/show/${spotifyId}`;
                }
            } catch (error) {
                console.error('Error generating Spotify embed URL:', error);
            }
        }
        
        // Render the podcast detail page
        return res.render('podcast-detail', { 
            podcast,
            username: user.username 
        });
    } catch (error) {
        console.error('Error in podcast detail route:', error);
        return res.status(500).send('Server error');
    }
});

// Helper function to extract Spotify ID from URL
function extractSpotifyId(url) {
    if (!url) return null;
    const match = url.match(/show\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

app.post ("/logout", (req, res) => { 
    res.cookie("token", "", {maxAge: 0});
    res.redirect("/login");
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.post("/wachtwoordveranderen", async (req, res) => {

    const { username, password } = req.body;

    // Controleer of beide waarden aanwezig zijn
    if (!username || !password) {
        return res.status(400).json({ message: "Gebruikersnaam en nieuw wachtwoord zijn vereist" });
    }

    try {
        // Zoek gebruiker in de database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "Gebruiker niet gevonden" });
        }

        // Wachtwoord hashen
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update het wachtwoord in de database
        user.password = hashedPassword;
        await user.save();

        res.send(`
        <script>
            sessionStorage.setItem("passwordChanged", "true");
            window.location.href = "/account";
        </script>
    `);

    } catch (error) {
        console.error("Fout bij updaten wachtwoord:", error);
        res.status(500).json({ message: "Interne serverfout" });
    }
});