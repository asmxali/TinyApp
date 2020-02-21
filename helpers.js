function emailLookUp(email, database) {
  for (let user in database) {
    if (email === database[user].email) {
      return user;
    }
  }
}
module.exports = { emailLookUp };
