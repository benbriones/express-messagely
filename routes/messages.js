"use strict";

const Router = require("express").Router;
const router = new Router();
const { UnauthorizedError } = require("../expressError");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id",
  ensureLoggedIn,
  async function (req, res) {
  const id = req.params.id;
  const message = await Message.get(id);

  const currUrser = res.locals.user.username;


  if (message.from_user.username !== currUrser &&
    message.to_user.username !== currUrser) {

      console.log("currUser is", currUrser)
      console.log("fromuser,",message.from_user.username)
      console.log("touser,",message.to_user.username)

    throw new UnauthorizedError("unauthorized");

  }

  return res.json({ message: message });

});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/',
  ensureLoggedIn,
  async function (req, res) {
  const { to_username, body } = req.body;

  const message = await Message.create({
    from_username: res.locals.user.username,
    to_username,
    body
  });

  return res
    .status(201)
    .json({ message });

});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read',
  ensureLoggedIn,
  async function (req, res) {
  const id = req.params.id;
  const username = res.locals.user.username;

  const message = await Message.get(id);

  if (message.to_user.username !== username) {
    throw new UnauthorizedError("unauthorized");
  }

  const messageRead = await Message.markRead(id);

  return res.json({ messageRead });
});



module.exports = router;