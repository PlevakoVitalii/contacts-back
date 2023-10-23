const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const CreateError = require('http-errors');
const { Contact } = require('../models/contact');
const serverless = require("serverless-http"); // для deploy to netlify
require('dotenv').config()

const app = express()

const router = express.Router();

const { DB_HOST, PORT = 3000 } = process.env

mongoose.connect(DB_HOST)
  .then(() => {
    app.listen(PORT)
    console.log("Database connection successful")
  })
  .catch((error) => {
    console.log(error.message)
    process.exit(1)
  })



router.get("/", async (req, res, next) => {
  try {

    const result = await Contact.findById('651996a33db764dbc1c8773b')
    if (!result) {
      throw new CreateError(404, "Not found")
    }
    res.json(result)
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error)
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use('/', router)

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err
  res.status(status).json({ message })
})

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  const result = await handler(event, context);
  return result;
};
