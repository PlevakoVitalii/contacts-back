const express = require('express')
const logger = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
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

const authRouter = require('../routes/api/auth')
const contactsRouter = require('../routes/api/contacts')

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

router.get("/", async (req, res, next) => {
  try {
    return res.json({
      "name": "Vasa"
    })
  } catch (error) {
    next(error);
  }
});

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use('/api/auth', authRouter)
app.use('/api/contacts', contactsRouter)
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
