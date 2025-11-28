const { verify, TokenExpiredError } = require("jsonwebtoken");

const AuthAdminService = require("../services/admin/auth.service");
const ResponseService = require("../services/core/response.service");
const MongooseLoader = require("../loaders/mongoose.loader");

const { jwtSecret } = require("../config");

class AuthMiddleware {
  static Admin = MongooseLoader.models.Admin;
  static User = MongooseLoader.models.User;
  static authAdminService = new AuthAdminService();

  static isAdmin() {
    return [
      async (req, res, next) => {
        let tokenBearer = req.headers.authorization;
        const token = tokenBearer
          ? tokenBearer.split(" ")[1]
          : req.headers.token;
        verify(token, jwtSecret, (err, decoded) => {
          if (err) {
            let code = err instanceof TokenExpiredError ? 401 : err.status;
            let message =
              err instanceof TokenExpiredError ? "Token expired" : err.message;
            return ResponseService.error(res, message, code);
          } else if (decoded.ip != req.ip) {
            return ResponseService.error(res, "Unauthorized", 401);
          } else {
            req.decoded = decoded;
            req.token = token;
            next();
          }
        });
      },
      async (req, res, next) => {
        const admin = await this.Admin.findOne({ _id: req.decoded._id }).select(
          "_id"
        );
        if (!admin) {
          return ResponseService.error(res, "Unauthorized!", 401);
        }
        next();
      },
    ];
  }

  static isUser() {
    return [
      async (req, res, next) => {
        let tokenBearer = req.headers.authorization;
        const token = tokenBearer
          ? tokenBearer.split(" ")[1]
          : req.headers.token;
        verify(token, jwtSecret, (err, decoded) => {
          if (err) {
            return ResponseService.error(res, err.message, 401);
          } else {
            req.decoded = decoded;
            req.token = token;
            next();
          }
        });
      },
      async (req, res, next) => {
        const user = await this.User.findOne({ tokens: { $in: [req.token] } });
        if (!user) {
          return ResponseService.error(res, "Unauthorized!", 401);
        }
        next();
      },
    ];
  }
}

module.exports = AuthMiddleware;
