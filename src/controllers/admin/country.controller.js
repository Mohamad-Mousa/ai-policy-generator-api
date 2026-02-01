const asyncHandler = require("express-async-handler");
const ResponseService = require("../../services/core/response.service");
const CountryService = require("../../services/admin/country.service");

class CountryController {
  constructor() {
    this.countryService = new CountryService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const result = await this.countryService.findMany(req.query);
      ResponseService.success(res, "Success!", result, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = CountryController;
