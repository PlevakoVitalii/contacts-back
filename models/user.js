const { model, Schema } = require('mongoose');
const Joi = require('joi');

const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const userSchema = Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: emailRegexp
  },
  password: {
    type: String,
    minLength: 6,
    required: true
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter"
  },
  token: {
    type: String,
    default: ""
  },
  avatarURL: {
    type: String
  },
  verify: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: [true, 'Verify token is required'],
  }
}, { versionKey: false, timestamps: true })

const joiRegisterSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
  subscription: Joi.string().valid("starter", "pro", "business").default("starter")
})

const joiVerifyEmailSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  password: Joi.string().min(6).required(),
})

const joiUpdateSubscriptionSchema = Joi.object({
  subscription: Joi
    .string()
    .valid("starter", "pro", "business")
    .required()
    .messages({ 'any.required': `"missing field subscription"` }),
})

const User = model("user", userSchema);

const schemas = {
  register: joiRegisterSchema,
  verify: joiVerifyEmailSchema,
  updateSubscription: joiUpdateSubscriptionSchema
}

module.exports = {
  User,
  schemas
}