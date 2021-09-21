const Joi = require("joi");

exports.postJob = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": `Title cant be empty`,
    "any.required": `Title is required field`,
  }),
  description: Joi.string().required().required().messages({
    "string.empty": `Description cant be empty`,
    "any.required": `Description is required field`,
  }),
  location: Joi.string().required().required().messages({
    "string.empty": `Location cant be empty`,
    "any.required": `Location is required field`,
  }),
  experience: Joi.string().required().required().messages({
    "string.empty": `Experience cant be empty`,
    "any.required": `Experience is required field`,
  }),
  salary: Joi.string().required().required().messages({
    "string.empty": `Salary cant be empty`,
    "any.required": `Salary is required field`,
  }),
  jobType: Joi.string().required().required().messages({
    "string.empty": `Job Type cant be empty`,
    "any.required": `Job Type is required field`,
  }),

  skills: Joi.array()
    .items(
      Joi.string().required().messages({
        "string.empty": `add atleast enter one skill`,
        "any.required": `skills is required field`,
      })
    )
    .required()
    .messages({
      "string.empty": `add atleast enter one skill`,
      "any.required": `skills is required field`,
    }),
});
