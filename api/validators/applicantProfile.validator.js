const Joi = require("joi");

exports.applicantProfile = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": `Title cant be empty`,
    "any.required": `Title is required field`,
  }),
  mobileNo: Joi.number().required().messages({
    "string.empty": `Mobile no cant be empty`,
    "any.required": `Mobile no is required field`,
  }),
  DOB: Joi.string().required().messages({
    "string.empty": `Date of Birth cant be empty`,
    "any.required": `Date of Birth is required field`,
  }),
  gender: Joi.string().required().messages({
    "string.empty": `Gender cant be empty`,
    "any.required": `Gender is required field`,
  }),
  profileImage: Joi.binary().required().messages({
    "string.empty": `Image cant be empty`,
    "any.required": `Image is required field`,
  }),
  resume: Joi.binary().required().messages({
    "string.empty": `Resume cant be empty`,
    "any.required": `Resume is required field`,
  }),
  address: Joi.string().required().messages({
    "string.empty": `Address cant be empty`,
    "any.required": `Address is required field`,
  }),
  description: Joi.string().required().required().messages({
    "string.empty": `Description cant be empty`,
    "any.required": `Description is required field`,
  }),
  education: Joi.array()
    .items(
      Joi.object({
        degreeName: Joi.string().required(),
        collegeName: Joi.string().required(),
        startingDate: Joi.string().required(),
        endingDate: Joi.string().required(),
        totalGrade: Joi.number().required(),
        obtainedGrade: Joi.number().required(),
      })
    )
    .required()
    .messages({
      "string.empty": `Must enter education`,
      "any.required": `Education is required field`,
    }),
  experience: Joi.array().items(
    Joi.object({
      jobtitle: Joi.string().required(),
      jobType: Joi.string().required(),
      companyName: Joi.string().required(),
      joiningDate: Joi.string().required(),
      leavingDate: Joi.string().required(),
      description: Joi.string().required(),
    })
  ),
  skills: Joi.array().items(Joi.string()).required().messages({
    "string.empty": `add atleast enter one skill`,
    "any.required": `skills is required field`,
  }),
  socialProfiles: Joi.array().items(),
});
