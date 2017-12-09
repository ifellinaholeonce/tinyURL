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

////////////////////////////////////////////////////
//////////////LANDING PAGE//////////////////////////
////////////////////////////////////////////////////
app.get("/", (req, res) => {
  const { user_id } = req.session;
  const user = users[user_id];
  let templateVars = {
    user,
    urlDB
  };
  if (isLoggedIn(user_id)) { //if the user is logged in redirect to urls_index
    res.redirect("/urls");
  }
  res.render("landing", templateVars);
});

////////////////////////////////////////////////////
//////////////USER REGISTRATION SESSION/////////////
////////////////////////////////////////////////////

app.get("/register", (req, res) => {
  const { user_id } = req.session;
  let templateVars = {
    user: users[user_id],
    urlDB
  };
  if (isLoggedIn(user_id)) {
    res.redirect('/urls');
  } else {
    res.render("register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || checkEmailExists(email)) {
    res.status(400).send("Invalid Email or Password or Email already registered.");
  } else {
    const id = generateRandomString(8, '#aA');
    users[id] = {
      id: id,
      email: email,
      hashedPassword: hashPassword(password)
    };
    req.session.user_id = id;
    res.redirect(303, '/urls');
  }
});

app.get("/login", (req, res) => {
  const { user_id } = req.session;
  let templateVars = {
    user: users[user_id],
    urlDB
  };
  if (isLoggedIn(user_id)) {
    res.redirect('/urls');
  } else {
    res.render("login", templateVars);
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (checkEmailExists(email)) {
    const user = users[getUserID(email)];
    if (checkPassword(password, user.hashedPassword)) {
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
  const { user_id } = req.session;
  const user = users[user_id];
  let templateVars = {
    user,
    urlDB: urlsForId(user_id)
  };
  if (isLoggedIn(user_id)) {
    res.render("urls_index", templateVars);
  } else {
    res.status(400).redirect("/");
  }
});

app.post("/urls", (req, res) => {
  const { user_id } = req.session;
  if (isLoggedIn(user_id)) {
    let { longURL } = req.body;
    let shortURL = generateRandomString(6, '#aA');
    urlDB[shortURL] = {
     [shortURL]: longURL,
     'user_id': user_id,
     'visits': 0,
     'uniqueVisits': 0,
     'visitors': [],
     'timestampCreated': generateTimestamp()
   };
   res.redirect(303, `/urls/${shortURL}`);
 } else {
  res.status(400).redirect("/");
}
});

app.get("/urls/new", (req, res) => {
  const { user_id } = req.session;
  let templateVars = {
    user: users[user_id]
  };
  if (isLoggedIn(user_id)) {
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
    urlDB: urlDB[shortURL]
  };
  if (isLoggedIn(user_id)) {
    let usersURLs = urlsForId(user_id);
    if (usersURLs[shortURL]) {
      res.render("urls_show", templateVars);
    } else {
      res.status(400).redirect("/");
    }
  } else {
    res.status(400).redirect("/");
  }
});

app.put("/urls/:id", (req, res) => {
  const { id: shortURL } = req.params;
  const { longURL } = req.body;
  urlDB[shortURL][shortURL] = longURL;
  res.redirect(303, `/urls`);
});

app.delete("/urls/:id/delete", (req, res) => {
  const { user_id } = req.session;
  const { id: shortURL } = req.params;
  if (isLoggedIn(user_id)) {
    let usersURLs = urlsForId(user_id);
    if (usersURLs[shortURL]) {
      delete urlDB[shortURL];
      res.redirect(303, "/urls");
    } else {
      res.status(400).redirect("/");
    }
  } else {
    res.status(400).redirect("/");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

app.get("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  console.log(shortURL);
  if (urlDB[shortURL]) {
    console.log("Found shortURL", urlDB[shortURL]);
    urlDB[shortURL].visits++;
    checkUniqueVisit(shortURL, req);
    addVisitorTimestamp(shortURL, req);
    if (urlDB[shortURL][shortURL].startsWith('http://www.') || urlDB[shortURL][shortURL].startsWith('https://www.')) {
      res.redirect(307, urlDB[shortURL][shortURL]);
    } else {
      res.redirect(307, `http://www.${urlDB[shortURL][shortURL]}`);
    }
  } else {
    console.log("Cant find", urlDB[shortURL]);
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
//////////////STRING AND TIME GENERATOR/////////////
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

let leftPad = (num) => {
  if (num < 10) {
    return '0' + num;
  }
  return num;
};

let generateTimestamp = () => {
  let date = new Date();
  let timezone = -5; //To offset UTC to Eastern Time Zone. TODO allow user to set timezone//set timezone by user location.
  return  {
    "YYYY": date.getFullYear(),
    "MM": leftPad(date.getMonth()+1),
    "DD": leftPad(date.getDate()),
    "time": `${leftPad(date.getHours()+timezone)}:${leftPad(date.getMinutes())}`
  };
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
//////////////Check Session/////////////////////////
////////////////////////////////////////////////////
let checkUniqueVisit = (shortURL, req) => {
  if (req.session[shortURL]) {
    return;
  } else {
    urlDB[shortURL].uniqueVisits++;
    req.session[shortURL] = shortURL;
    return;
  }
};

let addVisitorTimestamp = (shortURL, req) => {
  if (req.session.visitor_id) {
    urlDB[shortURL].visitors.push([generateTimestamp(), req.session.visitor_id]);
  } else {
    req.session.visitor_id = `v_${generateRandomString(6, '#a')}`;
    urlDB[shortURL].visitors.push([generateTimestamp(), req.session.visitor_id]);
  }
};


////////////////////////////////////////////////////
//////////////////START APP/////////////////////////
////////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});