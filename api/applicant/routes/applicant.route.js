const express = require("express");
const router = express.Router();

const applicantController=require('../controllers/applicant.controler');
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const block = require("../../middleware/block");

router.post(
  "/applicantProfile",
  auth,
  block,
  role("applicant"),
  applicantController.applicantProfile
);

router.put(
  "/updateProfile",
  auth,
  role("applicant"),
  block,
  applicantController.updateProfile
);

router.put(
  "/applicantPasswordChange",
  auth,
  role("applicant"),
  block,
  applicantController.applicantChangePassword
);

router.put(
  "/applyForJob",
  auth,
  role("applicant"),
  block,
  applicantController.applyForJob
);

router.get(
  "/getApplicantProfile",
  auth,
  role("applicant"),
  block,
  applicantController.getApplicantProfile
);

router.post(
  "/submitComplain",
  auth,
  role("applicant"),
  block,
  applicantController.submitComplain
);

router.get(
  "/complainsCount",
  auth,
  role("applicant"),
  block,
  applicantController.getActiveComplainsCount
);

module.exports = router;