const express = require("express");
const CountryController = require("../../controllers/admin/country.controller");
const PrivilegesMiddleware = require("../../middlewares/privileges.middleware");
const function_Keys = require("../../config/functions");

class CountryRouter {
  constructor() {
    this.countryController = new CountryController();
  }

  configureRoutes(app) {
    const router = express.Router();

    router.use(PrivilegesMiddleware.isAllowed(function_Keys.countries));

    router.get("", this.countryController.findMany);

    app.use("/country", router);
  }
}

module.exports = CountryRouter;
