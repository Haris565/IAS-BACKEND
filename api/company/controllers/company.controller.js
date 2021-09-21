
const company = require("../models/companyProfile.model");
const User = require("../../user/models/user.model");
const Checkout=require('../models/checkout.model');
const Subscription=require('../models/subscription.model');
const Applicant =require('../../applicant/models/applicantProfile.model');
const Job=require('../../job/models/job.model');
const nodemailer = require("nodemailer");
const passwordValidator = require("../../validators/password.validator");
const profileValidator=require('../../validators/companyPofile.validator');
const jobValidator = require("../../validators/job.validator");
const Complain = require("../../user/models/complain.model");
const Bcrypt = require("bcryptjs");
const stripe = require("stripe");
const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_USERNAME,
});

//setup Company profile
exports.companyProfile = async (req, res) => {
  const { address, logoImage, description } = req.body;
  try{
    const validator=profileValidator.companyProfile;
    const value=await validator.validateAsync({
      address:address,
      description:description,
      logoImage:logoImage
    });

    const Company = await new company({
      userID: req.USER._id,
      address: value.address,
      logoImage: value.logoImage,
      description: value.description,
    });
    try {
      let CompanyData = await Company.save();
      res.status(200).json(CompanyData);
    } catch (err) {
      res.status(500).json(err);
    }
  }
  catch(err){
    res.status(401).send(err.details[0].message);
  }
};

exports.updateCompanyProfile=async(req,res)=>{
  const { address, description, logoImage } = req.body;
  const oldData = await company.find({ userID: req.USER._id });
  try {
    const updateProfile = await company.updateOne(
      { userID: req.USER._id },
      {
        $set: {
          address: address ? address : oldData[0].address,
          description: description ? description : oldData[0].description,
          logoImage: logoImage ? logoImage : oldData[0].logoImage,
          updatedAt: Date.now(),
        },
      }
    );
    res.status(200).send("profile Updated");
  } catch (err) {
    res.status(500).send(err);
  }
}

//change password
exports.companyChangePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    //checking old password of user
    passwordCheck = await Bcrypt.compare(oldPassword, req.USER.password);

    if (passwordCheck) {
      try {
        const validator = passwordValidator.passwordSchema;
        const value = await validator.validateAsync({
          password: newPassword,
        });
        encryptedPassword = await Bcrypt.hash(value.newPassword, 10);
        try {
          // Step 3 - Email the user a unique verification link
          const updateUser = await User.updateOne(
            { _id: req.USER._id },
            {
              $set: {
                password: encryptedPassword,
              },
            }
          );
          let htmlTemp = `Your password has changed. <br>Regards: IAS Team`;
          transporter.sendMail({
            to: req.USER.email,
            subject: "Password Change",
            html: htmlTemp,
          });
          res.status(201).json({
            message: "Your password has changed",
          });
        } catch (err) {
          res.status(500).send(err);
        }
      } catch (err) {
        res.status(401).send(err.details[0].message);
      }
    } else {
      res.status(401).json({
        msg: "Not matched with old password",
      });
    }
};

//customer Portal to manage subscriptions
exports.customerPortal = async (req,res)=>{54
  const { returnURL } = req.body;
  const subscriptions = await Subscription.find({
    subscriptionID: req.USER.subscriptionID,
  });
  if(subscriptions.length>0){
      const customer = subscriptions[0].customerID;
      try{
        const session = await Stripe.billingPortal.sessions.create({
          customer: customer,
          return_url: returnURL,
        });
        res.json(session);
      }
      catch(err){
        res.status(500).send(err)
      }
  }
  else{
    res.status(403).send('not subscribed')
  } 
}

//checkout for subscription
exports.paymentCheckout=async (req,res)=>{
  const { priceId } = req.body;
  const checkUser = await Subscription.find({ userID: req.USER._id });
  let date = new Date().getTime();
  date = Math.floor(date / 1000);
  if (checkUser.length == 0 || date > checkUser[0].periodEnd) {
    try {
      const session = await Stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: req.USER.email,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            // For metered billing, do not pass quantity
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 14,
        },
        // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
        // the actual Session ID is returned in the query parameter when your customer
        // is redirected to the success page.
        success_url:
          "http://localhost:4000/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:4000/failed",
      });

      const checkout = await new Checkout({
        checkoutID: session.id,
        userID: req.USER._id,
        packageID: priceId,
        packageName: process.env.PACKAGE_NAME,
      }).save();

      res.status(200).json({ session: session, checkout: checkout });
    } catch (err) {
      res.status(500).json(err);
    }
  } else if (date <= checkUser[0].periodEnd) {
    res.json({
      msg: "your previous subscription is valid .. wait for that to end",
    });
  } 
}

//post a job
exports.postJob=async (req,res)=>{
  const USER = req.USER;
  if (USER.subscribed && USER.subscriptionID != "") {
    const getSubscription = await Subscription.find({
      subscriptionID: USER.subscriptionID,
    });
    let date = new Date().getTime();
    date = Math.floor(date / 1000);
    if (getSubscription[0].periodEnd >= date) {
      const data = req.body;
      try {
        const validator = jobValidator.postJob;
        const value = await validator.validateAsync(data);
        try {
          const postAJob = await new Job({
            title:value.title,
            company: USER._id,
            description:value.description,
            location:value.location,
            experience:value.experience,
            skills:value.skills,
            salary:value.salary,
            jobType:value.jobType
          }).save();

          res.status(200).json('job posted');
        } catch (err) {
          console.log(err)
          res.status(500).send(err);
        }
      } catch (err) {
        res.status(401).send(err.details[0].message);
      }
    } else {
      res.status(403).json({ msg: "you have no active subscription" });
    }
  } else {
    res.status(403).json({ msg: "you are not subscribed" });
  }
}

//get all jobs 
exports.getAllJobs=async (req,res)=>{
  try {
    const allJobs = await Job.find({ company: req.USER._id });
    if (allJobs.length > 0) {
      res.json(allJobs);
    } else {
      res.json({ msg: "You posted 0 jobs" });
    }
  } catch (err) {
    res.status(500).json(err.msg);
  }
}

//get Particular job detail
exports.getParticularJobDetail=async(req,res)=>{
  const jobID = req.params.jobID;
  try {
    const jobData = await Job.find(
      { _id: jobID },
      {
        title: true,
        skills: true,
        location: true,
        jobType: true,
        company: true,
        description: true,
      }
    );
    if (jobData[0].company.toString() == req.USER._id.toString()) {
      res.status(200).json(jobData);
    } else {
      res.status(403).json({
        msg: "no such job find",
      });
    }
  } catch (err) {
    res.status(500).json(err);
  }
}

//get All Applied User list for a particular job
exports.getParticularJobUsers = async (req, res) => {
  const jobID = req.params.jobID;
  try {
    const jobData = await Job.find(
      { _id: jobID },
      {
        applied: true,
      }
    ).populate("applied", "name");
    res.status(200).json(jobData);
  } catch (err) {
    res.status(500).json(err);
  }
};

//get particular applied user detail
exports.getparticularUserDetail=async(req,res)=>{
  const userID = req.params.userID;
  try {
    const userData = await Applicant.find(
      { userID: userID },
      { createdAt: false, updatedAt: false }
    ).populate("userID", "name");
    res.status(200).json(userData);
  } catch (err) {
    res.status(500).json(err.msg);
  }
}

//accept an applicant for a particular job
exports.acceptAnApplicant=async(req,res)=>{
  const { jobID, userID } = req.body;
  if (jobID && userID) {
    try {
      const jobData = await Job.find({ _id: jobID });
      const userData = await User.find({ _id: userID });
      if (jobData[0].active) {
        if (
          jobData[0].applied.includes(userID) &&
          userData[0].applied.includes(jobID)
        ) {
          if (
            !jobData[0].selected.includes(userID) ||
            !jobData[0].rejected.includes(userID)
          ) {
            const select = await Job.updateOne(
              { _id: jobID },
              {
                $push: {
                  selected: userID,
                },
              }
            );

            const removeFromApplied = await Job.updateOne(
              { _id: jobID },
              {
                $pull: {
                  applied: userID,
                },
              }
            );
            //
            //
            let htmlTemp = `<p>Dear <strong>${userData[0].name} ,</strong></p>
            <p>We are pleased to tell you that you have been shortlisted for interview process
            in <strong>${req.USER.name}</strong> for the <strong>${jobData[0].title}</strong> position.<br>
            Go to your Dashboard to start the interview Process.<br><strong>Best of luck.</strong></P>
            <strong>Regards:</strong><br>
            <p>IAS.Offical.Team</p>`;
            transporter.sendMail({
              to: userData[0].email,
              subject: "Job Selection Update",
              html: htmlTemp,
            });

            res.status(200).json({
              msg: `Email sent to ${userData[0].email}`,
              select: select,
              remove: removeFromApplied,
            });
          } else {
            res.status(403).json({ msg: "Already Marked" });
          }
        } else {
          res.status(403).json({ msg: "User not Applied" });
        }
      } else {
        res.status(401).json({ msg: "Job is archived" });
      }
    } catch (err) {
      res.status(500).send(err.msg);
    }
  } else {
    res.status(403).json({ msg: "fill all the fields" });
  }
}

//reject an applicant for a particular job
exports.rejectAnApplicant = async (req, res) => {
  const { jobID, userID } = req.body;
  if (jobID && userID) {
    try {
      const jobData = await Job.find({ _id: jobID });
      const userData = await User.find({ _id: userID });
      if (jobData[0].active) {
        if (
          jobData[0].applied.includes(userID) &&
          userData[0].applied.includes(jobID)
        ) {
          if (
            !jobData[0].selected.includes(userID) ||
            !jobData[0].rejected.includes(userID)
          ) {
            const reject = await Job.updateOne(
              { _id: jobID },
              {
                $push: {
                  rejected: userID,
                },
              }
            );
            const removeFromApplied = await Job.updateOne(
              { _id: jobID },
              {
                $pull: {
                  applied: userID,
                },
              }
            );

            res
              .status(200)
              .json({ reject: reject, remove: removeFromApplied });
          } else {
            res.status(403).json({ msg: "Already Marked" });
          }
        } else {
          res.status(403).json({ msg: "User not Applied" });
        }
      } else {
        res.status(401).json({ msg: "job archived" });
      }
    } catch (err) {
      res.status(500).json(err.msg);
    }
  } else {
    res.status(403).json({ msg: "fill all the fields" });
  }
};

//archive a job
exports.archiveJob=async(req,res)=>{
  const jobID = req.params.jobID;
  const ID = req.USER._id;
  const jobData = await Job.find({ _id: jobID });
  if (jobData[0].company.toString() === ID.toString()) {
    const Updatejob = await Job.updateOne(
      { _id: jobID },
      {
        $set: {
          active: false,
        },
      }
    );
    res.status(200).json({ msg: "job archived" });
  }
}

//submit complain
exports.submitComplain=async(req,res)=>{
  try {
    const complainsCount = await Complain.find({ userID: req.USER._id });
    var count = 0;
    if(complainsCount.length > 0){
      complainsCount.map((dat) => {
        if (dat.status === "pending" || dat.status === "working") {
          count = count + 1;
        }
      });
    }
    if(count < 4){
      const { title, description } = req.body;
      if (title && description) {
        const complain = await new Complain({
          title: title,
          description: description,
          userID: req.USER._id,
        });
        try {
          let complainData = await complain.save();
          res.status(200).send('complain send');
        } catch (err) {
          res.status(500).send("something went wrong.");
        }
      } else {
        res.status(204).send("Fill all fields");
      }
    }
    else{
      res
        .status(403)
        .send(`Cant Complain when you already have ${count} active complains`);
    }
  } catch (err) {
    res.status(500).send(err);
  }
}

//complains count
exports.getActiveComplainsCount = async (req, res) => {
  try {
    const complainsData = await Complain.find({ userID: req.USER._id });
    res.status(200).json({ count: complainsData.length });
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
};