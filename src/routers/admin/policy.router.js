let express = require("express");
const PolicyController = require("../../controllers/admin/policy.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class PolicyRouter {
  constructor() {
    this.policyController = new PolicyController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.policies));

    router.get("", this.policyController.findMany);
    router.get("/:id", this.policyController.findOne);
    router.post("", this.policyController.create);
    router.delete("/delete/:ids", this.policyController.delete);

    app.use("/policy", router);
  }
}

module.exports = PolicyRouter;

