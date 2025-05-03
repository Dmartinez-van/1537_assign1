const express = require("express");
const session = require("express-session");
const Joi = require("joi");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrpyt");
const saltRounds = 12;

const port = process.env.PORT || 3001;
const app = express();

app.get("/", (req, res) => {
  // if user not logged in, Display two buttons: login and singup
  if (!req.session.user) {
    res.send(`
            <form action="/signup" method="POST">
                <button type="submit">Signup</button>
            </form>
            <form action="/login" method="POST">
                <button type="submit">Login</button>
            </form>
        `);
  } else {
    res.send(`
            <h1>Hello, ${req.session.user.username || "User"}!
            <form action="/membersOnly" method="GET">
                <button type="submit">Go to Members Area</button>
            </form>
            <form action="logout" method="POST">
                <button type="submit">Logout</button>
            </form>
        `);
  }
});
