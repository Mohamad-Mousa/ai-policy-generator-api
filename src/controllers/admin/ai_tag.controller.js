const asyncHandler = require("express-async-handler");
const ResponseService = require("../../services/core/response.service");
const AiTagService = require("../../services/admin/ai_tag.service");

class AiTagController {
  constructor() {
    this.aiTagService = new AiTagService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const result = await this.aiTagService.findMany(req.query);
      ResponseService.success(res, "Success!", result, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = AiTagController;
