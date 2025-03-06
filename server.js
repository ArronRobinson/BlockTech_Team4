require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const uri = `mongodb+srv://${process.env.DATA_USERNAME}:${process.env.DATA_PW}@${process.env.DATA_HOST}/${process.env.DATA_NAME}?retryWrites=true&w=majority`;

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('static'));

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
});

const User = mongoose.model("User", userSchema);

app
    .get('/', onindex)
    .get('/signup', onsignup)
    .get('/login', onlogin); 

function onindex(req, res) {
    res.render('index', { title: 'Index Page' });
}

function onsignup(req, res) {
    res.render('signup', { title: 'Sign Up Page' });
}

function onlogin(req, res) {
    res.render('login', { title: 'Log In Page' });
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

        res.redirect("/");
    } catch (error) {
        res.status(500).json({ message: "Error signing up" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});