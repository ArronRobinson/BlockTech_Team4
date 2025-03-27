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
    }]
});

const User = mongoose.model("User", userSchema);

app
    .get('/', onindex)
    .get('/signup', onsignup)
    .get('/login', onlogin)
    .get('/favorite', authenticateToken, onfavorite)
    .get('/survey', authenticateToken, onsurvey)
    .get ('/result', authenticateToken, onresult)
    .get('/account', authenticateToken, onaccount)


function onsurvey(req, res) {
    res.render('survey', { title: 'Survey Page'});
}

function onaccount(req, res) {
    res.render('account', { title: 'Account Page'})
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

function onresult(req, res) {
    res.render('result', { title: 'Result Page' });
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
function generatePodcastPrompt(userData, triedPodcasts) {
    return `A user is looking for a podcast recommendation.
    Their interests are: **${userData.interests.join(", ")}**.
    They prefer **${userData.preferred_podcast_length}** episodes.
    The podcast should have a **${userData.mood.join(", ")}** vibe.

    🔹 **Important Requirements**:
    - Recommend only **well-known, popular podcasts that are available on Spotify**.
    - Avoid niche recommendations that may not be widely available.
    
    🚫 **DO NOT RECOMMEND** these podcasts: ${Array.from(triedPodcasts).join(", ")}.
    
    **Return structured JSON in this format (without markdown):**
    {
        "title": "Podcast Name",
        "description": "A short explanation of why this podcast is recommended.",
        "tags": ["genre1", "genre2"],
        "spotify_search_query": "Podcast Name"
    }`;
}

async function getValidPodcastRecommendation(userData) {
    let maxAttempts = 3; // Try up to 3 times
    let triedPodcasts = new Set(); // Keep track of previous recommendations

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`🔄 Attempt ${attempt}: Getting recommendation...`);

        const prompt = generatePodcastPrompt(userData, triedPodcasts);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a podcast recommendation expert. Always return structured JSON." },
                { role: "user", content: prompt }
            ],
        });

        let responseText = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
        const podcastRecommendation = JSON.parse(responseText);

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
    })
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

        const finalPodcast = await getValidPodcastRecommendation(userData);

        if (!finalPodcast) {
            return res.render("result", { 
                podcast: null, 
                spotify: null,
                surveyData: userData // Pass survey data to template
            });
        }

        res.render("result", { 
            podcast: finalPodcast.podcastRecommendation, 
            spotify: finalPodcast.spotifyPodcast,
            surveyData: userData // Pass survey data to template
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).send("Something went wrong.");
    }
});

// Save favorite podcast
app.post("/save-favorite", authenticateToken, async (req, res) => {
    try {
        const { podcastData } = req.body;
        
        await User.findByIdAndUpdate(req.user.userId, {
            $addToSet: { favoritePodcasts: podcastData }
        });
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error saving favorite:", error);
        res.status(500).json({ success: false, message: "Error saving favorite" });
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

        console.log("Processed user data for API recommendation:", userData);
        
        // Validate that we have the minimum required data
        if (!userData.interests.length || !userData.mood.length) {
            return res.status(400).json({
                success: false,
                message: "Missing required interests or mood preferences"
            });
        }

        const finalPodcast = await getValidPodcastRecommendation(userData);

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




app.post ("/logout", (req, res) => { 
    res.cookie("token", "", {maxAge: 0});
    res.redirect("/login");
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});