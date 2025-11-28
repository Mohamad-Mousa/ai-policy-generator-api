let express = require("express");
const AdminController = require("../../controllers/admin/admin.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");
const UploadMiddleware = require("../../middlewares/upload.middleware");

class AdminRouter {
  constructor() {
    this.adminController = new AdminController();
    this.uploadMiddleware = UploadMiddleware.uploadSingle("image", "admins/");
  }

  configureRoutes(app) {
    let router = express.Router();

    app.use(PrivilegesMiddleware.isAllowed(function_Keys.admins));

    router.get("", this.adminController.findMany);
    router.get("/:id", this.adminController.findOne);
    router.post("", this.uploadMiddleware, this.adminController.create);
    router.put("/update", this.uploadMiddleware, this.adminController.update);
    router.delete("/delete/:ids", this.adminController.delete);

    app.use("/admins", router);
  }
}
module.exports = AdminRouter;
