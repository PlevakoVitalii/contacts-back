// Подібні ф-ії корі можуть бути використані в декількох місцях роекту
// розміщуються в діректорії helpers або utils

// Реєстрація в sendgrid для масової роззсилки повідомлень(підверджень замовлень і т.д.)
// веріфікація емейлу або доменного імені
// в sendgrid створення ключа API_KEY, котрий зберігається в файл .env
// Установка пакету npm install @sendgrid/mail

const sgMail = require('@sendgrid/mail');
require("dotenv").config();

const { SENDGRID_API_KEY } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendMail = async (data) => {
  try {
    const mail = { ...data, from: "plevakovl2102@gmail.com" }
    await sgMail.send(mail)
    return true;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

module.exports = sendMail;