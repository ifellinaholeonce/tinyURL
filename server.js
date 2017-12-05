const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8080;

let urlDB = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = urlDB;
  res.render("urls_index", {templateVars});
  console.log(templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString(longURL);
  urlDB[shortURL] = longURL;
  res.redirect(303, `/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:id", (req, res) => {
  let templateVars = {shortURL: req.params.id, urlDB };
  if (urlDB[req.params.id]) {
    res.render("urls_show", templateVars);
  } else {
    res.redirect(404, "/urls/new");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (urlDB[shortURL]) {
    res.redirect(307, urlDB[shortURL]);
  } else {
    res.redirect(404, "/urls/new");
    console.log(urlDB[shortURL]);
  }
});

////////////////////////////////////////////////////
//////////////RANDOM NUMBER GEN/////////////////////
////////////////////////////////////////////////////
let generateRandomString = () => {
  let length = 6;
  let chars = '#aA';
  var mask = '';
  if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
  if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (chars.indexOf('#') > -1) mask += '0123456789';
  var result = '';
  for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
  return result;
};

////////////////////////////////////////////////////
//////////////////START APP/////////////////////////
////////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});