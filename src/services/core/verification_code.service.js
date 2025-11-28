const AuthService = require("./auth.service");
const BaseService = require("./base.service");

class VerificationCodeService extends BaseService {
  constructor() {
    super();
    this.VerificationCode = this.models.VerificationCode;
  }
  async create(email) {
    const now = new Date();
    const existingValidCode = await this.VerificationCode.findOne({
      email,
      expiredAt: { $gt: now },
    });
    if (existingValidCode) {
      return { code: existingValidCode.code, email: existingValidCode.email };
    }
    const code = AuthService.generateRandomCode(6);
    const verificationCode = await this.VerificationCode.create({
      code,
      email,
      expiredAt: new Date(now.getTime() + 5 * 60 * 1000),
    });

    return { code: verificationCode.code, email: verificationCode.email };
  }

  async createPhone(phone) {
    const now = new Date();
    const existingValidCode = await this.VerificationCode.findOne({
      "phone.code": phone.code,
      "phone.number": phone.number,
      expiredAt: { $gt: now },
    });
    if (existingValidCode) {
      return { code: existingValidCode.code, phone: existingValidCode.phone };
    }
    const code = AuthService.generateRandomCode(6);
    const verificationCode = await this.VerificationCode.create({
      code,
      phone,
      expiredAt: new Date(now.getTime() + 5 * 60 * 1000),
    });

    return { code: verificationCode.code, phone: verificationCode.phone };
  }

  async deleteOne(code) {
    return await this.VerificationCode.deleteOne({ code });
  }

  async findOne(body) {
    return await this.VerificationCode.findOne(body);
  }
}

module.exports = VerificationCodeService;
