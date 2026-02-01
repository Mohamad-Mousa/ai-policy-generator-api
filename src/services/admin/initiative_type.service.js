const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");

class InitiativeTypeService extends BaseService {
  constructor() {
    super();
    this.InitiativeType = this.models.InitiativeType;
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = Math.min(+(req_query.limit) || limit, 100);
    const regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";

    const match = {};
    if (req_query.value != null && req_query.value !== "")
      match.value = +(req_query.value);
    if (req_query.term && regexSearch) {
      match.label = { $regex: new RegExp(regexSearch, "i") };
    }

    const sortKey = req_query.sortBy || "label";
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

    const [result] = await this.InitiativeType.aggregate(pipeline);
    const data = result?.data ?? [];
    const totalCount = result?.totalCount?.[0]?.total ?? 0;

    return { data, totalCount };
  }
}

module.exports = InitiativeTypeService;
