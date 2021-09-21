const Job = require('../models/job.model');
const User=require('../../user/models/user.model');

exports.getAllJobs = async (req, res) => {
  const resPerPage = 9; // results per page
  const page = req.params.page || 1; // Page
  if (req.query.search && req.query.type) {
    const search = new RegExp(escapeRegex(req.query.search), "gi");
    try {
      const jobs = await Job.find(
        { $text: { $search: search } },
        {
          title: true,
          skills: true,
          location: true,
          jobType: true,
          description: true,
        }
      )
        .populate("company", "name")
        .skip(resPerPage * page - resPerPage)
        .limit(resPerPage);
    const numOfJobs = await Job.estimatedDocumentCount();

      res.status(200).json({
        Result: jobs,
        currentPage: page,
        pages: Math.ceil(numOfJobs / resPerPage),
        searchVal:req.query.search,
        TotalJobs:numOfJobs
      });
    } catch (err) {
        console.log(err);
      res.status(500).json(err);
    }
  } else {
    try {
      const jobs = await Job.find(
          {},
        {
          title: true,
          skills: true,
          location: true,
          jobType: true,
          description: true,
        }
      )
        .populate("company", "name")
        .skip(resPerPage * page - resPerPage)
        .limit(resPerPage);
      const numOfJobs = await Job.estimatedDocumentCount();

      res.status(200).json({
        Result: jobs,
        currentPage: page,
        pages: Math.ceil(numOfJobs / resPerPage),
        searchVal: req.query.search,
        TotalJobs: numOfJobs,
      });

    } catch (err) {
        console.log(err)
      res.status(500).json(err);
    }
  }
};



function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
