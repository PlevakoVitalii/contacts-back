const CreateError = require('http-errors');
const jwt = require('jsonwebtoken');

const { User } = require('../models/user.js')

/*
Перевірка токена на валідність:
1. Дістаи із заголовку Authorization вміст.
2. Розділити отриману стрічку на 2 слова.
3. Якщо перше слово не дорівнює "Baearer" - повернути відповідь з 401.
4. Якщо перше слово дорівнює "Baearer", перевірити друге слово (токен)
на валідність з допомогою методу jwt.verify та SECURE_KEY.
5. Якщо токен не пройшов перевірку на валідність, повернути 401 відповідь.

Визначити користувача, котрому належить токен:
1. Шукаємо в базі користувача з id, котрий був закодований в токен.
2. Якщо користувача з таким id нема в базі, повернути 401 відповідь,
3. Якщо є - прикріплюємо до об'єкта req (request - запит) користувача та передаємо обробку далі:
req.user = user;
*/

const { SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
  try {
    const { authorization = "" } = req.headers;
    // Дістали authorization з заголовку запиту та розділяємо на дві частини
    const [bearer, token] = authorization.split(" ");
    if (bearer !== "Bearer") {
      throw new CreateError(401, "Not authorized")
    }
    const { id } = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(id);
    // Якщо юзера в базі не знайдено, або в нього токен пуста стрічка
    // тобто він не залогінений, повертаємо помилку
    if (!user || !user.token) {
      throw new CreateError(401, "Not authorized")
    }
    req.user = user;
    next();
  } catch (error) {
    if (!error.status) {
      error.status = 401;
      error.message = "Not authorized";
    }
    next(error)
  }
};

module.exports = authenticate;