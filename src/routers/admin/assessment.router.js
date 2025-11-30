let express = require("express");
const AssessmentController = require("../../controllers/admin/assessment.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");
const UploadMiddleware = require("../../middlewares/upload.middleware");

class AssessmentRouter {
  constructor() {
    this.assessmentController = new AssessmentController();
    this.uploadMiddleware = UploadMiddleware.uploadSingle(
      "file",
      "assessments/"
    );
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.assessments));

    router.get("", this.assessmentController.findMany);
    router.get("/template", this.assessmentController.downloadTemplate);
    router.get("/:id", this.assessmentController.findOne);
    router.post("", this.assessmentController.create);
    router.post(
      "/import",
      this.uploadMiddleware,
      this.assessmentController.import
    );
    router.put("/update", this.assessmentController.update);
    router.delete("/delete/:ids", this.assessmentController.delete);

    app.use("/assessment", router);
  }
}

module.exports = AssessmentRouter;
