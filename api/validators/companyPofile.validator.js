const Joi = require("joi");

exports.companyProfile = Joi.object({
  address: Joi.string().required().messages({
    "string.empty": `Address cant be empty`,
    "any.required": `Address is required field`,
  }),
  description: Joi.string().required().messages({
    "string.empty": `Description cant be empty`,
    "any.required": `Description is required field`,
  }),
  logoImage: Joi.binary().required().messages({
    "string.empty": `logo Image cant be empty`,
    "any.required": `logo Image is required field`,
  }),
});
