const express = require("express");
const session = require("express-session");
const path = require("path");
const Joi = require("joi");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const saltRounds = 12;

// converts jpegs to png (got the suggestion from chatgpt).
// Also could've looked into ffmpeg instead, but I wanna try this.
const sharp = require("sharp");
// sample code:
// sharp('input.jpg')
//   .png()
//   .toFile('output.png')
//   .then(() => console.log('Conversion complete!'))
//   .catch(err => console.error(err));

require("dotenv").config();
const PORT = process.env.PORT || 3001;
const app = express();

app.use(
  session({
    secret: "Kitty doggo",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: 3600000 },
  })
);

app.use("/static", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  // if user not logged in, Display two buttons: login and singup
  if (!req.session.user) {
    res.send(`
            <h1>Currently not logged in, no session</h1>
            <form action="/signup" method="GET">
                <button type="submit">Signup</button>
            </form>
            <form action="/login" method="GET">
                <button type="submit">Login</button>
            </form>
        `);
  } else {
    res.send(`
            <h1>Hello, ${req.session.user.username || "User"}!
            <form action="/membersOnly" method="GET">
                <button type="submit">Go to Members Area</button>
            </form>
            <form action="/logout" method="POST">
                <button type="submit">Logout</button>
            </form>
        `);
  }
});

app.get("/signup", (req, res) => {
  res.send(`
            <div>Create User</div>
            <form action="/createUser" method="POST">
                <input type="text" placeholder="name" />
                <input type="text" placeholder="email" />
                <input type="password" placeholder="password" id="password" />
                <button type="submit">Submit</button>
            </form>
            <button id="toggleShowPass" onclick="showPass()">show password</button>
            <script>
                function showPass() {
                    const passInput = document.getElementById("password");
                    passInput.type = passInput.type === "password" ? "text" : "password";
                    
                    const toggleBtn = document.getElementById("toggleShowPass");
                    toggleBtn.textContent = toggleBtn.textContent === "show password" 
                                                ? "hide password" : "show password";
                };
            </script>
        `);
});

app.get("/login", (req, res) => {
  res.send(`
            <h3>Login</h3>
            <form action="/login" method="POST">
                <input type="text" placeholder="email" />
                <input type="password" placeholder="password" id="password" />
                <button>Login</button>
            </form>
            <script>
                function showPass() {
                    const passInput = document.getElementById("password");
                    passInput.type = passInput.type === "password" ? "text" : "password";
                    
                    const toggleBtn = document.getElementById("toggleShowPass");
                    toggleBtn.textContent = toggleBtn.textContent === "show password" 
                                                ? "hide password" : "show password";
                };
            </script>
        `);
});

app.post("/login", (req, res) => {
  res.redirect("/members");
});

app.get("/members", (req, res) => {
  res.send(`
            <h3>Welcome to members area, ${
              req.session.user.username || "User"
            }!</h3>
            <img src= />
        `);
});

app.listen(PORT);
