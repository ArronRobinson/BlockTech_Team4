require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
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

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
});

const User = mongoose.model("User", userSchema);

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

app
    .get('/', onindex)
    .get('/signup', onsignup)
    .get('/login', onlogin)
    .get('/explore', authenticateToken, onexplore)
    .get('/favorite', authenticateToken, onfavorite);

function onexplore(req, res) {
    res.render('explore', { title: 'Explore Page' });
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

function onfavorite(req, res) {
    res.render('favorite', { title: 'Favorite Page' });
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
            maxAge: 15 * 60 * 1000,
            sameSite: "strict"
        });

        res.redirect("/explore");
    } catch (error) {
        res.status(500).json({message: "error logging in", error: error.message });
    }
    
});

app.post ("/logout", (req, res) => { 
    res.cookie("token", "", {maxAge: 0});
    res.redirect("/login");
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});