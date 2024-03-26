"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");
const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


describe("Messages Routes Test", function () {
  let token1;
  let token2;
  let m1;

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

    m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "Test message"
    });

  });

  describe("test GET messages/:id", function () {

    test("User should be able to get specfic message", async function () {
      console.log(`M1ID is: ${m1.id}, m1 is: ${m1}, token1 is: ${token1}`)
      const response = await request(app)
        .get(`/messages/${m1.id}`)
        .query({ _token: token2 });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(
        {
          message: {
            id: expect.any(Number),
            body: "Test message",
            sent_at: expect.any(String),
            read_at: null,
            from_user: {
              username: "test1",
              first_name: "Test1",
              last_name: "Testy1",
              phone: "+14155550000"
            },
            to_user: {
              username: "test2",
              first_name: "Test2",
              last_name: "Testy2",
              phone: "+14155550000"
            }
          }
        }
      );

    });

  });

});