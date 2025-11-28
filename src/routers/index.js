let express = require("express");
const AdminRouters = require("./admin");
const ResponseService = require("../services/core/response.service");
const config = require("../config");

class ApiRouter {
  constructor() {}

  setHeaders(app) {
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (config.allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With, content-type, x-access-token, authorization"
      );
      res.setHeader("Access-Control-Allow-Credentials", true);
      res.removeHeader("X-Powered-By");
      next();
    });
  }

  configureRoutes(app) {
    let router = express.Router();

    router.all("/", (req, res) => {
      ResponseService.success(res, "Welcome to Phd APIs V1.0!", {}, 200);
    });

    new AdminRouters().configureRoutes(router);

    app.use("/api/v1", router);
  }
}

const apiRouter = new ApiRouter();

module.exports = (app) => {
  apiRouter.setHeaders(app);
  apiRouter.configureRoutes(app);
};
