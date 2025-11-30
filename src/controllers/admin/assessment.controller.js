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

  import = asyncHandler(async (req, res) => {
    try {
      if (!req.file) {
        return ResponseService.error(res, "No file uploaded", 400);
      }

      const results = await this.assessmentService.import(req.file);

      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "assessment",
        `Assessments imported: ${results.success.length} successful, ${results.errors.length} errors`
      );

      ResponseService.success(res, "Import completed!", results, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  downloadTemplate = asyncHandler(async (req, res) => {
    try {
      const domainId = req.query.domain;

      if (!domainId) {
        return ResponseService.error(
          res,
          "Domain ID is required. Use ?domain=<domain_id>",
          400
        );
      }

      const buffer = await this.assessmentService.generateExcelTemplate(
        domainId
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="assessment_import_template.xlsx"'
      );

      res.send(buffer);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = AssessmentController;
