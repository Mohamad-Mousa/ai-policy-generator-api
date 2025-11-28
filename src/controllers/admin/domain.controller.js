const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const DomainService = require("../../services/admin/domain.service");
const UserLogService = require("../../services/admin/user_log.service");

class DomainController {
  constructor() {
    this.domainService = new DomainService();
    this.userLogService = new UserLogService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const domains = await this.domainService.findMany(req.query);
      ResponseService.success(res, "Success!", domains, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  findOne = asyncHandler(async (req, res) => {
    try {
      const domain = await this.domainService.findOne(req.params.id);
      ResponseService.success(res, "Success!", domain, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      const domain = await this.domainService.create(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "domain",
        "Domain created"
      );
      ResponseService.success(res, "Success!", domain, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  update = asyncHandler(async (req, res) => {
    try {
      const domain = await this.domainService.update(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "domain",
        "Domain updated"
      );
      ResponseService.success(res, "Success!", domain, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  delete = asyncHandler(async (req, res) => {
    try {
      await this.domainService.delete(req.params.ids);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "domain",
        "Domain deleted"
      );
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = DomainController;
