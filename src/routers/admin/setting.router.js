let express = require("express");
const SettingController = require("../../controllers/admin/setting.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class SettingRouter {
  constructor() {
    this.settingController = new SettingController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.settings));

    router.get("", this.settingController.findOne);
    router.put("/update", this.settingController.update);

    app.use("/setting", router);
  }
}

module.exports = SettingRouter;
