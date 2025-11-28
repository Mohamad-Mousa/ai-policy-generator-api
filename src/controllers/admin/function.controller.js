const asyncHandler = require("express-async-handler");

const ResponseService = require("../../services/core/response.service");
const FunctionService = require("../../services/admin/function.service");

class FunctionController {
  constructor() {
    this.functionService = new FunctionService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const data = await this.functionService.findMany();
      ResponseService.success(res, "Success!", data, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  create = asyncHandler(async (req, res) => {
    try {
      await this.functionService.create(req.body);
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });

  delete = asyncHandler(async (req, res) => {
    try {
      await this.functionService.delete(req.params.function_id);
      ResponseService.success(res, "Success!", null, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = FunctionController;
