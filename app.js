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

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const { database } = require("./databaseConnection.js");
const userCollection = database.db(mongodb_database).collection("users");

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(express.urlencoded({ extended: false }));
const expireTime = 3600000;
app.use(
  session({
    secret: process.env.NODE_SESSION_SECRET,
    store: mongoStore,
    resave: true,
    saveUninitialized: false,
    cookie: { secure: true, maxAge: expireTime },
  })
);

app.use(express.static(path.join(__dirname, "/public")));

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
                <input name="username" type="text" placeholder="name">
                <input name="email" type="text" placeholder="email">
                <input name="password" type="password" placeholder="password" id="password">
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

app.post("/createUser", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    password: Joi.string().max(20).required(),
    email: Joi.string().email().required(),
  });

  const valid = schema.validate({ username, password, email });
  // Use != to loosly check for null and undefined
  if (valid.error != null) {
    res.redirect("/signup");
    return;
  }

  const hashedPass = await bcrypt.hash(password, saltRounds);
  await userCollection.insertOne({ username, email, password: hashedPass });

  res.send("New user signup completed successfully");
});

app.get("/login", (req, res) => {
  res.send(`
            <h3>Login</h3>
            <form action="/login" method="POST">
                <input name="email" type="text" placeholder="email">
                <input name="password" type="password" placeholder="password" id="password">
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

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const schema = Joi.string().email().required();
  const valid = schema.validate(email);
  if (valid != null) {
    console.log(valid.error);
    return res.redirect("/login");
  }

  const foundUser = await userCollection
    .find({ email })
    .project({ email: 1, username: 1, password: 1, _id: 1 })
    .toArray();

  console.log({ foundUser });
  if (foundUser.length >= 1) {
    console.log("user not found");
    return res.redirect("/login");
  }

  if (await bcrypt.compare(password, foundUser[0].password)) {
    console.log("correct password");
    req.session.auth = true;
    req.session.username = username;
    req.session.cookie.maxAge = expireTime;

    return res.redirect("/members");
  } else {
    console.log("incorrect password");
    return res.redirect("/login");
  }
});

app.get("/members", (req, res) => {
  // Math.random() generates random num from 0 to 1 (1 not inclusive)
  // Multiply result by 3 to get some value up to 3. Then add 1 to be inclusive of 3.
  const randomNum = Math.floor(Math.random() * 3) + 1;
  console.log("random number is : ", randomNum);
  let imgSrc;
  if (randomNum === 1) {
    imgSrc = "/images/eq1.jpeg";
  } else if (randomNum === 2) {
    imgSrc = "/images/eq2.png";
  } else {
    imgSrc = "/images/eq3.jpeg";
  }
  res.send(`
            <h3>Welcome to members area, ${
              req.session?.username || "User"
            }!</h3>
            <img src="${imgSrc}" alt="anImage" style="width:1050px"/>
        `);
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}...`);
});
