const express = require("express");
const router = express.Router();

const JobController = require("../controllers/job.controller");

router.get("/getAllJobs/:page", JobController.getAllJobs);

module.exports = router;