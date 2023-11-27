"use strict";

const express = require("express");
const router = express.Router();

const { asyncHandler } = require("../../helpers/asyncHandler");
const productController = require("../../controllers/product.controller");
const { authenticationLV2 } = require("../../auth/authUtils");
const discountController = require("../../controllers/discount.controller");

// get amount a discount
router.post("/amount", asyncHandler(discountController.getAllDiscountAmount));
router.get(
  "/list_product_code",
  asyncHandler(discountController.getAllDiscountCodeWithProducts)
);

// authentication //
router.use(authenticationLV2);

router.post("", asyncHandler(discountController.createDiscount));
router.get("", asyncHandler(discountController.getAllDiscountCodes));

module.exports = router;
