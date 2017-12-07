const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');


const PORT = process.env.PORT || 8080;

const urlDB = require('./models/urls').urlDB;
const users = require('./models/users').users;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));


app.get("/", (req, res) => {
  const { user_id } = req.session;
  const user = users[user_id];
  let templateVars = {
    user,
    urlDB
  };
  if (isLoggedIn(user_id)) {
    res.redirect("/urls");
  }
  res.render("landing", templateVars);
});

////////////////////////////////////////////////////
//////////////USER REGISTRATION SESSION/////////////
////////////////////////////////////////////////////

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urlDB
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (checkEmailExists(email)) {
    res.status(400).send("Email already registered");
  }
  const id = generateRandomString(8, '#aA');
  users[id] = {
    id: id,
    email: email,
    hashedPassword: hashPassword(password)
  };
  req.session.user_id = id;
  res.redirect(303, '/urls');
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urlDB
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  console.log("LOGGING IN");
  const { email, password } = req.body;
  if (checkEmailExists(email)) {
    console.log("Email Found");
    const user = users[getUserID(email)];
    console.log('###user', user);
    if (checkPassword(password, user.hashedPassword)) {
      console.log('###password is true');
      req.session.user_id = user.id;
      res.redirect(303, `/urls`);
    }
  } else {
    res.status(400).redirect('/register');
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(303, `/urls`);
});

////////////////////////////////////////////////////
//////////////APP ROUTING///////////////////////////
////////////////////////////////////////////////////

app.get("/urls", (req, res) => {
  console.log(users);
  const { user_id } = req.session;
  const user = users[user_id];
  let templateVars = {
    user: users[user_id],
    urlDB: urlsForId(user_id)
  };
  if (user) {
    templateVars.userEmail = user.email;
  } else {
    res.status(400).redirect("/");
  }
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let user_id = "";
  if (users[req.session.user_id]) {
    user_id = req.session.user_id;
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
  const { user_id } = req.session;
  const user = user_id;
  let templateVars = {
    user: users[user_id],
  };
  if (user) {
    templateVars.userEmail = user.email;
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});



app.get("/urls/:id", (req, res) => {
  const { user_id } = req.session;
  const { id: shortURL } = req.params;
  let templateVars = {
    user: users[user_id],
    shortURL,
    urlDB
    };
  if(user_id) {
    for (let url in urlsForId(user_id)) {
      if (url === shortURL) {
        res.render("urls_show", templateVars);
      }
    }
  } else {
    res.status(400).redirect("/");
  }
});

app.put("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  urlDB[shortURL][shortURL] = longURL;
  res.redirect(303, `/urls/${shortURL}`);
});

app.delete("/urls/:id/delete", (req, res) => {
  delete urlDB[req.params.id];
  res.redirect(303, "/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

app.get("/u/:shortURL", (req, res) => {
  // let templateVars = {
  //   user_id: req.session.user_id
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
//////////////BCRYPT////////////////////////////////
////////////////////////////////////////////////////
let hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

let checkPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

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
    if (users[user].email === email) {
      return true;
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

let isLoggedIn = (userSession) => {
  return (users[userSession]);
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