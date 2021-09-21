const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const checkoutSchema = mongoose.Schema({
  checkoutID: {
    type: String,
    unique:true
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  packageID:{
      type:String
  },
  packageName:{
    type:String
  }

});

module.exports = mongoose.model("checkout", checkoutSchema);