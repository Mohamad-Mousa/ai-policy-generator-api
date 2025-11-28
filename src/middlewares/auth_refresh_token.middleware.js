const { verify, TokenExpiredError } = require("jsonwebtoken");

const ResponseService = require("../services/core/response.service");
const MongooseLoader = require("../loaders/mongoose.loader");

const { jwtSecret } = require("../config");

class RefreshTokenMiddleware {

    static VerificationToken = MongooseLoader.models.VerificationToken;
    static RefreshToken = MongooseLoader.models.RefreshToken;

    static auth() {
        return [
            async (req, res, next) => {
                let token = req.cookies.refresh_token;
                verify(token, jwtSecret, (err, decoded) => {
                    if (err) {
                        return ResponseService.error(res, err.message, err.status);
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
                const refreshToken = await this.RefreshToken.findOne({ token: req.token});
                if (!refreshToken) {
                    return ResponseService.error(res, "Unauthorized", 401);
                }
                next();
            }
        ];
    }

}

module.exports = RefreshTokenMiddleware;