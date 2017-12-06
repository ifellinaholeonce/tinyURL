const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 8080;

let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(303, `/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(303, `/urls`);
});


app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies.username,
    urlDB
  };
  res.render("urls_index", {
    username : templateVars.username,
    urlDB : templateVars.urlDB
  });
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString(longURL);
  urlDB[shortURL] = longURL;
  res.redirect(303, `/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies.username
  };
  res.render("urls_new", {username: templateVars.username});
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies.username,
    shortURL: req.params.id,
    urlDB
    };
  if (urlDB[req.params.id]) {
    res.render("urls_show", {
      username : templateVars.username,
      shortURL : templateVars.shortURL,
      urlDB : templateVars.urlDB
    });
  } else {
    res.redirect(404, "/urls/new");
  }
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  urlDB[shortURL] = longURL;
  res.redirect(303, `/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDB[req.params.id];
  res.redirect(303, "/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {
    username: req.cookies.username
  };
  let shortURL = req.params.shortURL;
  if (urlDB[shortURL]) {
    if (urlDB[shortURL].startsWith('http://www.') || urlDB[shortURL].startsWith('https://www.')) {
    res.redirect(307, urlDB[shortURL]);
    } else {
    res.redirect(307, `http://www.${urlDB[shortURL]}`);
    }
  } else {
    res.redirect(404, "/urls/new");
  }
});

////////////////////////////////////////////////////
//////////////RANDOM ALPHANUMBER GEN/////////////////////
////////////////////////////////////////////////////
let generateRandomString = () => {
  let length = 6;
  let chars = '#aA';
  let mask = '';
  if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
  if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (chars.indexOf('#') > -1) mask += '0123456789';
  let result = '';
  for (let i = length; i > 0; --i) {
    result += mask[Math.round(Math.random() * (mask.length - 1))];
  }
  return result;
};

////////////////////////////////////////////////////
//////////////////START APP/////////////////////////
////////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});