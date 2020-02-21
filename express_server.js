// stores the session data on the client within a cookie
const cookieSession = require("cookie-session");
//library to help hash passwords
const bcrypt = require("bcrypt");
//imports emaiilLookUp Function
const { emailLookUp } = require("./helpers");
// provides tooling for HTTP servers
const express = require("express");
const app = express();
app.set("view engine", "ejs");
// Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
// exposes the resulting object (containing the keys and values) on req.body
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"]
  })
);
// default port 8080
const PORT = 8080;
// url database of ALL urls
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  i3Bosr: { longURL: "https://www.google.ca", userID: "userRandomID" }
};
// user database of ALL users
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("123", 10)
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};
//filtered URL database that contains urls for each user
const urlsForUser = function(id) {
  let filteredDatabase = {};
  for (let element in urlDatabase) {
    if (id === urlDatabase[element].userID) {
      filteredDatabase[element] = urlDatabase[element];
    }
  }
  return filteredDatabase;
};
// genereates random strings to for user ID's
const generateRandomString = function(n) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < n; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

//              DEFAULT PAGE               //
// if user is logged in they are redirected to /urls
// if user is not logged in they are redirected to /login
app.get("/", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//                   URLS                  //
//if user is logged in we return  the urls_index HTML page
//if user is not logged in returns HTML with a relevant error message
app.get("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    let userUrls = urlsForUser(users[req.session.user_id].id);
    let templateVars = { user: users[req.session.user_id], urls: userUrls };
    res.render("urls_index", templateVars);
  } else {
    res
      .status(401)
      .send("You cannot access this page as you are not logged in");
  }
});
// if user is logged in returns urls_new HTML page that has a submit button which makes a POST request to /urls
// if user is not logged in they are redirected to the /login page
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  if (users[req.session.user_id]) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});
// if user is logged in and owns the URL for the given ID then the urls_ show HTML page is returned
// this html page includes an update button which makes a POST request to /urls/:id
// if a URL for the given ID does not exist returns HTML with a relevant error message
// if user is not logged in returns HTML with a relevant error message
// if user is logged it but does not own the URL with the given ID: returns HTML with a relevant error message
app.get("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id]) {
    let userUrl = urlsForUser(req.session.user_id);
    for (let key in userUrl) {
      if (req.params.shortURL === key) {
        let templateVars = {
          user: users[req.session.user_id],
          shortURL: req.params.shortURL,
          longURL: urlDatabase[req.params.shortURL].longURL
        };
        res.render("urls_show", templateVars);
        return;
      }
    }
    if (urlDatabase[req.params.shortURL]) {
      res.status(403).send("You cannot acesss a URL that is not yours");
      return;
    }
    res
      .status(401)
      .send("The URL that you are trying to access does not exist");
    return;
  } else {
    res
      .status(401)
      .send("You cannot access this page as you are not logged in");
    return;
  }
});
// if URL for the given ID exists redirects to the corresponding long URL
// if URL for the given ID does not exist: returns HTML with a relevant error message
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res
      .status(401)
      .send("The URL that you are trying to access does not exist");
  }
});
// if user is logged in: generates a short URL and saves it to the database
// the user is then redirected to /urls/:id where :id matches the ID of the newly saved URL
// if user is not logged in we return an HTML with a relevant error message
app.post("/urls", (req, res) => {
  if (users[req.session.user_id]) {
    let newShortLink = generateRandomString(6);
    (urlDatabase[newShortLink] = {
      longURL: req.body.asma,
      userID: req.session.user_id
    }),
    res.redirect(`/urls/${newShortLink}`);
  } else {
    res
      .status(401)
      .send("You cannot access this page as you are not logged in");
    return;
  }
});
// if user is logged in and owns the URL for the given ID  then the URL is updated the URL and redirects to /urls
// if user is not logged in: returns HTML with a relevant error message
// if user is logged in but does not own the URL for the given ID: returns HTML with a relevant error message
app.post("/urls/:id", (req, res) => {
  if (users[req.session.user_id]) {
    let userUrl = urlsForUser(req.session.user_id);
    for (let key in userUrl) {
      if (!req.params.shortURL === key) {
        res.status(401).send("You cannot update a URL that is not yours");
        return;
      }
    }
    urlDatabase[req.params.id].longURL = req.body.updatedURL;
    res.redirect(`/urls`);
  } else {
    res
      .status(401)
      .send("You cannot access this page as you are not logged in");
    return;
  }
});
// if user is logged in and owns the URL for the given ID: deletes the URL and redirects to /urls
// if user is not logged in: returns HTML with a relevant error message
// if user is logged in but does not own the URL for the given ID: returns HTML with a relevant error message
app.post("/urls/:id/delete", (req, res) => {
  if (users[req.session.user_id]) {
    let userUrl = urlsForUser(req.session.user_id);
    for (let key in userUrl) {
      if (!req.params.shortURL === key) {
        res.status(401).send("You cannot delete a URL that is not yours");
        return;
      }
    }
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  } else {
    res
      .status(401)
      .send("You cannot access this page as you are not logged in");
    return;
  }
});

//                   LOGIN                   //
// if user is logged in: redirects to /urls
// if user is not logged in: returns HTML with: a form which contains: input fields for email and password
// INCLUDE  a submit button that makes a POST request to /login
app.get("/login", function(req, res) {
  if (users[req.session.user_id]) {
    res.redirect(`/urls`);
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});
// if email and password params match an existing user: sets a cookie and redirects to /urls
// if email and password params don't match an existing user: returns HTML with a relevant error message
app.post("/login", function(req, res) {
  let { email, password } = req.body;
  let userFound = emailLookUp(email, users);
  if (!userFound) {
    res.status(403).send("User Does Not Exist");
  } else {
    if (bcrypt.compareSync(password, users[userFound].password, 10)) {
      req.session.user_id = userFound;
      res.redirect(`/urls`);
    } else {
      res.status(403).send("Incorrect Password");
    }
  }
});

//               REGISTER               //
// if user is logged in it redirects to /urls
// if user is not logged in: returns registration HTML page
// the html page includes a register button that makes a POST request to /register
app.get("/register", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect(`/urls`);
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.render("registration", templateVars);
  }
});
// if email or password are empty: returns HTML with a relevant error message
// if email already exists: returns HTML with a relevant error message
// otherwise it will create a new user, encrypts the new user's password with bcrypt, sets a cookie and redirects to /urls
app.post("/register", (req, res) => {
  //if user enters empty string return error 400
  if (!req.body.email && !req.body.password) {
    res.status(400).send("Invalid Registration Details");
  } else if (emailLookUp(req.body.email, users)) {
    res.status(400).send("User Already Exists!");
  } else {
    let newUser = generateRandomString(6);
    req.session.user_id = newUser;
    users[newUser] = {
      id: newUser,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    res.redirect(`/urls`);
  }
});

//               LOGOUT              //
//deletes cookie and redirects to /login
app.get("/logout", function(req, res) {
  // Set cookie to user_id
  req.session = null;
  res.redirect(`/login`);
});

app.listen(PORT, () => {});
