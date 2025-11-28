const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const SettingService = require("../../services/admin/setting.service");
const UserLogService = require("../../services/admin/user_log.service");

class SettingController {
  constructor() {
    this.settingService = new SettingService();
    this.userLogService = new UserLogService();
  }

  findOne = asyncHandler(async (req, res) => {
    try {
      const setting = await this.settingService.findOne();
      ResponseService.success(res, "Success!", setting, 200);
    } catch (error) {
      ResponseService.error(res, error.message, error.statusCode || 400);
    }
  });

  update = asyncHandler(async (req, res) => {
    try {
      const setting = await this.settingService.update(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "setting",
        "Settings updated"
      );
      ResponseService.success(res, "Success!", setting, 200);
    } catch (error) {
      ResponseService.error(res, error.message, error.statusCode || 400);
    }
  });
}

module.exports = SettingController;


