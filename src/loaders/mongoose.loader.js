const mongoose = require("mongoose");

const config = require("../config");

class MongooseLoader {
  static mongoose;
  static models = {};

  mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  static load() {
    this.mongoose = mongoose;
    this.mongoose.Promise = global.Promise;
    this.mongoose.set("strictQuery", false);
    let transform = (doc, ret, options) => {
      delete ret.__v;
      return ret;
    };
    this.mongoose.set("toObject", { transform });
    this.mongoose.set("toJSON", { transform });
    this.loadModels();
  }

  static loadModels() {
    this.models.Admin = require("../models/admin.model");
    this.models.UserLog = require("../models/user_log.model");
    this.models.AdminType = require("../models/admin_type.model");
    this.models.Privilege = require("../models/privilege.model");
    this.models.Function = require("../models/function.model");
    this.models.RefreshToken = require("../models/refresh_token.model");
    this.models.VerificationCode = require("../models/verification_code.model");
    this.models.Domain = require("../models/domain.model");
    this.models.Setting = require("../models/setting.model");
    this.models.Question = require("../models/question.model");
    this.models.Assessment = require("../models/assessment.model");
    this.models.Policy = require("../models/policy.model");
  }

  static connect() {
    return this.mongoose.connect(config.dbUrl, this.mongooseOptions);
  }

  static disconnect() {
    this.mongoose.disconnect();
  }
}

module.exports = MongooseLoader;
