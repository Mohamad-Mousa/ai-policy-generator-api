const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const CustomError = require("../core/custom_error.service");
const BodyValidationService = require("../core/body_validation.service");
const enums = require("../../config/enums");

class PolicyService extends BaseService {
  constructor() {
    super();
    this.Policy = this.models.Policy;
    this.Domain = this.models.Domain;
    this.Assessment = this.models.Assessment;
    this.bodyValidationService = BodyValidationService;
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = +req_query.limit;
    let regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";

    let query = {
      isDeleted: false,
      ...(req_query.sector && {
        sector: req_query.sector,
      }),
      ...(req_query.organizationSize && {
        organizationSize: req_query.organizationSize,
      }),
      ...(req_query.riskAppetite && {
        riskAppetite: req_query.riskAppetite,
      }),
      ...(req_query.implementationTimeline && {
        implementationTimeline: req_query.implementationTimeline,
      }),
      ...(req_query.domain && {
        domains: req_query.domain.includes(",")
          ? {
              $in: req_query.domain
                .split(",")
                .map((id) => this.ObjectId(id.trim())),
            }
          : this.ObjectId(req_query.domain),
      }),
      ...(req_query.assessment && {
        assessments: req_query.assessment.includes(",")
          ? {
              $in: req_query.assessment
                .split(",")
                .map((id) => this.ObjectId(id.trim())),
            }
          : this.ObjectId(req_query.assessment),
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

    const termStage =
      req_query.term && regexSearch
        ? [
            {
              $match: {
                $or: [
                  { sector: { $regex: new RegExp(regexSearch, "i") } },
                  {
                    organizationSize: { $regex: new RegExp(regexSearch, "i") },
                  },
                  { riskAppetite: { $regex: new RegExp(regexSearch, "i") } },
                  {
                    implementationTimeline: {
                      $regex: new RegExp(regexSearch, "i"),
                    },
                  },
                  { "domains.title": { $regex: new RegExp(regexSearch, "i") } },
                ],
              },
            },
          ]
        : [];

    let result = await this.Policy.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "domains",
          let: { domainIds: "$domains" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$domainIds"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                icon: 1,
              },
            },
          ],
          as: "domains",
        },
      },
      {
        $lookup: {
          from: "assessments",
          let: { assessmentIds: "$assessments" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$assessmentIds"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                fullName: 1,
                status: 1,
              },
            },
          ],
          as: "assessments",
        },
      },
      ...termStage,
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

  async findOne(id, req_query = {}) {
    const assessmentLimit = req_query.assessmentLimit
      ? +req_query.assessmentLimit
      : 10;
    const assessmentPage = req_query.assessmentPage
      ? +req_query.assessmentPage
      : 1;
    const assessmentSkip = (assessmentPage - 1) * assessmentLimit;

    const policy = await this.Policy.aggregate([
      {
        $match: {
          _id: this.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $addFields: {
          originalAssessmentIds: "$assessments",
        },
      },
      {
        $lookup: {
          from: "domains",
          let: { domainIds: "$domains" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$domainIds"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                description: 1,
                icon: 1,
                subDomains: 1,
                isActive: 1,
              },
            },
          ],
          as: "domains",
        },
      },
      {
        $lookup: {
          from: "assessments",
          let: { assessmentIds: "$originalAssessmentIds" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$assessmentIds"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $facet: {
                totalCount: [{ $count: "total" }],
                data: [
                  {
                    $sort: { createdAt: -1 },
                  },
                  {
                    $skip: assessmentSkip,
                  },
                  {
                    $limit: assessmentLimit,
                  },
                  {
                    $project: {
                      _id: 1,
                      title: 1,
                      description: 1,
                      fullName: 1,
                      status: 1,
                      domain: 1,
                      questions: 1,
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$data",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$data.questions",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "questions",
                let: { questionId: "$data.questions.question" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$_id", "$$questionId"] },
                          { $eq: ["$isDeleted", false] },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      question: 1,
                    },
                  },
                ],
                as: "questionDetails",
              },
            },
            {
              $addFields: {
                "data.questions.question": {
                  $ifNull: [
                    { $arrayElemAt: ["$questionDetails.question", 0] },
                    "$data.questions.question",
                  ],
                },
              },
            },
            {
              $project: {
                questionDetails: 0,
              },
            },
            {
              $group: {
                _id: "$data._id",
                title: { $first: "$data.title" },
                description: { $first: "$data.description" },
                fullName: { $first: "$data.fullName" },
                status: { $first: "$data.status" },
                domain: { $first: "$data.domain" },
                questions: { $push: "$data.questions" },
                totalCount: { $first: "$totalCount" },
              },
            },
            {
              $group: {
                _id: null,
                assessments: {
                  $push: {
                    _id: "$_id",
                    title: "$title",
                    description: "$description",
                    fullName: "$fullName",
                    status: "$status",
                    domain: "$domain",
                    questions: "$questions",
                  },
                },
                totalCount: { $first: "$totalCount" },
              },
            },
            {
              $project: {
                _id: 0,
                assessments: {
                  $filter: {
                    input: "$assessments",
                    as: "assessment",
                    cond: { $ne: ["$$assessment._id", null] },
                  },
                },
                totalCount: {
                  $ifNull: [{ $arrayElemAt: ["$totalCount.total", 0] }, 0],
                },
              },
            },
          ],
          as: "assessmentResult",
        },
      },
      {
        $project: {
          originalAssessmentIds: 0,
        },
      },
    ]);

    if (!policy || policy.length === 0)
      throw new CustomError("Policy not found", 404);

    const result = policy[0];

    const assessmentResult =
      result.assessmentResult && result.assessmentResult.length > 0
        ? result.assessmentResult[0]
        : { assessments: [], totalCount: 0 };

    const { assessmentResult: _, ...policyData } = result;

    return {
      policy: {
        ...policyData,
        assessments: {
          data: assessmentResult.assessments || [],
          totalCount: assessmentResult.totalCount || 0,
          page: assessmentPage,
          limit: assessmentLimit,
        },
      },
    };
  }

  async create(body) {
    this.bodyValidationService.validateRequiredFields(body, [
      "domains",
      "assessments",
      "sector",
      "organizationSize",
      "riskAppetite",
      "implementationTimeline",
    ]);

    this.bodyValidationService.validateFieldTypes(body, {
      domains: "array",
      assessments: "array",
      sector: "string",
      organizationSize: "string",
      riskAppetite: "string",
      implementationTimeline: "string",
    });

    if (!Array.isArray(body.domains) || body.domains.length === 0) {
      throw new CustomError("domains must be a non-empty array", 400);
    }

    if (!Array.isArray(body.assessments) || body.assessments.length === 0) {
      throw new CustomError("assessments must be a non-empty array", 400);
    }

    if (!enums.sectors.includes(body.sector)) {
      throw new CustomError(
        `Invalid sector. Must be one of: ${enums.sectors.join(", ")}`,
        400
      );
    }

    if (!enums.organizationSizes.includes(body.organizationSize)) {
      throw new CustomError(
        `Invalid organizationSize. Must be one of: ${enums.organizationSizes.join(
          ", "
        )}`,
        400
      );
    }

    if (!enums.riskAppetites.includes(body.riskAppetite)) {
      throw new CustomError(
        `Invalid riskAppetite. Must be one of: ${enums.riskAppetites.join(
          ", "
        )}`,
        400
      );
    }

    if (!enums.implementationTimelines.includes(body.implementationTimeline)) {
      throw new CustomError(
        `Invalid implementationTimeline. Must be one of: ${enums.implementationTimelines.join(
          ", "
        )}`,
        400
      );
    }

    const domainIds = body.domains.map((id) => {
      if (!this.mongoose.Types.ObjectId.isValid(id)) {
        throw new CustomError(`Invalid domain ID: ${id}`, 400);
      }
      return this.ObjectId(id);
    });

    const assessmentIds = body.assessments.map((id) => {
      if (!this.mongoose.Types.ObjectId.isValid(id)) {
        throw new CustomError(`Invalid assessment ID: ${id}`, 400);
      }
      return this.ObjectId(id);
    });

    const validDomains = await this.Domain.find({
      _id: { $in: domainIds },
      isDeleted: false,
      isActive: true,
    }).select("_id");

    if (validDomains.length !== domainIds.length) {
      throw new CustomError(
        "One or more domains not found, inactive, or deleted",
        404
      );
    }

    const validAssessments = await this.Assessment.find({
      _id: { $in: assessmentIds },
      domain: { $in: domainIds },
      isDeleted: false,
      isActive: true,
    }).select("_id domain");

    if (validAssessments.length !== assessmentIds.length) {
      const allAssessments = await this.Assessment.find({
        _id: { $in: assessmentIds },
      }).select("_id domain isDeleted isActive");

      const validAssessmentIds = new Set(
        validAssessments.map((a) => a._id.toString())
      );
      const invalidAssessments = allAssessments.filter(
        (a) => !validAssessmentIds.has(a._id.toString())
      );

      const missingIds = assessmentIds.filter(
        (id) => !allAssessments.some((a) => a._id.toString() === id.toString())
      );

      if (missingIds.length > 0) {
        throw new CustomError(
          `One or more assessments not found: ${missingIds
            .map((id) => id.toString())
            .join(", ")}`,
          404
        );
      }

      const inactiveOrDeleted = invalidAssessments.filter(
        (a) => a.isDeleted || !a.isActive
      );
      const wrongDomain = invalidAssessments.filter(
        (a) =>
          a.isActive &&
          !a.isDeleted &&
          !domainIds.some((dId) => dId.toString() === a.domain?.toString())
      );

      if (inactiveOrDeleted.length > 0) {
        throw new CustomError(
          "One or more assessments are inactive or deleted",
          400
        );
      }
      if (wrongDomain.length > 0) {
        throw new CustomError(
          "One or more assessments do not belong to the provided domains",
          400
        );
      }

      throw new CustomError(
        "One or more assessments do not meet the required criteria",
        400
      );
    }

    const policy = await this.Policy({
      domains: domainIds,
      assessments: assessmentIds,
      sector: body.sector,
      organizationSize: body.organizationSize,
      riskAppetite: body.riskAppetite,
      implementationTimeline: body.implementationTimeline,
    }).save();

    return policy;
  }
}

module.exports = PolicyService;
