const express = require('express');
const CreateError = require('http-errors');
const path = require('path');
const fs = require('fs/promises');
// const Joi = require('joi');
// const Jimp = require("jimp"); // для редагування фото


const { User, schemas } = require('../../models/user');
const { authenticate, upload } = require("../../middlewares");
const { sendMail } = require('../../helpers');

const router = express.Router();

router.get("/users/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = User.findOne({ verificationToken });
    if (!user) {
      throw CreateError(404, "User not found");
    }
    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" })
    res.json('Verification successful')
  } catch (error) {
    next(error);
  }
});

router.post('/users/verify', async (req, res, next) => {
  try {
    const { error } = schemas.verify.validate(req.body);
    if (error) {
      throw CreateError(400, "missing required field email");
    };
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user.verify) {
      throw new CreateError(400, "Verification has already been passed");
    }
    const mail = {
      to: email,
      subject: "Підтвердження email",
      html: `<a target="_blank" href='http://localhost:3000/api/users/${user.verificationToken}'>Нажміть тут щоб підтвердити свій email</a>`
    }
    sendMail(mail);
  } catch (error) {
    next(error)
  }
})

router.get("/current", authenticate, async (req, res, next) => {
  res.json({
    email: req.user.email,
    subscription: req.user.subscription
  })
});

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" })
  res.status(204).send()
}
);

router.patch('/:userId/subscription', async (req, res, next) => {
  try {
    console.log(req.body)
    const { error } = schemas.updateSubscription.validate(req.body)
    console.log(error)
    if (error) {
      throw new CreateError(400, error.message)
    }
    const { userId } = req.params
    const result = await User.findByIdAndUpdate(userId, req.body, { new: true })
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

/* Upload midlware
- Коли очікуємо один файл з одного поля:
upload.single("назва очікуваного файла")
- Коли очікуємо декілька файлів з одного поля (<input type="file" multiple/>):
upload.array.("назва масиву", 12-максимальна кількість файлів)
- Коли очікуємо декілька файлів з декількох полів використоуємо upload.fields який отримує масив об'єктів:
upload.fields([
  {
    name:"photo",
    maxCount:1
  },
  {
    name:"cards",
    maxCount:12
  }
])
*/
// шлях до папки з картинками для аватарки. 
// З поточої дерикторії (__dirname) піднімаємося на два рівня вверх і шукаємо необхідну папку
// де на постійній основі будемо зберігати аватарки
const avatarsDir = path.join(__dirname, "../../", "public", "avatars")

router.patch("/avatars", authenticate, upload.single("avatar"), async (req, res, next) => {
  // завдяки мідлварі authenticate в req міститься об'єкт user з якого дістанемо айдішник юзера {_id}
  const { _id } = req.user;
  // завдяки мідлварі authenticate в req міститься об'єкт file
  // З обьекту req.file дістаємо ім'я файла та шлях до папки тимчасового зберігання
  const { path: tempUpload, filename } = req.file;
  try {
    // Перед збереженням отриманого файла в папку avatars та 
    // ім'я файла треба перетворити на унікальне з допомогою айдішніка цього юзера
    // image.jpg => 121124212321321rdsfs.jpg
    // Спочатку дістанемо розширення файла (.jpg)
    // з допомогою split(".") розбиваємо все ім'я на масив строк і розділювач точка(.) image.my.jpg => ["image", "my", "jpg" ]
    //   з допомогою revers() ровертаємо масив і забираємо нульовий елемент - розширення
    const [extension] = filename.split(".").reverse();
    const newFileName = `${_id}.${extension}`
    // сворюємо шлях до папки де на постійній основі будемо зберігати аватарки + ім'я файла (fileName)
    const resultUpload = path.join(avatarsDir, newFileName)
    // методом fs.rename переміщуємо файл з папки temp в папку avatars
    await fs.rename(tempUpload, resultUpload);
    // Для збереженням посилання на цей файл юзеру в базу данних
    // отрумаємо стрічку формату "/avatars/121124212321321rdsfs.jpg"
    const avatarURL = path.join("avatars", newFileName)
    await User.findByIdAndUpdate(_id, { avatarURL })
    res.json({ avatarURL })
  } catch (error) {
    next(error)
  }
});

module.exports = router;