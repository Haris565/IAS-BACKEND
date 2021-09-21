const user=require('../../user/models/user.model');
const nodemailer = require("nodemailer");
const subscription=require('../../company/models/subscription.model');
const checkout=require('../../company/models/checkout.model');
const Complain = require("../../user/models/complain.model");
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

//get all applicants
exports.getAllApplicants=async (req,res)=>{
    try {
        const users = await user.find(
        { userType: "applicant" },
        {
            name: true,
            email: true,
            userType: true,
            verified: true,
            blocked: true,
        }
        );
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
}

//get all companies
exports.getAllCompanies = async (req, res) => {
    try {
        const users = await user.find(
        { userType: "company" },
        {
            name: true,
            email: true,
            subscribed: true,
            userType: true,
            verified: true,
            blocked: true,
        }
        );
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
};

//get subscriptions record
exports.getSubscriptionsRecord=async(req,res)=>{
    try{
        const subsData = await subscription.find().populate("userID", "name email");
        res.status(200).json(subsData)
    }
    catch(err){
        res.status(500).send('something went wrong')
    }
}

//get checkout records
exports.getCheckoutsRecord=async(req,res)=>{
    try{
        const checkoutData = await checkout
          .find()
          .populate("userID", "name email");
        res.status(200).json(checkoutData);
    }
    catch(err){
        res.status(500).send("something went wrong");
    }
}

//get total cost
exports.getTransactionsList=async(req,res)=>{
    try{
        const transaction = await Stripe.balance.retrieve();
        res.status(200).json({
          totalAmount: `$${transaction.available[0].amount} `,
        });
    }
    catch(err){  
        res.status(500).send("something went wrong");       
    }
}

//block a user
exports.blockUser=async(req,res)=>{
    const userID = req.params.userID;
    try{
        const User=await user.find({_id:userID});
        if(User.length>0){
          const blockUser=await user.updateOne({_id:userID},{
              $set:{
                  blocked:true
              }
          });
          if(blockUser.nModified === 0){
              res.status(200).send('Aleady Blocked')
          }
          else{
            let htmlTemp = `<p>Dear <strong>${User[0].name} ,</strong></p>
            <p>This is to inform you that you have been blocked by the IAS Team because 
            you have breached the IAS Terms & Policy.</P>
            <strong>Regards:</strong><br>
            <p>IAS.Offical.Team</p>`;

            transporter.sendMail({
              to: User[0].email,
              subject: "Account Blocked",
              html: htmlTemp,
            });
            res.status(200).send("User Blocked");
          }
        }
        else{
            res.status(404).send('No user with this id exists')
        }
    }
    catch(err){
      console.log(err)
        res.status(500).send(err); 
    }
}

//unblock a user
exports.unBlockUser = async (req, res) => {
  const userID = req.params.userID;
  try {
    const User = await user.find({ _id: userID });
    if (User.length > 0) {
      const blockUser = await user.updateOne(
        { _id: userID },
        {
          $set: {
            blocked: false,
          },
        }
      );
      if (blockUser.nModified === 0) {
        res.status(200).send("Aleady Un-blocked");
      } else {
          let htmlTemp = `<p>Dear <strong>${User[0].name} ,</strong></p>
          <p>This is to inform you we have reactivated your IAS account.Go & check your account.
          If you face any issue report the problem in Support Tab.</P>
          <strong>Regards:</strong><br>
          <p>IAS.Offical.Team</p>`;

          transporter.sendMail({
            to: User[0].email,
            subject: "Account Reactivated",
            html: htmlTemp,
          });
        res.status(200).send("User Un-Blocked");
      }
    } else {
      res.status(404).send("No user with this id exists");
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

//get all complains
exports.getComplains= async(req,res)=>{
  try{
    const complains = await Complain.find().populate("userID","name email userType");
    res.status(200).json(complains);
  }
  catch(err){
    res.send(err)
  }
}

//marked complain as working
exports.markedAsWorking=async(req,res)=>{
  const complainID=req.params.complainID;
  if(complainID){
    try{
      const complainData=await Complain.find({_id:complainID}).populate('userID',"name email");
      const updateComplain=await Complain.updateOne(
        {_id:complainID},{
          $set:{
            status:'working',
            response:'Team is working on your problem.'
          }
        }
      );
      if(updateComplain.nModified === 1){
        let htmlTemp = `<p>Dear <strong>${complainData[0].userID.name} ,</strong></p>
          <p>This is to inform you that your complaint which is titled as <strong>${complainData[0].title}</strong>
          has reviewed by our team and we are working on it. You will be notify when your issues will be resolved.</P>
          <strong>Regards:</strong><br>
          <p>IAS.Offical.Team</p>`;

        transporter.sendMail({
          to: complainData[0].userID.email,
          subject: "Complain reviewed",
          html: htmlTemp,
        });
        res.status(200).send('Complain marked as Working')
      }
      else{
        res.status(409).send('Already Marked as Working')
      }
    }
    catch(err){
      res.status(500).send(err)
    }
  }
  else{
    res.status(204).send('complain ID is missing')
  }
}

//marked complain as done
exports.markedAsDone = async (req, res) => {
  const complainID = req.params.complainID;
  if (complainID) {
    try {
      const complainData = await Complain.find({ _id: complainID }).populate(
        "userID",
        "name email"
      );
      const updateComplain = await Complain.updateOne(
        { _id: complainID },
        {
          $set: {
            status: "resolved",
            response: "Your complain is resolved",
          },
        }
      );
      if (updateComplain.nModified === 1) {
        let htmlTemp = `<p>Dear <strong>${complainData[0].userID.name} ,</strong></p>
          <p>This is to inform you that your complaint which is titled as <strong>${complainData[0].title}</strong>
          has fixed by our team. Enjoy !</P>
          <strong>Regards:</strong><br>
          <p>IAS.Offical.Team</p>`;

        transporter.sendMail({
          to: complainData[0].userID.email,
          subject: "Complain Resolved",
          html: htmlTemp,
        });
        res.status(200).send("Complain marked as Done");
      } else {
        res.status(409).send("Already Marked as Done");
      }
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    res.status(204).send("complain ID is missing");
  }
};