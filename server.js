const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 8080;

const urlDB = require('./models/urls').urlDB;
const users = require('./models/users').users;

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
    res.status(403).send("Forbidden.");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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
});

////////////////////////////////////////////////////
//////////////APP ROUTING///////////////////////////
////////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  let templateVars = {
    user_id: req.cookies.user_id,
    urlDB
  };
  if (users[req.cookies.user_id]) {
    templateVars.userEmail = users[req.cookies.user_id].email;
  }
  res.render("urls_index", {
    templateVars,
    user_id : templateVars.user_id,
    urlDB : urlsForId(templateVars.user_id)
  });
});

app.post("/urls", (req, res) => {
  let user_id = "";
  if (users[req.cookies.user_id]) {
    user_id = req.cookies.user_id;
  } else {
    console.log("not logged in");
  }
  let longURL = req.body.longURL;
  let shortURL = generateRandomString(6, '#aA');
  urlDB[shortURL] = {
   [shortURL]: longURL,
   'user_id': user_id
 };
  //console.log(urlDB);
  res.redirect(303, `/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user_id: req.cookies.user_id
  };
  if (users[req.cookies.user_id]) {
    templateVars.userEmail = users[req.cookies.user_id].email;
    res.render("urls_new", {
      templateVars,
      user_id: templateVars.user_id
    });
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user_id: req.cookies.user_id,
    shortURL: req.params.id,
    urlDB
    };
  if (users[req.cookies.user_id]) {
    templateVars.userEmail = users[req.cookies.user_id].email;
  }
  if(req.cookies.user_id) {
    for (let url in urlsForId(req.cookies.user_id)) {
      console.log(url);
      if (url === req.params.id) {
        res.render("urls_show", {
          templateVars,
          user_id : templateVars.user_id,
          shortURL : templateVars.shortURL,
          urlDB : templateVars.urlDB
        });
      } else {
        res.status(400).redirect("/urls");
      }
    }
  } else {
    res.status(400).redirect("/");
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
  // let templateVars = {
  //   user_id: req.cookies.user_id
  // };
  let shortURL = req.params.shortURL;
  //console.log(urlDB[shortURL][shortURL]);
  if (urlDB[shortURL]) {
    if (urlDB[shortURL][shortURL].startsWith('http://www.') || urlDB[shortURL][shortURL].startsWith('https://www.')) {
    res.redirect(307, urlDB[shortURL][shortURL]);
    } else {
    res.redirect(307, `http://www.${urlDB[shortURL][shortURL]}`);
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
    return false;
};

let checkPassword = (email, password) => {
  for (let user in users) {
    if (users[user].email == email) {
      return users[user].password === password;
    }
  }
  return false;
};

let getUserID = (email) => {
  for (let user in users) {
    if (users[user].email == email) {
      return users[user].id;
    }
  }
};

////////////////////////////////////////////////////
//////////////Get urlDB for ID//////////////////////
////////////////////////////////////////////////////
let urlsForId = (id) => {
  urlsUser = {};
  for (let url in urlDB) {
    if (urlDB[url].user_id === id)
      urlsUser[url] = urlDB[url];
  }
  return urlsUser;
};


////////////////////////////////////////////////////
//////////////////START APP/////////////////////////
////////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});