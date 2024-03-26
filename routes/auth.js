"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { SECRET_KEY } = require('../config');
const { BadRequestError, UnauthorizedError } = require("../expressError");

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res) {
  const {username, password} = req.body;

  if (!req.body) {
    throw new BadRequestError("missing login information");
  }

  if (await User.authenticate(username, password) ) {
    const token = jwt.sign({ username: username }, SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json({ token });
  }

  throw new UnauthorizedError("invalid credentials");
});




/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function (req, res) {

  const body = req.body;

  if (!body) {
    throw new BadRequestError("missing registeration information");
  }

  // why did {body} not work? results.rows was returning correct info
  const user = await User.register( body );
  const token = jwt.sign({ username: user.username }, SECRET_KEY);



  return res.json({ token });
});



module.exports = router;