let express = require("express");
const UserLogController = require("../../controllers/admin/user_log.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class UserLogRouter {
  constructor() {
    this.userLogController = new UserLogController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.userLogs));

    router.get("", this.userLogController.findMany);

    app.use("/user-log", router);
  }
}

module.exports = UserLogRouter;
