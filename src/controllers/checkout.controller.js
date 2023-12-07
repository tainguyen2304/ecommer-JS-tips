"use strict";

const { SuccessResponse } = require("../core/success.response");
const CheckoutSercvice = require("../services/checkout.service");

class CheckoutController {
  checkoutReview = async (req, res) => {
    new SuccessResponse({
      message: "Success",
      metadata: await CheckoutSercvice.checkoutReview(req.body),
    }).send(res);
  };
}

module.exports = new CheckoutController();
