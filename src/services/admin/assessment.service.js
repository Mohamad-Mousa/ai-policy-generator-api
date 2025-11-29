const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const BodyValidationService = require("../core/body_validation.service");
const CustomError = require("../core/custom_error.service");

class AssessmentService extends BaseService {
  constructor() {
    super();
    this.Assessment = this.models.Assessment;
    this.Domain = this.models.Domain;
    this.Question = this.models.Question;
    this.bodyValidationService = BodyValidationService;
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = +req_query.limit;
    let regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";

    let query = {
      isDeleted: false,
      ...(req_query.isActive &&
        req_query.isActive !== undefined && {
          isActive: req_query.isActive === "true",
        }),
      ...(req_query.domain && {
        domain: this.ObjectId(req_query.domain),
      }),
      ...(req_query.status && {
        status: req_query.status,
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
                  { title: { $regex: new RegExp(regexSearch, "i") } },
                  { description: { $regex: new RegExp(regexSearch, "i") } },
                  { fullName: { $regex: new RegExp(regexSearch, "i") } },
                  { "domain.title": { $regex: new RegExp(regexSearch, "i") } },
                ],
              },
            },
          ]
        : [];

    let result = await this.Assessment.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "domains",
          let: { domainId: "$domain" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$domainId"] },
                    { $eq: ["$isActive", true] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
              },
            },
          ],
          as: "domain",
        },
      },
      { $unwind: { path: "$domain", preserveNullAndEmptyArrays: true } },
      { $match: { domain: { $ne: null } } },
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

  async findOne(id) {
    const assessment = await this.Assessment.aggregate([
      {
        $match: {
          _id: this.ObjectId(id),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "domains",
          let: { domainId: "$domain" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$domainId"] },
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
          as: "domain",
        },
      },
      {
        $unwind: {
          path: "$domain",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { domain: { $ne: null } },
      },
      {
        $lookup: {
          from: "questions",
          let: { questionIds: "$questions.question" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$questionIds"] },
                    { $eq: ["$isDeleted", false] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                question: 1,
                domain: 1,
                isActive: 1,
              },
            },
          ],
          as: "questionDetails",
        },
      },
    ]);

    if (!assessment || assessment.length === 0)
      throw new CustomError("Assessment not found", 404);

    return { assessment: assessment[0] };
  }

  async create(body) {
    const status = body.status || "draft";

    if (status === "draft") {
      this.bodyValidationService.validateRequiredFields(body, ["title"]);
    } else {
      this.bodyValidationService.validateRequiredFields(body, [
        "domain",
        "title",
        "description",
        "fullName",
      ]);
    }

    if (body.domain) {
      const domain = await this.Domain.findOne({
        _id: this.ObjectId(body.domain),
        isDeleted: false,
      });

      if (!domain) throw new CustomError("Domain not found", 404);
    }

    if (body.questions && body.questions.length > 0) {
      const questionIds = body.questions.map((q) => this.ObjectId(q.question));
      const questionsCount = await this.Question.countDocuments({
        _id: { $in: questionIds },
        isDeleted: false,
      });

      if (questionsCount !== questionIds.length)
        throw new CustomError("One or more questions not found", 404);
    }

    const assessment = await this.Assessment({
      ...(body.domain && { domain: this.ObjectId(body.domain) }),
      questions:
        body.questions && body.questions.length > 0
          ? body.questions.map((q) => ({
              question: this.ObjectId(q.question),
              answer: q.answer,
            }))
          : [],
      title: body.title,
      ...(body.description && { description: body.description }),
      ...(body.fullName && { fullName: body.fullName }),
      status: status,
      ...(body.isActive !== undefined && {
        isActive: body.isActive === "true" ? true : false,
      }),
    }).save();

    return assessment;
  }

  async update(body) {
    const assessment = await this.Assessment.findOne({
      _id: this.ObjectId(body._id),
      isDeleted: false,
    });

    if (!assessment) throw new CustomError("Assessment not found", 404);

    const status = body.status !== undefined ? body.status : assessment.status;

    if (status === "completed") {
      const updateData = {
        ...(body.domain && { domain: this.ObjectId(body.domain) }),
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.fullName && { fullName: body.fullName }),
      };

      const finalDomain = body.domain || assessment.domain;
      const finalTitle = body.title || assessment.title;
      const finalDescription = body.description || assessment.description;
      const finalFullName = body.fullName || assessment.fullName;

      if (!finalDomain || !finalTitle || !finalDescription || !finalFullName) {
        throw new CustomError(
          "All fields (domain, title, description, fullName) are required for completed assessments",
          400
        );
      }
    } else if (status === "draft") {
      if (body.title === undefined && !assessment.title) {
        throw new CustomError("Title is required", 400);
      }
    }

    if (body.domain) {
      const domain = await this.Domain.findOne({
        _id: this.ObjectId(body.domain),
        isDeleted: false,
      });

      if (!domain) throw new CustomError("Domain not found", 404);
    }

    let questionsUpdate;
    if (body.questions) {
      const questionIds = body.questions.map((q) => this.ObjectId(q.question));
      const questionsCount = await this.Question.countDocuments({
        _id: { $in: questionIds },
        isDeleted: false,
      });

      if (questionsCount !== questionIds.length)
        throw new CustomError("One or more questions not found", 404);

      questionsUpdate = body.questions.map((q) => ({
        question: this.ObjectId(q.question),
        answer: q.answer,
      }));
    }

    await this.Assessment.updateOne(
      { _id: body._id },
      {
        ...(body.domain && { domain: this.ObjectId(body.domain) }),
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.isActive !== undefined && {
          isActive: body.isActive == "true" ? true : false,
        }),
        ...(questionsUpdate !== undefined && { questions: questionsUpdate }),
      }
    );

    return await this.Assessment.findOne({ _id: body._id });
  }

  async delete(ids) {
    ids = ids.split(",");
    await this.Assessment.updateMany(
      { _id: { $in: ids } },
      { isDeleted: true }
    );
  }
}

module.exports = AssessmentService;
