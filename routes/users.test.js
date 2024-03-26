"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");



describe("User Routes Test", function () {

  let token1;
  let token2;

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    token1 = jwt.sign({ username: u1.username }, SECRET_KEY);

    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155550000",
    });

    token2 = jwt.sign({ username: u2.username }, SECRET_KEY);

    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "Test message"
    });
  });

  describe("GET /", function () {
    test("Can get users if logged in", async function () {
      const response = await request(app)
        .get('/users')
        .query({ _token: token1 });

      expect(response.body).toEqual({
        users: [
          {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1"
          },
          {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2"
          }
        ]
      });
      expect(response.statusCode).toEqual(200);

    });

    test("Can't get users if not logged in", async function () {
      const response = await request(app)
        .get('/users')
        .query({ _token: "NOT_REAL_TOKEN" });

      expect(response.statusCode).toEqual(401);
      expect(response.body).toEqual({
        "error": {
          "message": "Unauthorized",
          "status": 401
        }
      }
      );
    });
  });

  describe("GET /users/:username", function () {
    test("User can get their own information", async function () {
      const response = await request(app)
        .get('/users/test1')
        .query({ _token: token1 });

      expect(response.body).toEqual({
        user: {
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1",
          phone: "+14155550000",
          join_at: expect.any(String),
          last_login_at: null
        }
      });
      expect(response.statusCode).toEqual(200);
    });

    test("User cannot access other users information", async function () {
      const response = await request(app)
        .get("/users/test2")
        .query({ _token: token1 });

      expect(response.statusCode).toEqual(401);
      expect(response.body).toEqual({
        "error": {
          "message": "Unauthorized",
          "status": 401
        }
      }
      );
    });
  });

  describe("GET /users/:username/to", function () {

    test("User can get messages to themselves", async function () {
      const response = await request(app)
        .get("/users/test2/to")
        .query({ _token: token2 });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        {
          messages: [
            {
              id: expect.any(Number),
              body: "Test message",
              sent_at: expect.any(String),
              read_at: null,
              from_user: {
                username: "test1",
                first_name: "Test1",
                last_name: "Testy1",
                phone: "+14155550000"
              }

            }
          ]
        }
      );
    });


    test("User cannot get messages to another user", async function () {
      const response = await request(app)
        .get("/users/test2/to")
        .query({ _token: token1 });
      expect(response.statusCode).toEqual(401);
      expect(response.body).toEqual({
        "error": {
          "message": "Unauthorized",
          "status": 401
        }
      }
      );
    });

  });

  describe("GET /users/:username/from", function () {

    test("User can get messages from themselves", async function () {
      const response = await request(app)
        .get("/users/test1/from")
        .query({ _token: token1 });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        {
          messages: [
            {
              id: expect.any(Number),
              body: "Test message",
              sent_at: expect.any(String),
              read_at: null,
              to_user: {
                username: "test2",
                first_name: "Test2",
                last_name: "Testy2",
                phone: "+14155550000"
              }

            }
          ]
        }
      );
    });

    test("User cannot get messages from another user not to themselves", async function () {
      const response = await request(app)
        .get("/users/test2/from")
        .query({ _token: token1 });
      expect(response.statusCode).toEqual(401);
      expect(response.body).toEqual({
        "error": {
          "message": "Unauthorized",
          "status": 401
        }
      }
      );
    });



  });

});





afterAll(async function () {
  await db.end();
});