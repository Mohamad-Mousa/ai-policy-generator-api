const jwt = require("jsonwebtoken");

const BaseService = require("../core/base.service");
const PrivilegeService = require("./privilege.service");

const config = require("../../config");
const MongoError = require("../core/mongo_error");
const CustomError = require("../core/custom_error.service");
const CoreAuthService = require("../core/auth.service");

class AuthService extends BaseService {
  constructor() {
    super();
    this.Admin = this.models.Admin;
    this.RefreshToken = this.models.RefreshToken;
    this.PrivilegeService = new PrivilegeService();
    this.CoreAuthService = CoreAuthService;
  }

  async refreshToken(token, admin, ip) {
    const accessToken = this.CoreAuthService.generateJwtToken(
      { _id: admin._id, type_id: admin.type_id, type: admin.type, ip },
      "1d"
    );
    const refreshToken = this.CoreAuthService.generateJwtToken(
      { _id: admin._id, type_id: admin.type_id, type: admin.type, ip },
      "7d"
    );
    await this.RefreshToken.updateOne(
      { token },
      { $set: { token: refreshToken } }
    );
    return { accessToken, refreshToken };
  }

  async authenticate(body, ip) {
    const admin = await this.Admin.findOne({
      email: body.email,
      isActive: true,
      isDeleted: false,
    })
      .select("password email type firstName lastName image isActive isDeleted")
      .populate("type");
    if (
      !(await this.CoreAuthService.comparePassword(
        body.password,
        admin.password
      ))
    ) {
      throw new CustomError("Password is incorrect", 401);
    }

    if (admin.type.isActive === false || admin.type.isDeleted === true) {
      throw new CustomError("Your admin type is not active or deleted", 400);
    }

    const accessToken = this.CoreAuthService.generateJwtToken(
      { _id: admin._id, type_id: admin.type._id, type: admin.type.name, ip },
      "1d"
    );
    const refreshToken = this.CoreAuthService.generateJwtToken(
      { _id: admin._id, type_id: admin.type._id, type: admin.type.name, ip },
      "7d"
    );
    await this.RefreshToken({
      token: refreshToken,
      referenceId: admin._id,
      referenceType: "admin",
    }).save();
    const adminInfo = {
      _id: admin._id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      image: admin.image,
      type: admin.type,
      isActive: admin.isActive,
    };

    const privileges = await this.findPrivileges(admin.type._id);

    return { admin: adminInfo, accessToken, refreshToken, privileges };
  }

  async logout(token) {
    await this.RefreshToken.deleteOne({ token }).catch((error) => {
      throw new MongoError(error);
    });
  }

  async findPrivileges(admin_type_id) {
    return await this.PrivilegeService.findMany(admin_type_id);
  }
}

module.exports = AuthService;
