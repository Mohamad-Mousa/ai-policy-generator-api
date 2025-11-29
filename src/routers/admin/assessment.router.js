let express = require("express");
const AssessmentController = require("../../controllers/admin/assessment.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class AssessmentRouter {
  constructor() {
    this.assessmentController = new AssessmentController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.assessments));

    router.get("", this.assessmentController.findMany);
    router.get("/:id", this.assessmentController.findOne);
    router.post("", this.assessmentController.create);
    router.put("/update", this.assessmentController.update);
    router.delete("/delete/:ids", this.assessmentController.delete);

    app.use("/assessment", router);
  }
}

module.exports = AssessmentRouter;
