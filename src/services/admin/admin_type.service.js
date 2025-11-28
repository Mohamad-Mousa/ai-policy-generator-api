const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const PrivilegeService = require("./privilege.service");

class AdminTypeService extends BaseService {
  constructor() {
    super();
    this.AdminType = this.models.AdminType;
    this.PrivilegeService = new PrivilegeService();
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = +req_query.limit;
    let regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";
    let query = {
      isDeleted: false,
      ...(req_query.term && { name: { $regex: new RegExp(regexSearch, "i") } }),
      ...(req_query.isActive !== undefined && {
        isActive: req_query.isActive === "true",
      }),
    };

    let pipes = [];
    if (req_query.sortBy) {
      let dir = 1;
      if (req_query.sortDirection == "desc") dir = -1;
      let key = req_query.sortBy;
      pipes.push({ $sort: { [key]: dir } });
    }
    let result = await this.AdminType.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "privileges",
          let: { adminTypeId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$adminType", "$$adminTypeId"] } } },
            {
              $lookup: {
                from: "functions",
                let: { functionId: "$function" },
                pipeline: [
                  {
                    $match: { $expr: { $eq: ["$_id", "$$functionId"] } },
                  },
                  {
                    $project: {
                      _id: 1,
                    },
                  },
                ],
                as: "function",
              },
            },
            {
              $unwind: { path: "$function", preserveNullAndEmptyArrays: true },
            },
          ],
          as: "privileges",
        },
      },
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

  async create(body) {
    const adminType = await this.AdminType({ name: body.name }).save();
    return await this.PrivilegeService.insertMany(
      adminType._id,
      body.privileges
    );
  }

  async update(body) {
    await this.AdminType.updateOne(
      { _id: body._id },
      {
        ...(body.name && { name: body.name }),
        ...(body.isActive !== undefined && {
          isActive: body.isActive == "true" ? true : false,
        }),
      }
    );

    if (body.privileges) {
      await this.PrivilegeService.updateMany(body._id, body.privileges);
    }
  }

  async delete(ids) {
    ids = ids.split(",");
    await this.AdminType.updateMany({ _id: { $in: ids } }, { isDeleted: true });
  }
}

module.exports = AdminTypeService;
