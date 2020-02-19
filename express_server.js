const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080
const randomstring = require("randomstring");

app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
//example cookie-parser usage


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   
  for (var i = 0; i < 3; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
   
  return text;
};

function emailLookUp(email) {
  for(let user in users){
    if(email === users[user].email ) 
    { 
      return user;
    }
  }
  return false;
}

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("registration", templateVars);
});
app.post("/register", (req, res) => {
  let newUser = generateRandomString();
  
  //if user enters empty string return error 400
  if(!req.body.email && !req.body.password){
    res.status(400).send("Invalid Registration Details")
  } else if(emailLookUp(req.body.email)){
    res.status(400).send("User Already Exists!");
  } else { 
    res.cookie("user_id", newUser)
    users[newUser] = {id:newUser, email: req.body.email, password: req.body.password}
    console.log(users);
    res.redirect(`/urls`);
  }
});
 

app.post('/login', function (req, res) {

  let { email, password } = req.body;
  let userFound = emailLookUp(email);

  if(!userFound){
    res.status(403).send("User Does Not Exist")
  } else {
    if(password === users[userFound].password){
      res.cookie("user_id", userFound);
      res.redirect(`/urls`);
    } else{
      res.status(403).send("Incorrect Password")
    }
  }
})
  
app.get('/login', function (req, res) {
  let templateVars = { user: users[req.cookies.user_id]}
  res.render("login", templateVars);
    
  })

  app.get('/logout', function (req, res) {
    // Set cookie to user_id
    res.clearCookie('user_id');
    res.redirect(`/urls`);
  })

app.get("/urls", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies.user_id]}
  res.render("urls_new",templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
 


app.post("/urls", (req, res) => {
  let newShortLink = generateRandomString();
  urlDatabase[newShortLink] = req.body.asma;
  //console.log(urlDatabase);
  res.redirect(`/urls/${newShortLink}`);

});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect(`/urls`);

});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.updatedURL;
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//test