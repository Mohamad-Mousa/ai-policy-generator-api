const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const AssessmentService = require("../../services/admin/assessment.service");
const UserLogService = require("../../services/admin/user_log.service");

class AssessmentController {
  constructor() {
    this.assessmentService = new AssessmentService();
    this.userLogService = new UserLogService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const assessments = await this.assessmentService.findMany(req.query);
      ResponseService.success(res, "Success!", assessments, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  findOne = asyncHandler(async (req, res) => {
    try {
      const assessment = await this.assessmentService.findOne(req.params.id);
      ResponseService.success(res, "Success!", assessment, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      const assessment = await this.assessmentService.create(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "assessment",
        "Assessment created"
      );
      ResponseService.success(res, "Success!", assessment, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  update = asyncHandler(async (req, res) => {
    try {
      const assessment = await this.assessmentService.update(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "assessment",
        "Assessment updated"
      );
      ResponseService.success(res, "Success!", assessment, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  delete = asyncHandler(async (req, res) => {
    try {
      await this.assessmentService.delete(req.params.ids);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "assessment",
        "Assessment deleted"
      );
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = AssessmentController;
