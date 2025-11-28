const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const UserLogService = require("../../services/admin/user_log.service");

class UserLogController {
  constructor() {
    this.userLogService = new UserLogService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const userLogs = await this.userLogService.findMany(req.query);
      ResponseService.success(res, "Success!", userLogs, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = UserLogController;
