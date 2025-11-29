const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");

class UserLogService extends BaseService {
  constructor() {
    super();
    this.UserLog = this.models.UserLog;
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = +req_query.limit;
    let regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";
    let query = {
      ...(req_query.term && {
        $or: [
          { user: { $regex: new RegExp(regexSearch, "i") } },
          { description: { $regex: new RegExp(regexSearch, "i") } },
        ],
      }),
      ...(req_query.action && { action: req_query.action }),
      ...(req_query.table && { table: req_query.table }),
    };
    let pipes = [];
    if (req_query.sortBy) {
      let dir = 1;
      if (req_query.sortDirection == "desc") dir = -1;
      let key = req_query.sortBy;
      pipes.push({ $sort: { [key]: dir } });
    } else {
      pipes.push({ $sort: { createdAt: -1 } });
    }

    let result = await this.UserLog.aggregate([
      {
        $lookup: {
          from: "admins",
          let: { adminId: "$user" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$adminId"] } } },
            {
              $project: {
                _id: 0,
                fullName: { $concat: ["$firstName", " ", "$lastName"] },
              },
            },
          ],
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $addFields: { user: "$user.fullName" } },
      { $match: query },
      ...pipes,
      {
        $facet: {
          data: [
            { $skip: req_query.page ? (req_query.page - 1) * limit : 0 },
            { $limit: limit },
          ],
          totalCount: [{ $count: "total" }],
        },
      },
    ]);
    let data = result[0].data;
    let totalCount = result[0].totalCount[0]
      ? result[0].totalCount[0].total
      : 0;
    return { data, totalCount };
  }

  async create(user_id, action, table, description) {
    await this.UserLog({
      user: user_id,
      action: action.toLowerCase(),
      table,
      description,
    }).save();
  }
}

module.exports = UserLogService;
