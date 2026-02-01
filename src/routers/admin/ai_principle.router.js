const express = require("express");
const AiPrincipleController = require("../../controllers/admin/ai_principle.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class AiPrincipleRouter {
  constructor() {
    this.aiPrincipleController = new AiPrincipleController();
  }

  configureRoutes(app) {
    const router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.aiPrinciples));

    router.get("", this.aiPrincipleController.findMany);

    app.use("/ai-principle", router);
  }
}

module.exports = AiPrincipleRouter;
