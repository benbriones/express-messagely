"use strict";

const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require("../config");
const { NotFoundError } = require("../expressError");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING username,
                password,
                first_name,
                last_name,
                phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return results.rows[0];

  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]
    )

    const user = results.rows[0];

    return user && await bcrypt.compare(password, user.password) === true
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const results = await db.query(
      `UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE username = $1
      RETURNING username, last_login_at`,
      [username]
    );
            //TODO: Check for potential 404
    return results.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username,
              first_name,
              last_name
      FROM users
      ORDER BY username`
    );

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );

    if (!results.rows[0]) {
      throw new NotFoundError(`Cannot find user: ${username}`);
    }
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id,
              m.to_username,
              u.first_name,
              u.last_name,
              u.phone,
              m.body,
              m.sent_at,
              m.read_at
      FROM messages m
      JOIN users u ON(u.username = m.to_username)
      WHERE m.from_username = $1`,
      [username]
    );

    if (results.rows.length === 0) {
      throw new NotFoundError(`Cannot find user: ${username}`);
    }

    const messageData = results.rows.map(m => {
      return {
        id: m.id,
        to_user: {
          username: m.to_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }
    });

    return messageData;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id,
              m.from_username,
              u.first_name,
              u.last_name,
              u.phone,
              m.body,
              m.sent_at,
              m.read_at
      FROM messages m
      JOIN users u ON(u.username = m.from_username)
      WHERE m.to_username = $1`,
      [username]
    );

    if (results.rows.length === 0) {
      throw new NotFoundError(`Cannot find user: ${username}`);
    }

    const messageData = results.rows.map(m => {
      return {
        id: m.id,
        from_user: {
          username: m.from_username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }
    });

    return messageData;
  }
}


module.exports = User;
