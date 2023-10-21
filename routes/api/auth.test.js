// Тестувати роути достатьньо складно
// Щоб тестувати, треба імітувати повноцінне віпрацюванн роуту з запуском серверу, з конектом до ДБ, зверненням до ДБ

const mongoose = require('mongoose');
const request = require('supertest'); // для імітації AJAX запиту
const { v4 } = require('uuid');
require("dotenv").config();

const app = require("../../app");
const { User } = require("../../models/user");

const { DB_TEST_HOST, PORT } = process.env;

describe("test auth routes", () => {
  let server;
  beforeAll(() => { server = app.listen(PORT) });
  afterAll(() => server.close());

  beforeEach((done) => {
    mongoose.connect(DB_TEST_HOST).then(() => done())
  });

  afterEach((done) => {
    mongoose.connection.db.dropCollection(() => {
      mongoose.connection.close(() => done())
    })
  })

  test("test login route", async () => {
    const verificationToken = v4();
    const newUser = {
      email: "sasha@gmail.com",
      password: "123456",
      verificationToken
    };

    const user = await User.create(newUser);

    /**
     * 1. Перевірити правильність отриманої відповіді на AJAX-запит документації
     * 2. Перевірити що в базу записався потрібни елемент
     */

    const loginUser = {
      email: "sasha@gmail.com",
      password: "123456"
    };

    const response = await request(app).post("/api/auth/login").send(loginUser);
    expect(response.statusCode).toBe(200);
    const { body } = response;
    expect(body.token).toByTruthy();
    const { token } = await User.findById(user._id);
    expect(body.token).toBe(token);


  })
})
