let express = require("express");
const AdminTypeController = require("../../controllers/admin/admin-type.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");
const AuthMiddleware = require("../../middlewares/auth.middleware");

class AdminTypeRouter {
  constructor() {
    this.adminController = new AdminTypeController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.adminTypes));

    router.get("", this.adminController.findMany);
    router.post("", this.adminController.create);
    router.put("/update", this.adminController.update);
    router.delete("/delete/:ids", this.adminController.delete);

    app.use("/admin-type", router);
  }
}
module.exports = AdminTypeRouter;
