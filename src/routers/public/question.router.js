const express = require("express");
const PublicQuestionController = require("../../controllers/public/public_question.controller");

class PublicQuestionRouter {
  constructor() {
    this.publicQuestionController = new PublicQuestionController();
  }

  configureRoutes(router) {
    const r = express.Router();
    r.get("", this.publicQuestionController.findByDomain);
    router.use("/question", r);
  }
}

module.exports = PublicQuestionRouter;
