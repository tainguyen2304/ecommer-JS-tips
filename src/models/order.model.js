"use strict";

const { model, Schema } = require("mongoose"); // Erase if already required

const DOCUMENT_NAME = "Order";
const COLLECTION_NAME = "Orders";

// Declare the Schema of the Mongo model
const orderSchema = new Schema(
  {
    order_userId: {
      type: Number,
      require: true,
    },
    order_checkout: {
      type: Object,
      default: {},
    },
    order_shipping: {
      type: Object,
      default: {},
    },
    order_payment: {
      type: Object,
      default: {},
    },
    order_products: {
      type: Array,
      require: true,
    },
    order_trackingNumber: {
      type: String,
      default: "#12312312312770",
    },
    order_status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: {
      createdAt: "createOn",
      updateAt: "modifieOn",
    },
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = { order: model(DOCUMENT_NAME, orderSchema) };
