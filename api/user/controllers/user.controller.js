const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require('../models/user.model')
const Joi = require("joi");
const Bcrypt = require("bcryptjs");
const userValidator=require('../../validators/users.validator');
const passwordValidator=require('../../validators/password.validator');
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_USERNAME,
});


exports.getUser= async (req,res)=>{
  if (req.USER.userType === "applicant") {
    const Users = await User.find();
    res.json({
      users: Users,
    });
  } else {
    res.status(403).json({
      msg: "permission denied",
    });
  }
}

exports.signup = async (req, res) => { 
    const name=req.body.name;
    const email=req.body.email;
    const password = req.body.password;
    const userType=req.body.userType;
    

  // Check we have an email
  if(!(email && password && name)){
    res.status(404).send("All inputs required")
  }
  if (!email) {
    return res.status(422).send({ message: "Missing email." });
  }
  try {
    // Check if the email is in use
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(409).send({
        message: "Email is already in use.",
      });
    }
    else{
      // Step 1 - Create and save the user
      try{
        const validator = userValidator.userSchema;
        const value = await validator.validateAsync({
          email: email,
          name: name,
          password: password,
        });
        //encrpted password
        encryptedPassword = await Bcrypt.hash(value.password, 10);
        const user = await new User({
          _id: new mongoose.Types.ObjectId(),
          email: value.email,
          name: value.name,
          password: encryptedPassword,
          userType: userType,
        }).save();
        // Step 2 - Generate a verification token with the user's ID
        const verificationToken = user.generateVerificationToken();

        // Step 3 - Email the user a unique verification link
        const url = `${process.env.localAddress}/api/verify/${verificationToken}`;
        transporter.sendMail({
          to: email,
          subject: "Verify Account",
          html: `Click <a href = '${url}'>here</a> to confirm your email.`,
        });
        return res.status(201).send({
          message: `Sent a verification email to ${email}`,
        });
      }
      catch(error){
        console.log(error.details[0].message);
        res.status(500).send(error.details[0].message);
      }
      
    }
  } catch (err) {
    return res.status(500).send(err);
  }
};


exports.login = async (req, res) => {
  const { email,password } = req.body;
  // Check we have an email
  if (!email) {
    return res.status(422).send({
      message: "Missing email.",
    });
  }
  try {
    // Step 1 - Verify a user with the email exists
    const user = await User.findOne({ email });
    let passwordCheck=''

    //checking user exists or not
    if (!user) {
      return res.status(404).send({ 
        message: "User does not exists",  
      });
    }
    else{
      passwordCheck = await Bcrypt.compare(password, user.password);
      //checking password is correct or not
      if(!passwordCheck){
        return res.status(403).send({
          message:"wrong Password"
        })
      }
    }
    // Ensure the account has been verified
    if (!user.verified) {
      return res.status(403).send({
        message: "Verify your Account.",
      });
    }

    if(email && passwordCheck && user.verified){
              let payload = { ID: user._id };
              let accessToken = jwt.sign(payload, process.env.SecretToken, {
                algorithm: "HS256",
                expiresIn: process.env.ACCESS_TOKEN_LIFE,
              });
              res.send({
                user: user,
                token: accessToken,
              });
    }

  } catch (err) {
    console.log(err)
    return res.status(500).send({msg:err});
  }
};

exports.verify = async (req, res) => {
  const token  = req.params.id;
  // Check we have an id
  if (!token) {
    return res.status(422).send({
      message: "Missing Token",
    });
  }
  // Step 1 -  Verify the token from the URL
  let payload = null;
  try {
    payload = jwt.verify(token, process.env.USER_VERIFICATION_TOKEN_SECRET);

  } catch (err) {
    return res.status(500).send(err);
  }
  try {
    // Step 2 - Find user with matching ID
    const user = await User.findOne({ _id: payload.ID }).exec();
    if (!user) {
      return res.status(404).send({
        message: "User does not  exists",
      });
    }
    // Step 3 - Update user verification status to true
    user.verified = true;
    await user.save();
    return res.status(200).send({
      message: "Account Verified",
    });
  } catch (err) {
    return res.status(500).send(err);
  }
};

exports.forgot=async(req,res)=>{
  const {email}=req.body;
  try {
    const existingUser = await User.findOne({ email }).exec();
    if(existingUser){
      let payload = { ID: existingUser._id, flag: true };
      let resetToken = jwt.sign(payload, process.env.SecretToken, {
        algorithm: "HS256",
        expiresIn: process.env.RESET_TOKEN_LIFE,
      });
      const url = `${process.env.localAddress}/api/forgot/${resetToken}`;
      transporter.sendMail({
        to: email,
        subject: "Forgot Password",
        html: `Click <a href = '${url}'>here</a> to reset your password`,
      });
          return res.status(201).json({
            message: `if ${email} is registered in our system we will send you reset password email`,
          });
    }
  }
  catch (err){
    res.send(404).json({
      message: `if ${email} is registered in our system we will send you reset password email`,
    });
  }
}

exports.resetPassword=async(req,res)=>{
  const {newPassword}=req.body;
  try{
    const validator = passwordValidator.passwordSchema;
    const value = await validator.validateAsync({
      password: newPassword,
    });
    encryptedPassword = await Bcrypt.hash(value.password, 10);
    var token = req.headers["x-reset-token"];
    if (!token)
      return res.status(403).send({ auth: false, message: "Permission denied" });

    jwt.verify(token, process.env.SecretToken, async function (err, decoded) {
      if (err)
        return res
          .status(500)
          .send({ auth: false, message: "Not authorized", err: err });

      // if everything good, save to request for use in other routes
      let ID = decoded.ID;
      let flag = decoded.flag;
      try {
        const existingUser = await User.findById({ _id: ID }).exec();
        console.log(flag, existingUser);
        if (existingUser && flag) {
          try {
            const updateUser = await User.updateOne(
              { _id: ID },
              {
                $set: {
                  password: encryptedPassword,
                },
              }
            );
            let htmlTemp = `Your password has changed. <br>Regards: IAS Team`;
            transporter.sendMail({
              to: existingUser.email,
              subject: "Password Change",
              html: htmlTemp,
            });
            res.status(201).json({
              message: "Your password has changed",
            });
          } catch (err) {
            res.send(500).json({
              msg: err,
            });
          }
        } else {
          res.send(403).json({
            msg: "Not Authorized",
          });
        }
      } catch (err) {
        res.status(500).send(err);
      }
    });
  }
  catch(err){
    res.send(err.details[0].message)
  }
}