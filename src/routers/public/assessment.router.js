const express = require("express");
const PublicAssessmentController = require("../../controllers/public/public_assessment.controller");

class PublicAssessmentRouter {
  constructor() {
    this.publicAssessmentController = new PublicAssessmentController();
  }

  configureRoutes(router) {
    const r = express.Router();
    r.post("/bulk", this.publicAssessmentController.createMany);
    r.get("/:id", this.publicAssessmentController.findOne);
    r.post("", this.publicAssessmentController.create);
    router.use("/assessment", r);
  }
}

module.exports = PublicAssessmentRouter;
