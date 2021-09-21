require("dotenv").config();
const express = require("express");
const app = express();
const BodyParser = require("body-parser");
const mongoose = require("mongoose");
const userRoutes = require('./api/user/routes/user.route');
const applicantRoutes=require('./api/applicant/routes/applicant.route');
const companyRoutes = require("./api/company/routes/company.route");
const jobRoutes=require('./api/job/routes/job.route');
const Subscriptions=require('./api/company/models/subscription.model');
const User=require('./api/user/models/user.model');
const adminRoutes=require('./api/admin/routes/admin.route');
const cron = require("node-cron");
//set up mongoDB connection

mongoose
  .connect(process.env.MONGO_ATLAS, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connected to mongo.");
  })
  .catch((err) => {
    console.log("Error connecting to mongo.", err);
  });
app.use(express.json()); // parse body
app.use(BodyParser.json());
// routes
app.get('/',(req,res)=>{
  res.json({msg:"Hello g"})
})


app.use("/api",userRoutes );

app.use("/api/applicant", applicantRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/admin", adminRoutes);

app.get("/success", (req, res) => {
  res.send("Payment successful");
});

app.get("/failed", (req, res) => {
  res.send("Payment failed");
});

//writing a cron job to check subscription end-Date and update the following fields in DB
var task = cron.schedule("0 0 * * *", async () => {
    let date=new Date().getTime();
    date=Math.floor(date/1000);
  //get all users
  const allUsers = await User.find();

  //mapping on all users
  allUsers.map(async (val) => {
    //checking the is subscribed or not
    if (val.subscribed == true && val.subscriptionID != "" ) {
      //getting subscribtion data against the subscription ID
      const subscriptionData = await Subscriptions.find({
        subscriptionID: val.subscriptionID,
      });
      //mapping on subscription array
      subscriptionData.map(async (sub)=>{
        //checking subscription endtime is passed or not
        if(sub.periodEnd < date){
          //if its passed then set the subscribed variable false and empty the subscription ID field
          let updateSubscription = await User.updateOne(
            { _id: val._id },
            {
              $set: {
                subscribed: false,
                subscriptionID: "",
              },
            }
          );
        }
      });
    }
  });
});

task.start();

app.listen(process.env.PORT, () => {
  console.log("Listening on port: " + process.env.PORT || 4000);
}); // tell express to listen on the port
