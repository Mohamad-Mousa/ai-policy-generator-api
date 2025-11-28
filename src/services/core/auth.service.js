const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const BaseService = require("./base.service");
const config = require("../../config");
const CustomError = require("./custom_error.service");
const MailService = require("./mail.service");
const MongooseLoader = require("../../loaders/mongoose.loader");

class AuthService {
  static VerificationToken = MongooseLoader.models.VerificationToken;

  static hashPassword(password) {
    return bcrypt.hashSync(password, 8);
  }
  static async comparePassword(password, hashpassword) {
    return await bcrypt.compare(password, hashpassword);
  }
  static generateJwtToken(body, expiresIn = "1d") {
    return jwt.sign(body, config.jwtSecret, { expiresIn });
  }

  static async generateChangePasswordToken(body, expiresIn) {
    const token = AuthService.generateJwtToken(body, expiresIn);
    return await new AuthService.VerificationToken({
      email: body.email,
      token,
    }).save();
  }

  static generatePassword() {
    let length = 12;
    let charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return { password: retVal, bcrypt: bcrypt.hashSync(retVal, 8) };
  }

  static generateRandomCode(length = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

module.exports = AuthService;
