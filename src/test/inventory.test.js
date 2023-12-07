const redisPubService = require("../services/redisPublish.service");

class InventoryServiceTest {
  constructor() {
    redisPubService.subscribe("inventory_event", (channel, message) => {
      InventoryServiceTest.updateInventory(message);
    });
  }

  static updateInventory(productId, quantity) {
    console.log(
      "🚀 ~ file: inventory.test.js:12 ~ InventoryServiceTest ~ updateInventory ~ productId,quantity:",
      productId,
      quantity
    );
  }
}

module.exports = new InventoryServiceTest();
