const express = require('express');
const userRouter = express.Router();
const userController = require('../controller/userController');
const { verifyToken } = require('../controller/userController');

userRouter.post("/signup", userController.signUp);
userRouter.post("/login", userController.login);
userRouter.post("/send-otp", userController.sendOtp);
userRouter.post("/verify-otp", userController.verifyOtp);
userRouter.post("/add-emergency-contact", verifyToken, userController.addContact);
userRouter.get("/get-emergency-contacts", verifyToken, userController.getContacts);
userRouter.delete("/delete-emergency-contact/:contactId", verifyToken, userController.deleteContact);
userRouter.post("/send-sos", verifyToken, userController.sendSOS);
userRouter.post("/get-safest-route",verifyToken,userController.getSafestRoute);
userRouter.post("/report-unsafe-location", verifyToken, userController.addUnsafeLocation);


module.exports = userRouter;