const asyncHandler = require("express-async-handler");

const AdminService = require("../../services/admin/admin.service");
const AuthAdminService = require("../../services/admin/auth.service");
const CookieService = require("../../services/core/cookie.service");
const ResponseService = require("../../services/core/response.service");
const UserLogService = require("../../services/admin/user_log.service");

class AuthController {
  constructor() {
    this.adminService = new AdminService();
    this.AuthAdminService = new AuthAdminService();
    this.userLogService = new UserLogService();
  }

  authenticate = asyncHandler(async (req, res) => {
    try {
      const { admin, accessToken, refreshToken, privileges } =
        await this.AuthAdminService.authenticate(req.body, req.ip);
      CookieService.set(res, "refresh_token", refreshToken);

      ResponseService.success(
        res,
        "Success!",
        { admin, accessToken, refreshToken, privileges },
        200
      );
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  refreshToken = asyncHandler(async (req, res) => {
    try {
      const { refreshToken, accessToken } =
        await this.AuthAdminService.refreshToken(
          req.token,
          req.decoded,
          req.ip
        );
      CookieService.set(res, "refresh_token", refreshToken);
      ResponseService.success(
        res,
        "Success!",
        { refreshToken, accessToken },
        200
      );
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  logout = asyncHandler(async (req, res) => {
    try {
      await this.AuthAdminService.logout(req.cookies.refresh_token);
      CookieService.unset(res, "refresh_token");
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "auth",
        "Admin logged out"
      );
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      console.log(error);
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = AuthController;
