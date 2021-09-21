const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const UserSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/, //adding some validations to email
    unique: true, //email must be unique
  },
  password: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  userType: {
    type: String,
    enum: ["applicant", "company","admin"],
    default: "applicant",
  },
  subscribed: {
    type: Boolean,
    default: false,
  },
  subscriptionID: {
    type: String,
    default: "",
  },
  applied: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
      default: [],
    },
  ],
});
UserSchema.methods.generateVerificationToken = function () {
  const user = this;
  const verificationToken = jwt.sign(
    { ID: user._id },
    process.env.USER_VERIFICATION_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return verificationToken;
};
module.exports = mongoose.model("User", UserSchema);
