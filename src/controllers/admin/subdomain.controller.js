const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const SubdomainService = require("../../services/admin/subdomain.service");
const UserLogService = require("../../services/admin/user_log.service");

class SubdomainController {
  constructor() {
    this.subdomainService = new SubdomainService();
    this.userLogService = new UserLogService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const subdomains = await this.subdomainService.findMany(req.query);
      ResponseService.success(res, "Success!", subdomains, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  findOne = asyncHandler(async (req, res) => {
    try {
      const subdomain = await this.subdomainService.findOne(req.params.id);
      ResponseService.success(res, "Success!", subdomain, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      const subdomain = await this.subdomainService.create(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "subdomain",
        "Subdomain created"
      );
      ResponseService.success(res, "Success!", subdomain, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  update = asyncHandler(async (req, res) => {
    try {
      const subdomain = await this.subdomainService.update(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "subdomain",
        "Subdomain updated"
      );
      ResponseService.success(res, "Success!", subdomain, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  delete = asyncHandler(async (req, res) => {
    try {
      await this.subdomainService.delete(req.params.ids);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "subdomain",
        "Subdomain deleted"
      );
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = SubdomainController;
