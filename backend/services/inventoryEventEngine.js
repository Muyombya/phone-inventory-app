const InventoryEvent =
  require("../models/InventoryEvent");

class InventoryEventEngine {

  async publish(event) {

    try {

      return await InventoryEvent.create(event);

    } catch (error) {

      console.error(
        "Inventory Event Engine:",
        error
      );

      throw error;

    }

  }

}

module.exports =
  new InventoryEventEngine();