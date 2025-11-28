let express = require("express");
const QuestionController = require("../../controllers/admin/question.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class QuestionRouter {
  constructor() {
    this.questionController = new QuestionController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.questions));

    router.get("", this.questionController.findMany);
    router.get("/:id", this.questionController.findOne);
    router.post("", this.questionController.create);
    router.put("/update", this.questionController.update);
    router.delete("/delete/:ids", this.questionController.delete);

    app.use("/question", router);
  }
}

module.exports = QuestionRouter;
