const express = require("express");
const AiTagController = require("../../controllers/admin/ai_tag.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class AiTagRouter {
  constructor() {
    this.aiTagController = new AiTagController();
  }

  configureRoutes(app) {
    const router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.aiTags));

    router.get("", this.aiTagController.findMany);

    app.use("/ai-tag", router);
  }
}

module.exports = AiTagRouter;
