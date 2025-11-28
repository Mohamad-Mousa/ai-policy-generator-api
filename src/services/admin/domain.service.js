const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const BodyValidationService = require("../core/body_validation.service");
const CustomError = require("../core/custom_error.service");

class DomainService extends BaseService {
  constructor() {
    super();
    this.Domain = this.models.Domain;
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
          { title: { $regex: new RegExp(regexSearch, "i") } },
          { description: { $regex: new RegExp(regexSearch, "i") } },
          { subDomains: { $regex: new RegExp(regexSearch, "i") } },
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
    let result = await this.Domain.aggregate([
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
    const domain = await this.Domain.findOne({
      _id: this.ObjectId(id),
      isDeleted: false,
    });

    if (!domain) throw new CustomError("Domain not found", 404);

    return { domain };
  }

  async create(body) {
    this.bodyValidationService.validateRequiredFields(body, [
      "title",
      "description",
    ]);

    const domain = await this.Domain({
      title: body.title,
      description: body.description,
      ...(body.subDomains &&
        body.subDomains.length > 0 && { subDomains: body.subDomains }),
      ...(body.icon && { icon: body.icon }),
      ...(body.isActive !== undefined && {
        isActive: body.isActive === "true" ? true : false,
      }),
    }).save();

    return domain;
  }

  async update(body) {
    const domain = await this.Domain.findOne({
      _id: this.ObjectId(body._id),
      isDeleted: false,
    });

    if (!domain) throw new CustomError("Domain not found", 404);

    await this.Domain.updateOne(
      { _id: body._id },
      {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.isActive !== undefined && {
          isActive: body.isActive == "true" ? true : false,
        }),
        ...(body.subDomains && { subDomains: body.subDomains }),
      }
    );

    return await this.Domain.findOne({ _id: body._id });
  }

  async delete(ids) {
    ids = ids.split(",");
    await this.Domain.updateMany({ _id: { $in: ids } }, { isDeleted: true });
  }
}

module.exports = DomainService;
