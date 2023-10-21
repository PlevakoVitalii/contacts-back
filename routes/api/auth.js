const express = require('express');
const CreateError = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const { v4 } = require('uuid');

const { User, schemas } = require('../../models/user')
const { sendMail } = require('../../helpers');
const router = express.Router();

const { SECRET_KEY } = process.env;

// singup або register
router.post("/register", async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body)
    if (error) {
      throw new CreateError(400, error.message)
    }
    const { email, password, subscription = "starter" } = req.body;
    // Звертаємося до бази з перевіркою чи вже є такий емеіл
    // інакше схема монгуса а саме юнік параметр верне помилку
    // але надати їй статус 409 та визначити що саме вже є такий емеіл
    // важче, в кетч іфом аналізуючи меседж з помилки
    // тому звертаємось до БД двічі
    const user = await User.findOne({ email });
    if (user) {
      throw new CreateError(409, "Email in use");
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt)
    // З допомогою пакету gravatar генеруємо юзеру дефолтну аватарку по емейлу
    const avatarURL = gravatar.url(email);
    // генеруємо рандомний код для використання верифікації юзере через пошту
    // методом відправки повідомлення типу:
    // "<a href='http://localhost:3000/api/users/'>Нажміть тут щоб підтвердити свій email</a>"
    const verificationToken = v4();
    await User.create({
      email,
      avatarURL,
      password: hashPassword,
      verificationToken,
      subscription
    });

    // сторюємо лист яки хочемо відправити
    const mail = {
      to: email,
      subject: "Підтвердження email",
      html: `<a target="_blank" href='http://localhost:3000/api/users/${verificationToken}'>Нажміть тут щоб підтвердити свій email</a>`
    }
    // відправляємо лист напошту користувачу для верифікації емейлу
    await sendMail(mail);
    res.status(201).json({
      user: {
        email,
        subscription
      }
    })
  } catch (error) {
    next(error)
  }
})

// login
router.post("/login", async (req, res, next) => {
  try {
    // зазвичай для регістрації та логіна різні схеми валідації так як різний набор полів 
    // що передаються в req
    const { error } = schemas.register.validate(req.body)
    if (error) {
      throw new CreateError(400, error.message)
    }
    // далі перевіряю чи є взагалі такий юзер, який хоче залогінитись
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new CreateError(409, "Email or password is wrong");
    }
    // перевірка, чи юзер підвердив свій email (user.verify === false)
    if (!user.verify) {
      throw new CreateError(401, "Email not verify");

    }
    // далі перевіряю чи правильний пароль
    const compareResult = await bcrypt.compare(password, user.password)
    if (!compareResult) {
      throw new CreateError(409, "Email or password is wrong");
    }
    // створюємо токен
    const payload = {
      id: user._id
    }
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" })
    // додаємо токін в базу зареєстрованому юзеру
    await User.findByIdAndUpdate(user._id, { token })
    const { subscription } = user;
    res.json({
      token,
      user: {
        email,
        subscription
      }
    })
  } catch (error) {
    next(error)
  }

})


module.exports = router;