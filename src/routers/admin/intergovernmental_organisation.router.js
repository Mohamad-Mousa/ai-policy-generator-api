const express = require("express");
const IntergovernmentalOrganisationController = require("../../controllers/admin/intergovernmental_organisation.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class IntergovernmentalOrganisationRouter {
  constructor() {
    this.intergovernmentalOrganisationController = new IntergovernmentalOrganisationController();
  }

  configureRoutes(app) {
    const router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.intergovernmentalOrganisations));

    router.get("", this.intergovernmentalOrganisationController.findMany);

    app.use("/intergovernmental-organisation", router);
  }
}

module.exports = IntergovernmentalOrganisationRouter;
