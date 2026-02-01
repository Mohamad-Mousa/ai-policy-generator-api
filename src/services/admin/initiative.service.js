const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const CustomError = require("../core/custom_error.service");
const mongoose = require("mongoose");

class InitiativeService extends BaseService {
  constructor() {
    super();
    this.Initiative = this.models.Initiative;
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = Math.min(+(req_query.limit) || limit, 100);
    const regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";

    const match = {};
    if (req_query.status) match.status = req_query.status;
    if (req_query.category) match.category = req_query.category;
    if (req_query.gaiinCountryId) match.gaiinCountryId = +(req_query.gaiinCountryId);

    if (req_query.term && regexSearch) {
      const regex = new RegExp(regexSearch, "i");
      match.$or = [
        { englishName: { $regex: regex } },
        { description: { $regex: regex } },
        { overview: { $regex: regex } },
        { slug: { $regex: regex } },
      ];
    }

    const sortKey = req_query.sortBy || "createdAt";
    const sortDir = req_query.sortDirection === "desc" ? -1 : 1;
    const skip = req_query.page ? (req_query.page - 1) * limit : 0;

    const pipeline = [
      { $match: Object.keys(match).length ? match : {} },
      { $sort: { [sortKey]: sortDir } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await this.Initiative.aggregate(pipeline);
    const data = result?.data ?? [];
    const totalCount = result?.totalCount?.[0]?.total ?? 0;

    return { data, totalCount };
  }

  async findOne(idOrSlug) {
    const isObjectId =
      mongoose.Types.ObjectId.isValid(idOrSlug) &&
      String(new mongoose.Types.ObjectId(idOrSlug)) === idOrSlug;

    const matchStage = isObjectId
      ? { $match: { _id: this.ObjectId(idOrSlug) } }
      : { $match: { slug: idOrSlug } };

    const [initiative] = await this.Initiative.aggregate([
      matchStage,
      { $limit: 1 },
    ]);

    if (!initiative) throw new CustomError("Initiative not found", 404);

    return initiative;
  }
}

module.exports = InitiativeService;
