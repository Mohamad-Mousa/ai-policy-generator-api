let express = require("express");
const DomainController = require("../../controllers/admin/domain.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class DomainRouter {
  constructor() {
    this.domainController = new DomainController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.domains));

    router.get("", this.domainController.findMany);
    router.get("/:id", this.domainController.findOne);
    router.post("", this.domainController.create);
    router.put("/update", this.domainController.update);
    router.delete("/delete/:ids", this.domainController.delete);

    app.use("/domain", router);
  }
}
module.exports = DomainRouter;
