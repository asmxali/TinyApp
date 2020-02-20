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
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  i3Bosr: { longURL: "https://www.google.ca", userID: "userRandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

const urlsForUser = function(id) {
  let filteredDatabase = {};
  for(let element in urlDatabase){
    if (id === urlDatabase[element].userID)  {
      filteredDatabase[element] = urlDatabase[element]; //dont understrand
      }
  }
  return filteredDatabase;
};
  

function generateRandomString(n) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   
  for (var i = 0; i < n; i++)
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
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("registration", templateVars);
});
app.post("/register", (req, res) => {
  
  //if user enters empty string return error 400
  if(!req.body.email && !req.body.password){
    res.status(400).send("Invalid Registration Details")
  } else if(emailLookUp(req.body.email)){
    res.status(400).send("User Already Exists!");
  } else { 
    let newUser = generateRandomString(6);
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

//what i had
app.get("/urls", (req, res) => {
  if(users[req.cookies.user_id]) {
    let userUrls = urlsForUser(users[req.cookies.user_id].id);
    let templateVars = { user: users[req.cookies.user_id], urls: userUrls }; 
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});


//edit this so that if the user is not logged in they get redirected to the login page
app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies.user_id]}
  if(users[req.cookies.user_id]){
    res.render("urls_new",templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let userUrl = urlsForUser(req.cookies.user_id);
  console.log(userUrl);
  for (let key in userUrl) {
  if (req.params.shortURL === key) {
    let templateVars = { user: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    console.log(templateVars);
    res.render("urls_show", templateVars);
  } 
  }
  res.status(403).send("You cannot acesss a URL that is not yours");
});

app.post("/urls/:id", (req, res) => {
  if(users[req.cookies.user_id]){
    urlDatabase[req.params.id].longURL = req.body.updatedURL;
    res.redirect(`/urls`);
  } else {
    res.status(401).send("You cannot update a URL that is not yours\n");
  }
});

// app.post("/urls/:shortURL", (req, res) => {
//   let userUrl = urlsForUser(req.cookies.user_id);
//   for (let key in userUrl) {
//     if (req.params.shortURL === key) {
//       let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies.user_id] };
//       res.render("urls_show", templateVars);
//       return;
//     }
//     }
//   res.status(403).send("You cannot acesss a URL that is not yours");
//   return;
// });

app.get("/u/:shortURL", (req, res) => {

  longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});
 


app.post("/urls", (req, res) => {
  let newShortLink = generateRandomString(6);
  urlDatabase[newShortLink] = { longURL: req.body.asma , userID: req.cookies.user_id },
  //console.log(urlDatabase);
  res.redirect(`/urls/${newShortLink}`);

});

app.post("/urls/:id/delete", (req, res) => {
  if(users[req.cookies.user_id]){
    delete urlDatabase[req.params.id];
    console.log(urlDatabase);
    res.redirect(`/urls`);
  } else {
    res.status(401).send("You cannot delete a URL that is not yours\n");
  }

});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//test