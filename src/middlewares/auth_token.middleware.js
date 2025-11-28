const { verify } = require("jsonwebtoken");

const ResponseService = require("../services/core/response.service");
const MongooseLoader = require("../loaders/mongoose.loader");

const { jwtSecret } = require("../config");

class AuthTokenMiddleware {

    static VerificationToken = MongooseLoader.models.VerificationToken;

    static isForgetPasswordTokenValid() {
        return [
            async (req, res, next) => {
                let tokenBearer = req.headers.authorization;
                const token = tokenBearer ? tokenBearer.split(" ")[1] : req.headers.token;
                verify(token, jwtSecret, (err, decoded) => {
                    if (err) {
                        return ResponseService.error(res, err.message, err.status);
                    } else {
                        req.decoded = decoded;
                        req.token = token;
                        next();
                    }
                });
            },
            async (req, res, next) => {
                const verificationToken = await AuthTokenMiddleware.VerificationToken.findOne({token: req.token});
                if(!verificationToken) {
                    return ResponseService.error(res, "Token not found", 404);
                } else {
                    next();
                }
            }
        ];
    }

}

module.exports = AuthTokenMiddleware;