const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const PolicyService = require("../../services/admin/policy.service");
const UserLogService = require("../../services/admin/user_log.service");

class PolicyController {
  constructor() {
    this.policyService = new PolicyService();
    this.userLogService = new UserLogService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const policies = await this.policyService.findMany(req.query);
      ResponseService.success(res, "Success!", policies, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  findOne = asyncHandler(async (req, res) => {
    try {
      const policy = await this.policyService.findOne(req.params.id, req.query);
      ResponseService.success(res, "Success!", policy, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      const policy = await this.policyService.create(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "policy",
        "Policy created"
      );
      ResponseService.success(res, "Success!", policy, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  delete = asyncHandler(async (req, res) => {
    try {
      await this.policyService.delete(req.params.ids);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "policy",
        "Policy deleted"
      );
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = PolicyController;
