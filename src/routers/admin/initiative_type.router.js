const express = require("express");
const InitiativeTypeController = require("../../controllers/admin/initiative_type.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class InitiativeTypeRouter {
  constructor() {
    this.initiativeTypeController = new InitiativeTypeController();
  }

  configureRoutes(app) {
    const router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.initiativeTypes));

    router.get("", this.initiativeTypeController.findMany);

    app.use("/initiative-type", router);
  }
}

module.exports = InitiativeTypeRouter;
