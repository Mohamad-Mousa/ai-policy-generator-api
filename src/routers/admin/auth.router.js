let express = require("express");

const AuthAdminController = require("../../controllers/admin/auth.controller");
const AuthMiddleware = require("../../middlewares/auth.middleware");
const RefreshTokenMiddleware = require("../../middlewares/auth_refresh_token.middleware");

class AuthRouter {
  constructor() {
    this.AuthAdminController = new AuthAdminController();
    this.AuthMiddleWare = AuthMiddleware.isAdmin();
    this.RefreshTokenMiddleware = RefreshTokenMiddleware.auth();
  }

  configureRoutes(app) {
    let router = express.Router();

    router.post("/authenticate", this.AuthAdminController.authenticate);
    router.post(
      "/refresh-token",
      this.RefreshTokenMiddleware,
      this.AuthAdminController.refreshToken
    );
    router.post(
      "/logout",
      this.AuthMiddleWare,
      this.AuthAdminController.logout
    );

    app.use("/auth", router);
  }
}
module.exports = AuthRouter;
