const mongoose = require("mongoose");

const applicantSchema = mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },
  title: {
    type: String,
  },
  mobileNo: {
    type: Number,
  },
  DOB: {
    type: String,
  },
  gender: {
    type: String,
  },
  profileImage: {
    type: Buffer,
  },
  resume: {
    type: Buffer,
  },
  address: {
    type: String,
  },
  description: {
    type: String,
  },
    education:
    {
      type:Array,
      default:[]
    },
  // education: [
  //   {
  //     degreeName: String,
  //     collegeName: String,
  //     startingDate: String,
  //     endingDate: String,
  //     totalGrade: Number,
  //     obtainedGrade: Number,
  //   },
  // ],
  experience: 
    {
      type:Array,
      default:[]
    },
  // experience: [
  //   {
  //     jobtitle: String,
  //     jobType: String,
  //     companyName: String,
  //     joiningDate: String,
  //     leavingDate: String,
  //     description: String,
  //   },
  // ],
  skills: {
    type: Array,
    default: [],
  },
  socialProfiles:{
    type:Array,
    default:[]
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

module.exports = mongoose.model("applicant", applicantSchema);
