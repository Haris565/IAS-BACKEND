const mongoose = require("mongoose");

const companySchema = mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },
  address: {
    type: String,
  },
  logoImage: {
    type: Buffer,
  },
  description: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports=mongoose.model('company',companySchema);