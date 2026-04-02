const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const BodyValidationService = require("../core/body_validation.service");
const CustomError = require("../core/custom_error.service");

class SubdomainService extends BaseService {
  constructor() {
    super();
    this.Subdomain = this.models.Subdomain;
    this.Domain = this.models.Domain;
    this.bodyValidationService = BodyValidationService;
  }

  async assertDomainActiveAndNotDeleted(domainId) {
    const domain = await this.Domain.findOne({
      _id: this.ObjectId(domainId),
      isDeleted: false,
      isActive: true,
    });
    if (!domain) {
      throw new CustomError("Domain not found, inactive, or deleted", 400);
    }
    return domain;
  }

  async assertUniqueTitlePerDomain(domainId, title, excludeSubdomainId = null) {
    const trimmed = typeof title === "string" ? title.trim() : "";
    if (!trimmed) return;

    const escaped = StringFormatter.escapeSpecialChars(trimmed);
    const query = {
      domain: this.ObjectId(domainId),
      isDeleted: false,
      title: new RegExp(`^${escaped}$`, "i"),
    };
    if (excludeSubdomainId) {
      query._id = { $ne: this.ObjectId(excludeSubdomainId) };
    }

    const existing = await this.Subdomain.findOne(query).select("_id");
    if (existing) {
      throw new CustomError(
        "A subdomain with this title already exists for this domain",
        400,
      );
    }
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = +req_query.limit;
    if (req_query.domain) {
      if (!this.mongoose.Types.ObjectId.isValid(req_query.domain)) {
        throw new CustomError("Invalid domain id", 400);
      }
    }
    const regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";
    const query = {
      isDeleted: false,
      ...(req_query.domain && {
        domain: this.ObjectId(req_query.domain),
      }),
      ...(req_query.term && {
        $or: [{ title: { $regex: new RegExp(regexSearch, "i") } }],
      }),
      ...(req_query.isActive &&
        req_query.isActive !== undefined && {
          isActive: req_query.isActive === "true",
        }),
    };

    const pipes = [];
    if (req_query.sortBy) {
      let dir = 1;
      if (req_query.sortDirection == "desc") dir = -1;
      const key = req_query.sortBy;
      pipes.push({ $sort: { [key]: dir } });
    } else {
      pipes.push({ $sort: { createdAt: -1 } });
    }
    pipes.push({
      $lookup: {
        from: "domains",
        let: { domainId: "$domain" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$domainId"] } } },
          {
            $project: {
              title: 1,
              isActive: 1,
              icon: 1,
              predefinedAssessmentTitle: 1,
            },
          },
        ],
        as: "domainLookup",
      },
    });
    pipes.push({
      $addFields: {
        domain: { $arrayElemAt: ["$domainLookup", 0] },
      },
    });
    pipes.push({ $project: { domainLookup: 0 } });

    const result = await this.Subdomain.aggregate([
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
    const data = result[0].data;
    const totalCount = result[0].totalCount[0]
      ? result[0].totalCount[0].total
      : 0;
    return { data, totalCount };
  }

  async findOne(id) {
    const subdomain = await this.Subdomain.findOne({
      _id: this.ObjectId(id),
      isDeleted: false,
    }).populate({
      path: "domain",
      select: "title description icon isActive isDeleted subDomains",
    });

    if (!subdomain) throw new CustomError("Subdomain not found", 404);

    return { subdomain };
  }

  async create(body) {
    this.bodyValidationService.validateRequiredFields(body, [
      "title",
      "domain",
    ]);
    await this.assertDomainActiveAndNotDeleted(body.domain);
    await this.assertUniqueTitlePerDomain(body.domain, body.title);

    const subdomain = await this.Subdomain({
      title: body.title,
      domain: body.domain,
      isActive: body.isActive ? true : false,
    }).save();

    return await this.Subdomain.findOne({ _id: subdomain._id }).populate({
      path: "domain",
      select: "title description icon isActive isDeleted subDomains",
    });
  }

  async update(body) {
    const subdomain = await this.Subdomain.findOne({
      _id: this.ObjectId(body._id),
      isDeleted: false,
    });

    if (!subdomain) throw new CustomError("Subdomain not found", 404);

    if (body.domain !== undefined) {
      await this.assertDomainActiveAndNotDeleted(body.domain);
    }

    const nextDomain =
      body.domain !== undefined ? body.domain : subdomain.domain;
    const nextTitle = body.title !== undefined ? body.title : subdomain.title;
    if (body.title !== undefined || body.domain !== undefined) {
      await this.assertUniqueTitlePerDomain(nextDomain, nextTitle, body._id);
    }

    await this.Subdomain.updateOne(
      { _id: body._id },
      {
        ...(body.title && { title: body.title }),
        ...(body.domain !== undefined && { domain: body.domain }),
        ...(body.isActive !== undefined && {
          isActive: body.isActive == true ? true : false,
        }),
      },
    );

    return await this.Subdomain.findOne({ _id: body._id }).populate({
      path: "domain",
      select: "title description icon isActive isDeleted subDomains",
    });
  }

  async delete(ids) {
    ids = ids.split(",");
    await this.Subdomain.updateMany({ _id: { $in: ids } }, { isDeleted: true });
  }
}

module.exports = SubdomainService;
