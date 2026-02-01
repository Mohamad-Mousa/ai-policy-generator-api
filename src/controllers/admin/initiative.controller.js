const asyncHandler = require("express-async-handler");
const ResponseService = require("../../services/core/response.service");
const InitiativeService = require("../../services/admin/initiative.service");

class InitiativeController {
  constructor() {
    this.initiativeService = new InitiativeService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const result = await this.initiativeService.findMany(req.query);
      ResponseService.success(res, "Success!", result, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  findOne = asyncHandler(async (req, res) => {
    try {
      const initiative = await this.initiativeService.findOne(req.params.id);
      ResponseService.success(res, "Success!", initiative, 200);
    } catch (error) {
      const status = error.code || 400;
      ResponseService.error(res, error.message, status);
    }
  });
}

module.exports = InitiativeController;
