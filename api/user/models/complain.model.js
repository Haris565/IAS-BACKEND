const mongoose = require("mongoose");

const complainSchema = mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  response: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "working", "resolved"],
    default: "pending",
  },
  ping: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("complain", complainSchema);
