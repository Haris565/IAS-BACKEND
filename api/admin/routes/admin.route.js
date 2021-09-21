const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const auth = require("../../middleware/auth");
const role = require("../../middleware/role");



router.get('/getApplicants',auth,role('admin'),adminController.getAllApplicants);

router.get("/getCompanies", auth,role('admin'), adminController.getAllCompanies);

router.get(
  "/getSubscriptions",
  auth,
  role("admin"),
  adminController.getSubscriptionsRecord
);

router.get(
  "/getCheckouts",
  auth,
  role("admin"),
  adminController.getCheckoutsRecord
);

router.get(
  "/getTotalSales",
  auth,
  role("admin"),
  adminController.getTransactionsList
);

router.put("/blockUser/:userID", auth, role("admin"), adminController.blockUser);

router.put(
  "/unBlockUser/:userID",
  auth,
  role("admin"),
  adminController.unBlockUser
);


router.put(
  "/markedAsWorking/:complainID",
  auth,
  role("admin"),
  adminController.markedAsWorking
);

router.put(
  "/markedAsDone/:complainID",
  auth,
  role("admin"),
  adminController.markedAsDone
);

router.get('/getComplains',auth,role('admin'),adminController.getComplains);



module.exports = router;