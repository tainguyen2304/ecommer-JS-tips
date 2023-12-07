"use strict";

const express = require("express");
const router = express.Router();

const { asyncHandler } = require("../../helpers/asyncHandler");
const productController = require("../../controllers/product.controller");
const { authenticationLV2 } = require("../../auth/authUtils");
const inventoryController = require("../../controllers/inventory.controller");

router.use(authenticationLV2);
router.post("/", asyncHandler(inventoryController.addStockToInventory));

module.exports = router;
