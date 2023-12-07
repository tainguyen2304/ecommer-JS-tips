"use strict";

const { BadRequestError } = require("../core/error.response");
const { findCartById } = require("../models/repositories/cart.repo");
const { checkProductBySever } = require("../models/repositories/product.repo");
const { getDiscountAmount } = require("./discount.service");
const { acquireLock, releaseLock } = require("./redis.service");
const { order } = require("../models/order.model");

// login and without login
/**
 {
  cartId,
  userId,
  shop_order_ids:[
    {
      shopId,
      shop_discount:[],
      item_product:[{
        price,
        quantity,
        productId
      }]
    },
     {
      shopId,
      shop_discount:[{
        shopId,
        discountId,
        codeId
      }],
      item_product:[{
        price,
        quantity,
        productId
      }]
    }
  ]
 }
 */

class CheckoutSercvice {
  static async checkoutReview({ cartId, userId, shop_order_ids }) {
    // check cartId exits ?
    const foundCart = await findCartById(cartId);
    if (!foundCart) throw new BadRequestError("cart does not exits");

    const checkout_order = {
        totalPrice: 0, // tong tien hang
        feeShip: 0, // phi van chuyen
        totalDiscount: 0, // tong giam gia
        totalCheckout: 0, // tong thanh toan
      },
      shop_order_ids_new = [];

    // tinh tong tien bill

    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discount = [],
        item_products = [],
      } = shop_order_ids[i];

      // check product avaible
      const checkProductSever = await checkProductBySever(item_products);

      if (!checkProductSever[0]) throw new BadRequestError("order wrong!!!");

      const checkoutPrice = checkProductSever.reduce(
        (acc, product) => acc + product.quantity * product.price,
        0
      );

      // tong tien trc khi xu ly
      checkout_order.totalPrice += checkoutPrice;

      const itemCheckout = {
        shopId,
        shop_discount,
        priceRaw: checkoutPrice, // time trc khi giam gia
        priceApplyDiscount: checkoutPrice,
        item_products: checkProductSever,
      };

      // neu shop_discount ton tai > 0, check xem co hop le ko
      if (shop_discount.length > 0) {
        // gia su chi co mot discount
        // get amount discount
        const { discount = 0 } = await getDiscountAmount({
          codeId: shop_discount[0].codeId,
          userId,
          shopId,
          products: checkProductSever,
        });

        //tong cong discount giam gia
        checkout_order.totalDiscount += discount;

        // neu tien giam gia lon hon 0
        if (discount > 0) {
          itemCheckout.priceApplyDiscount = checkoutPrice - discount;
        }
      }

      // tong thanh toan cuoi cung
      checkout_order.totalCheckout += itemCheckout.priceApplyDiscount;
      shop_order_ids_new.push(itemCheckout);
    }

    return {
      shop_order_ids,
      shop_order_ids_new,
      checkout_order,
    };
  }

  static async orderByUser({
    shop_order_ids,
    cartId,
    userId,
    user_address,
    user_payment,
  }) {
    const { shop_order_ids_new, checkout_order } =
      await CheckoutSercvice.checkoutReview({
        cartId,
        userId,
        shop_order_ids,
      });

    // check lai 1 lan nua xem vuot ton kho khong?
    // get new array Products
    const products = shop_order_ids_new.flatMap((order) => order.item_products);
    const acquireProduct = [];
    for (let i = 0; i < products.length; i++) {
      const { productId, quantity } = products[i];
      const keyLock = await acquireLock(productId, quantity, cartId);
      acquireProduct.push(!!keyLock);

      if (keyLock) {
        await releaseLock(keyLock);
      }
    }

    // check if co 1 san pham het han trong kho
    if (acquireProduct.includes(false)) {
      throw new BadRequestError(
        "mot so san pham da dc cap nhat, vui long quay lai gio hang..."
      );
    }

    const newOrder = await order.create({
      order_userId: userId,
      order_checkout: checkout_order,
      order_shipping: user_address,
      order_payment: user_payment,
      order_products: shop_order_ids_new,
    });

    // neu insert thanh cong, thi remove product co troing cart
    if (newOrder) {
      // remove product in my cart
    }

    return newOrder;
  }

  /**
   * 1 query orders [Users]
   */
  static async getOrdersByUser() {}

  /**
   * 1 query orders Using ID [Users]
   */
  static async getOneOrderByUser() {}

  /**
   * 1 cancel order [Users]
   */
  static async cancelOrdersByUser() {}

  /**
   * 1 update  order status [shop | admin]
   */
  static async updateOrderStatusByShop() {}
}

module.exports = CheckoutSercvice;
