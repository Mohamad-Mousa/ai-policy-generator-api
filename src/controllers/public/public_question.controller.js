const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const PublicQuestionService = require("../../services/public/public_question.service");

class PublicQuestionController {
  constructor() {
    this.publicQuestionService = new PublicQuestionService();
  }

  findByDomain = asyncHandler(async (req, res) => {
    try {
      const result = await this.publicQuestionService.findByDomain(
        req.query.domain,
      );
      ResponseService.success(res, "Success!", result, 200);
    } catch (error) {
      ResponseService.error(res, error.message, error.code || 400);
    }
  });
}

module.exports = PublicQuestionController;
