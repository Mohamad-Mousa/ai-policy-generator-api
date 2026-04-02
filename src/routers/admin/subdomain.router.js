let express = require("express");
const SubdomainController = require("../../controllers/admin/subdomain.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class SubdomainRouter {
  constructor() {
    this.subdomainController = new SubdomainController();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.subdomains));

    router.get("", this.subdomainController.findMany);
    router.get("/:id", this.subdomainController.findOne);
    router.post("", this.subdomainController.create);
    router.put("/update", this.subdomainController.update);
    router.delete("/delete/:ids", this.subdomainController.delete);

    app.use("/subdomain", router);
  }
}
module.exports = SubdomainRouter;
