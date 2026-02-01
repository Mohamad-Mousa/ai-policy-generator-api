const asyncHandler = require("express-async-handler");
const ResponseService = require("../../services/core/response.service");
const InitiativeTypeService = require("../../services/admin/initiative_type.service");

class InitiativeTypeController {
  constructor() {
    this.initiativeTypeService = new InitiativeTypeService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const result = await this.initiativeTypeService.findMany(req.query);
      ResponseService.success(res, "Success!", result, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = InitiativeTypeController;
