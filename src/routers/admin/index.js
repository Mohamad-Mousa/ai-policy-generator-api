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

    app.use("/admin", router);
  }
}

module.exports = AdminRouters;
