const asyncHandler = require("express-async-handler");
const ResponseService = require("../../services/core/response.service");
const AiPrincipleService = require("../../services/admin/ai_principle.service");

class AiPrincipleController {
  constructor() {
    this.aiPrincipleService = new AiPrincipleService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const result = await this.aiPrincipleService.findMany(req.query);
      ResponseService.success(res, "Success!", result, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = AiPrincipleController;
