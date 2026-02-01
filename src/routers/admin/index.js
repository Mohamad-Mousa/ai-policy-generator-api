let express = require("express");

const AdminRouter = require("./admin.router");
const AuthMiddleware = require("../../middlewares/auth.middleware");
const AdminTypeRouter = require("./admin_type.router");
const AuthRouters = require("./auth.router");
const FunctionRouter = require("./function.router");
const UserLogRouter = require("./user_log.router");
const DomainRouter = require("./domain.router");
const SettingRouter = require("./setting.router");
const QuestionRouter = require("./question.router");
const AssessmentRouter = require("./assessment.router");
const PolicyRouter = require("./policy.router");
const InitiativeRouter = require("./initiative.router");
const CountryRouter = require("./country.router");
const IntergovernmentalOrganisationRouter = require("./intergovernmental_organisation.router");
const InitiativeTypeRouter = require("./initiative_type.router");
const AiPrincipleRouter = require("./ai_principle.router");
const AiTagRouter = require("./ai_tag.router");

class AdminRouters {
  constructor() {
    this.authMiddleware = AuthMiddleware.isAdmin();
  }

  configureRoutes(app) {
    let router = express.Router();

    new AuthRouters().configureRoutes(router);

    router.use(this.authMiddleware);

    new AdminRouter().configureRoutes(router);
    new AdminTypeRouter().configureRoutes(router);
    new FunctionRouter().configureRoutes(router);
    new UserLogRouter().configureRoutes(router);
    new DomainRouter().configureRoutes(router);
    new SettingRouter().configureRoutes(router);
    new QuestionRouter().configureRoutes(router);
    new AssessmentRouter().configureRoutes(router);
    new PolicyRouter().configureRoutes(router);
    new InitiativeRouter().configureRoutes(router);
    new CountryRouter().configureRoutes(router);
    new IntergovernmentalOrganisationRouter().configureRoutes(router);
    new InitiativeTypeRouter().configureRoutes(router);
    new AiPrincipleRouter().configureRoutes(router);
    new AiTagRouter().configureRoutes(router);

    app.use("/admin", router);
  }
}

module.exports = AdminRouters;
