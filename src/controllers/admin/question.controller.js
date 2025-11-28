const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const QuestionService = require("../../services/admin/question.service");
const UserLogService = require("../../services/admin/user_log.service");

class QuestionController {
  constructor() {
    this.questionService = new QuestionService();
    this.userLogService = new UserLogService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const questions = await this.questionService.findMany(req.query);
      ResponseService.success(res, "Success!", questions, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  findOne = asyncHandler(async (req, res) => {
    try {
      const question = await this.questionService.findOne(req.params.id);
      ResponseService.success(res, "Success!", question, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      const question = await this.questionService.create(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "question",
        "Question created"
      );
      ResponseService.success(res, "Success!", question, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  update = asyncHandler(async (req, res) => {
    try {
      const question = await this.questionService.update(req.body);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "question",
        "Question updated"
      );
      ResponseService.success(res, "Success!", question, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  delete = asyncHandler(async (req, res) => {
    try {
      await this.questionService.delete(req.params.ids);
      await this.userLogService.create(
        req.decoded._id,
        req.method,
        "question",
        "Question deleted"
      );
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = QuestionController;
