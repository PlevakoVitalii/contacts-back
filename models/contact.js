const { Schema, model } = require("mongoose");
const Joi = require('joi')

const codeRegexp = /^[0-9]{5}$/;

// Це схема для валідації з допомогою Mongoose
const contactSchema = Schema({
  name: {
    type: String,
    required: [true, 'Set name for contact'],
    minLength: 2
  },
  email: {
    type: String,
    required: true,
    minLength: 2
  },
  // phone=["55555", "33333", "77777"] - коли поле може
  // приймати тільки певні значенння
  phone: {
    type: String,
    default: "55555",
    enum: ["55555", "33333", "77777"]
  },
  favorite: {
    type: Boolean,
    default: true
  },
  // Щоб властивість(поле) "code" зробити унікалим додай "unique: true" і
  // обов'язково зробити в БД унікальним індексом це  поле  "code"
  code: {
    type: String,
    required: true,
    match: codeRegexp,
    // unique: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true
  }
}, { versionKey: false, timestamps: true });

// Схема для валідації з допомогою Joi розмыіщена тут же
// щоб при зміні однієї схеми зручно міняти і іншу
const joiAddContactSchema = Joi.object({
  name: Joi
    .string()
    .min(2)
    .required()
    .messages({ 'any.required': `"missing required name field"` }),
  email: Joi
    .string()
    .min(2)
    .required()
    .messages({ 'any.required': `"missing required email field"` }),
  phone: Joi
    .string()
    .pattern(codeRegexp)
    .valueOf("55555", "33333", "77777")
    .required()
    .messages({ 'any.required': `"missing required phone field"` }),
  favorite: Joi
    .boolean()
    .default(true),
  code: Joi
    .string()
    .pattern(codeRegexp)
    .required()

})

const joiUpdateFavoriteSchema = Joi.object({
  favorite: Joi
    .boolean()
    .required()
    .messages({ 'any.required': `"missing field favorite"` }),

})

const Contact = model("contact", contactSchema);

module.exports = {
  Contact,
  schemas: {
    add: joiAddContactSchema,
    updateFavorite: joiUpdateFavoriteSchema
  }
};