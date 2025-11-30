const BaseService = require("../core/base.service");
const AuthService = require("../core/auth.service");
const StringFormatter = require("../core/string_formatter");
const BodyValidationService = require("../core/body_validation.service");
const CustomError = require("../core/custom_error.service");

class AdminService extends BaseService {
  constructor() {
    super();
    this.Admin = this.models.Admin;
    this.AdminType = this.models.AdminType;
    this.AuthService = AuthService;
    this.bodyValidationService = BodyValidationService;
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = +req_query.limit;
    let regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";
    let query = {
      isDeleted: false,
      ...(req_query.term && {
        $or: [
          { firstName: { $regex: new RegExp(regexSearch, "i") } },
          { lastName: { $regex: new RegExp(regexSearch, "i") } },
          { email: { $regex: new RegExp(regexSearch, "i") } },
        ],
      }),
      ...(req_query.isActive &&
        req_query.isActive !== undefined && {
          isActive: req_query.isActive === "true",
        }),
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

    let result = await this.Admin.aggregate([
      {
        $lookup: {
          from: "admintypes",
          let: { adminTypeId: "$type" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$adminTypeId"] },
                    { $eq: ["$isActive", true] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
          ],
          as: "type",
        },
      },
      { $unwind: { path: "$type", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          type: 1,
          email: 1,
          phone: 1,
          image: 1,
          isActive: 1,
          isDeleted: 1,
          createdAt: 1,
        },
      },
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

  async findOne(id) {
    const admin = await this.Admin.findOne({
      _id: this.ObjectId(id),
      isActive: true,
      isDeleted: false,
    })
      .populate("type")
      .select("-password -tokens");

    if (!admin) throw new CustomError("Admin not found", 404);

    return { admin };
  }

  async create(body, file) {
    this.bodyValidationService.validateRequiredFields(body, [
      "email",
      "firstName",
      "lastName",
      "password",
      "type",
    ]);

    const password = this.AuthService.hashPassword(body.password);

    const adminType = await this.AdminType.findOne({
      _id: this.ObjectId(body.type),
      isActive: true,
      isDeleted: false,
    });

    if (!adminType) throw new CustomError("Admin type not found", 404);

    const existingAdmin = await this.Admin.exists({
      email: body.email,
      isDeleted: false,
    });

    if (existingAdmin) throw new CustomError("Email already exists", 409);

    if (file) {
      body.image = file.filename;
    }

    let admin = await this.Admin({
      ...body,
      password,
      type: adminType._id,
    }).save();

    return admin;
  }

  async update(body, file) {
    if (body.email) {
      const existingAdmin = await this.Admin.findOne({
        _id: { $ne: body._id },
        email: body.email,
        isDeleted: false,
      });
      if (existingAdmin) {
        throw new CustomError("Email already exists", 409);
      }
    }

    if (body.password) {
      body.password = this.AuthService.hashPassword(body.password);
    }

    if (file) {
      body.image = file.filename;
    }

    const admin = await this.Admin.findOneAndUpdate({ _id: body._id }, body);
    return admin;
  }

  async delete(ids) {
    ids = ids.split(",");
    await this.Admin.updateMany({ _id: { $in: ids } }, { isDeleted: true });
  }
}

module.exports = AdminService;
