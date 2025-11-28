const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const AdminService = require("../../services/admin/admin.service");
const UserLogService = require("../../services/admin/user_log.service");

class AdminController {
  constructor() {
    this.adminService = new AdminService();
    this.userLogService = new UserLogService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const admins = await this.adminService.findMany(req.query);
      ResponseService.success(res, "Success!", admins, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  findOne = asyncHandler(async (req, res) => {
    try {
      const admin = await this.adminService.findOne(req.params.id);
      ResponseService.success(res, "Success!", admin, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      const admin = await this.adminService.create(req.body, req.file);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "admin",
        "Admin created"
      );
      ResponseService.success(res, "Success!", admin, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  update = asyncHandler(async (req, res) => {
    try {
      const admin = await this.adminService.update(req.body, req.file);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "admin",
        "Admin updated"
      );
      ResponseService.success(res, "Success!", admin, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  delete = asyncHandler(async (req, res) => {
    try {
      await this.adminService.delete(req.params.ids);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "admin",
        "Admin deleted"
      );
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = AdminController;
