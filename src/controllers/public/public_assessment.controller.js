const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const AssessmentService = require("../../services/admin/assessment.service");

class PublicAssessmentController {
  constructor() {
    this.assessmentService = new AssessmentService();
  }

  findOne = asyncHandler(async (req, res) => {
    try {
      const assessment = await this.assessmentService.findOne(req.params.id);
      ResponseService.success(res, "Success!", assessment, 200);
    } catch (error) {
      ResponseService.error(res, error.message, error.code || 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      const assessment = await this.assessmentService.create(req.body);
      ResponseService.success(res, "Success!", assessment, 201);
    } catch (error) {
      ResponseService.error(res, error.message, error.code || 400);
    }
  });
}

module.exports = PublicAssessmentController;
