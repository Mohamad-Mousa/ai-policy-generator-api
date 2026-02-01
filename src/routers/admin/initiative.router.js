const express = require("express");
const InitiativeController = require("../../controllers/admin/initiative.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class InitiativeRouter {
  constructor() {
    this.initiativeController = new InitiativeController();
  }

  configureRoutes(app) {
    const router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.initiatives));

    router.get("", this.initiativeController.findMany);
    router.get("/:id", this.initiativeController.findOne);

    app.use("/initiative", router);
  }
}

module.exports = InitiativeRouter;
