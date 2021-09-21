const express = require("express");
const router = express.Router();

const companyController = require("../controllers/company.controller");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");
const block = require("../../middleware/block");


const checkoutSchema = require("../models/checkout.model");
const subscriptionSchema = require("../models/subscription.model");
const UserSchema = require("../../user/models/user.model");

router.post(
  "/companyProfile",
  auth,
  role("company"),
  block,
  companyController.companyProfile
);
router.put(
  "/updateProfile",
  auth,
  role("company"),
  block,
  companyController.updateCompanyProfile
);
router.put(
  "/companyPasswordChange",
  auth,
  role("company"),
  block,
  companyController.companyChangePassword
);

router.post(
  "/checkout",
  auth,
  role("company"),
  block,
  companyController.paymentCheckout
);
router.post("/customerPortal", auth,role('company'),block, companyController.customerPortal);
router.post('/postJob',auth,role('company'),block,companyController.postJob);
router.get('/allJobs',auth,role('company'),block,companyController.getAllJobs);
router.get('/particularJob/:jobID',auth,role('company'),block,companyController.getParticularJobDetail);
router.get(
  "/particularJobAppliedUsers/:jobID",
  auth,
  role("company"),block,
  companyController.getParticularJobUsers
);
router.get('/particularUserDetail/:userID',auth,role('company'),block,companyController.getparticularUserDetail);
router.put('/acceptAppilcant',auth,role('company'),block,companyController.acceptAnApplicant);
router.put("/rejectAppilcant", auth,role('company'),block, companyController.rejectAnApplicant);
router.put("/archiveJob/:jobID", auth,role('company'),block, companyController.archiveJob);
router.get(
  "/complainsCount",
  auth,
  role("company"),
  block,
  companyController.getActiveComplainsCount
);
router.post(
  "/submitComplain",
  auth,
  role("company"),
  block,
  companyController.submitComplain
);
//subscription webhook
router.post( 
  "/webhook",
  express.json({ type: "application/json" }),
  async (request, response) => {
    const event = request.body;
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const paymentIntent = event.data.object;
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        const paymentStatus = paymentIntent.payment_status;
        const customerID = paymentIntent.customer;
        const checkoutID = paymentIntent.id;
        try {
          const checkoutData = await checkoutSchema.find({
            checkoutID: checkoutID,
          });

          const subscriptionData = await new subscriptionSchema({
            checkoutID: checkoutData[0]._id,
            userID: checkoutData[0].userID,
            customerID: customerID,
          }).save();

          console.log("first", subscriptionData);
          // var subscriptionSchemaID = subscriptionData._id;
        } catch (err) {
          console.log(err);
        }

        break;

      case "customer.subscription.created":
        const subscription = event.data.object;
        const startDate = subscription.current_period_start;
        const endDate = subscription.current_period_end;
        const subscriptionID = subscription.id;
        const status = subscription.status;

        try {
          // console.log(subscription);
          const getObjectID = await subscriptionSchema.find({
            customerID: subscription.customer,
          });
          const subID = getObjectID[0]._id;

          const UserID = getObjectID[0].userID;

          const updateUser = await UserSchema.updateOne(
            { _id: UserID },
            {
              $set: {
                subscribed: true,
                subscriptionID: subscriptionID,
              },
            }
          );

          console.log("userUpdated", updateUser);

          const updatedSubscription = await subscriptionSchema.updateOne(
            {
              _id: subID,
            },
            {
              $set: {
                subscriptionID: subscriptionID,
                periodStart: startDate,
                periodEnd: endDate,
                status: status,
              },
            }
          );
          console.log("second", updatedSubscription);
        } catch (err) {
          console.log(err);
        }
        break;

      case "customer.subscription.updated":

        let res = event.data.object;
        try{
          let getSubscriptionData = await subscriptionSchema.find({
            customerID: res.customer,
          });
          let subcripID = getSubscriptionData[0]._id;

          let upDateSubscription = await subscriptionSchema.updateOne(
            {
              _id: subcripID,
            },
            {
              $set: {
                periodEnd: res.current_period_end,
                status: res.status,
              },
            }
          );
          console.log("updated", upDateSubscription);
        }
        catch(err){
          console.log(err.msg)
        }

        break;

      case "customer.subscription.deleted":
        const deletedData = event.data.object;
        try{
          let getSubsData = await subscriptionSchema.find({
            customerID: deletedData.customer,
          });
          let getSubcripID = getSubsData[0]._id;

          let deletedSubscriptionData = await subscriptionSchema.updateOne(
            {
              _id: getSubcripID,
            },
            {
              $set: {
                periodEnd: deletedData.current_period_end,
                status: deletedData.status,
              },
            }
          );
          console.log("deleted", deletedSubscriptionData);
        }
        catch(err){
          console.log(err)
        }
        
        break;

      case "invoice.payment_failed":
        console.log("failed");
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

module.exports = router;
 