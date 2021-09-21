const express = require("express");
const router = express.Router();

const UserController = require('../controllers/user.controller');
const auth=require('../../middleware/auth')

router.post("/signup", UserController.signup);
router.post("/login", UserController.login);
router.get("/verify/:id", UserController.verify);
router.get("/getUser", auth, UserController.getUser);
router.post('/forgotPassword',UserController.forgot);
router.put("/resetPassword", UserController.resetPassword);

module.exports = router;
