"use strict";

const express = require("express");
const router = express.Router();

const { asyncHandler } = require("../../helpers/asyncHandler");
const AccessController = require("../../controllers/access.controller");
const { authentication } = require("../../auth/authUtils");

// signup
router.post("/shop/signUp", asyncHandler(AccessController.signUp));
router.post("/shop/login", asyncHandler(AccessController.login));

//authentication
router.use(authentication);
///////////
router.post("/shop/logout", asyncHandler(AccessController.logout));
router.post(
  "/shop/handleRefreshToken",
  asyncHandler(AccessController.handleRefreshToken)
);

module.exports = router;
