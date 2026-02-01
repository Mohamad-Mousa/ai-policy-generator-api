const asyncHandler = require("express-async-handler");
const ResponseService = require("../../services/core/response.service");
const IntergovernmentalOrganisationService = require("../../services/admin/intergovernmental_organisation.service");

class IntergovernmentalOrganisationController {
  constructor() {
    this.intergovernmentalOrganisationService = new IntergovernmentalOrganisationService();
  }

  findMany = asyncHandler(async (req, res) => {
    try {
      const result = await this.intergovernmentalOrganisationService.findMany(req.query);
      ResponseService.success(res, "Success!", result, 200);
    } catch (error) {
      ResponseService.error(res, error.message, 400);
    }
  });
}

module.exports = IntergovernmentalOrganisationController;
