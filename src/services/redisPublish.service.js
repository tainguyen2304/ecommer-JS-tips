const redis = require("redis");

class RedisPubSubService {
  constructor() {
    this.subscriber = redis.createClient();
    this.publisher = redis.createClient();
  }

  async publish(message, channel) {
    try {
      const result = await this.publisher.publish(channel, message);
      return result;
    } catch (error) {
      throw error;
    }
  }

  subscribe(channel, callback) {
    this.subscriber.subscribe(channel);
    this.subscriber.on("message", (subscriberChannel, message) => {
      if (channel === subscriberChannel) {
        callback(channel, message);
      }
    });
  }
}

module.exports = new RedisPubSubService();
