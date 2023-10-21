const express = require('express');
const CreateError = require('http-errors');

const { Contact, schemas } = require('../../models/contact');
const { authenticate } = require('../../middlewares');
const ctrl = require('../../controllers/contacts')
const router = express.Router()

router.get('/', authenticate, ctrl.getAll);
router.get('/:contactId', ctrl.getById);

router.post('/', authenticate, async (req, res, next) => {
  try {
    // валідація від Joi частково дублює валідацію від схеми мангуса
    // але вона легча, так як схема мангуса звертається до бази
    const { error } = schemas.add.validate(req.body)
    if (error) {
      throw new CreateError(400, error.message)
    }
    // Т.я. ми добавляємо ще owner(власник), до візьмемо ми його з мідлвари authenticate
    // яка залежно від токена(юзера) яки залогінений на фронті в req кладе дані цього юзера
    const data = { ...req.body, owner: req.user._id }
    const result = await Contact.create(data)
    res.status(201).json(result)
  } catch (error) {
    // якщо помилка валідатора схеми мангуса
    // то статус має бути 400 "bad request"
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    next(error)
  }
})

router.put('/:contactId', async (req, res, next) => {
  try {
    const { error } = schemas.add.validate(req.body)
    if (error) {
      throw new CreateError(400, error.message)
    }
    const { contactId } = req.params
    const result = await Contact.findByIdAndUpdate(contactId, req.body, { new: true })
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
})

router.patch('/:contactId/favorite', async (req, res, next) => {
  try {
    const { error } = schemas.updateFavorite.validate(req.body)
    if (error) {
      throw new CreateError(400, error.message)
    }
    const { contactId } = req.params
    const result = await Contact.findByIdAndUpdate(contactId, req.body, { new: true })
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
})

router.delete('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params
    const result = await Contact.findByIdAndDelete(contactId);
    // findByIdAndDelete=>findOneAndDelete
    // findByIdAndRemove=>findOneAndDelete
    if (!result) {
      throw new CreateError(404, "Not found")
    }
    res.json({ message: "Contact deleted" })
  } catch (error) {
    next(error)
  }
})

module.exports = router
