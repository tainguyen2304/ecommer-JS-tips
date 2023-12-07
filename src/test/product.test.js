const redisPubService = require("../services/redisPublish.service");

class ProductServiceTest {
  purchaseProduct(productId, quantity) {
    const order = {
      productId,
      quantity,
    };

    redisPubService.publish("purchase_events", JSON.stringify(order));
  }
}

module.exports = new ProductServiceTest();
