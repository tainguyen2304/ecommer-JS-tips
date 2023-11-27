"use strict";

const { BadRequestError, NotFoundError } = require("../core/error.response");
const discountModel = require("../models/discount.model");
const {
  findAllDiscountCodeUnSelect,
  checkDiscountExits,
  checkDiscountCodeHasExpried,
  findAllDiscountCodeSelect,
} = require("../models/repositories/discount.repo");
const { findAllProducts } = require("../models/repositories/product.repo");
const { convertToObjectMongodb } = require("../utils");

/**
 * Discount Services
 * 1 - Generator Disocunt Code [Shop | Admin ]
 * 2 - Get discount amount [User]
 * 3 - Get all discount codes [User | Shop]
 * 4 - Verify discount code [user]
 * 5 - Delete dsicount code [admin | shop]
 * 6 - cancel discount code [use]
 */

class DisscountSercvice {
  static async createDiscountCode(payload) {
    const {
      code,
      name,
      type,
      shopId,
      end_date,
      max_uses,
      uses_count,
      users_used,
      is_active,
      start_date,
      applies_to,
      product_ids,
      description,
      value,
      max_value,
      min_order_value,
      max_uses_per_user,
    } = payload;

    // checkDiscountCodeHasExpried(start_date, end_date);

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError("Start date must be before end date");
    }

    // create index for discount code
    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectMongodb(shopId),
      })
      .lean();

    if (foundDiscount && foundDiscount.discount_is_active) {
      throw new BadRequestError("Discount exited");
    }

    const newDiscount = await discountModel.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_code: code,
      discout_value: value,
      discount_min_order_value: min_order_value || 0,
      discout_max_value: max_value,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_uses_count: uses_count,
      discount_users_used: users_used,
      discount_max_uses_per_user: max_uses_per_user,
      discount_shopId: shopId,
      discount_is_active: is_active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === "all" ? {} : product_ids,
    });

    return newDiscount;
  }

  static async updateDiscountCode() {
    // ...
  }

  // Get all discount codes availabel with products
  static async getAllDiscountCodeWithProduct({
    code,
    shopId,
    userId,
    limit,
    page,
  }) {
    // create index for discount_code
    const foundDiscount = await discountModel
      .findOne({
        discount_code: code,
        discount_shopId: convertToObjectMongodb(shopId),
      })
      .lean();

    if (!foundDiscount || !foundDiscount.discount_is_active) {
      throw new NotFoundError("Discount not exits");
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount;

    let products;
    if (discount_applies_to === "all") {
      // get all product
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }

    if (discount_applies_to === "specific") {
      // get the products ids
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: "ctime",
        select: ["product_name"],
      });
    }

    return products;
  }

  // get all discount code of shop
  static async getAllDiscountCodesByShop({ limit, page, shopId }) {
    const discounts = await findAllDiscountCodeSelect({
      limit: +limit,
      page: +page,
      filter: {
        discount_shopId: convertToObjectMongodb(shopId),
        discount_is_active: true,
      },
      select: ["discount_code", "discount_name"],
      model: discountModel,
    });

    return discounts;
  }

  // Apply discount code
  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExits({
      model: discountModel,
      filter: {
        discount_code: code,
        discount_shopId: convertToObjectMongodb(shopId),
      },
    });

    if (!foundDiscount) {
      throw new NotFoundError("Discount doesn't exits ");
    }

    const {
      discount_is_active,
      discount_max_uses,
      discount_min_order_value,
      discount_users_used,
      discount_start_date,
      discount_end_date,
      discout_value,
    } = foundDiscount;

    if (!discount_is_active) {
      throw new NotFoundError("Discount expried!");
    }
    if (!discount_max_uses) {
      throw new NotFoundError("Discount are out!");
    }

    checkDiscountCodeHasExpried(discount_start_date, discount_end_date);

    // check xem có giá trị tối thiểu hay không?
    let totalOrder = 0;
    if (discount_min_order_value > 0) {
      // get total
      totalOrder = products.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      if (!totalOrder < discount_min_order_value) {
        throw new NotFoundError(
          `discount requires a minium order value of ${discount_min_order_value}`
        );
      }
    }

    if (discount_max_uses_per_user > 0) {
      const userUsedDiscount = discount_users_used.find(
        (user) => user.uerId === userId
      );
      if (userUsedDiscount) {
        throw new NotFoundError(`userUsedDiscount`);
      }
    }

    // check xme discount nay la fixed_amount
    const amout =
      discount_type === "fixed_amount"
        ? discout_value
        : totalOrder * discout_value;

    return {
      totalOrder,
      discount: amout,
      totalPrice: totalOrder - amout,
    };
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    const deleted = await discountModel.findOneAndDelete({
      discount_code: codeId,
      discount_shopId: convertToObjectMongodb(shopId),
    });

    return deleted;
  }

  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExits({
      model: discountModel,
      filter: {
        discount_code: codeId,
        discount_shopId: convertToObjectMongodb(shopId),
      },
    });

    if (!foundDiscount) {
      throw new NotFoundError("Discount not exits");
    }

    const result = await discountModel.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },
      $inc: {
        discount_max_uses: 1,
        discount_uses_count: -1,
      },
    });

    return result;
  }
}

module.exports = DisscountSercvice;
