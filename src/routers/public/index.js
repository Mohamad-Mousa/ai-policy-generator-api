let express = require("express");

const AssessmentRouter = require("./assessment.router");
const PublicQuestionRouter = require("./question.router");

class PublicRouters {
  constructor() {}

  configureRoutes(app) {
    let router = express.Router();

    new PublicQuestionRouter().configureRoutes(router);
    new AssessmentRouter().configureRoutes(router);

    app.use("/public", router);
  }
}

module.exports = PublicRouters;
