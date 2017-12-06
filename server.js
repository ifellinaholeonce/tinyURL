const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 8080;

let urlDB = require('./models/urls').urlDB;
let users = require('./models/users').users;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


app.get("/", (req, res) => {
  res.end("Hello!");
});

////////////////////////////////////////////////////
//////////////USER REGISTRATION COOKIE//////////////
////////////////////////////////////////////////////

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (checkEmailExists(email)) {
    if (checkPassword(email, password)) {
      res.cookie('user_id', getUserID(email));
      res.redirect(303, `/urls`);
    }
  } else {
    res.satus(403).send("Forbidden.");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(303, `/urls`);
});


app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (!email || !password || checkEmailExists(email)) {
    res.status(400).send("Invalid Registration");
  }
  let id = generateRandomString(8, '#a');
  users[id] = {
    id: id,
    email: email,
    password: password
  };
  res.cookie('user_id', id);
  res.redirect(303, '/urls');
  console.log(users);
});

////////////////////////////////////////////////////
//////////////APP ROUTING///////////////////////////
////////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  let templateVars = {
    user_id: req.cookies.user_id,
    urlDB
  };
  res.render("urls_index", {
    user_id : templateVars.user_id,
    urlDB : templateVars.urlDB
  });
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString(6, '#aA');
  urlDB[shortURL] = longURL;
  res.redirect(303, `/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.cookies.user_id
  };
  res.render("urls_new", {user_id: templateVars.user_id});
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user_id: req.cookies.user_id,
    shortURL: req.params.id,
    urlDB
    };
  if (urlDB[req.params.id]) {
    res.render("urls_show", {
      user_id : templateVars.user_id,
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
    user_id: req.cookies.user_id
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
//////////////RANDOM ALPHANUMBER GEN////////////////
////////////////////////////////////////////////////
let generateRandomString = (length, chars) => {
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
//////////////Check Registration////////////////////
////////////////////////////////////////////////////
let checkEmailExists = (email) => {
  for (let user in users) {
    if (users[user].email == email) {
      return true;
    }
  }
    console.log(false);
    return false;
};

let checkPassword = (email, password) => {
  for (let user in users) {
    if (users[user].email == email) {
      return users[user].password === password;
    }
  }
};

let getUserID = (email) => {
  for (let user in users) {
    if (users[user].email == email) {
      return users[user].id;
    }
  }
};
////////////////////////////////////////////////////
//////////////////START APP/////////////////////////
////////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});