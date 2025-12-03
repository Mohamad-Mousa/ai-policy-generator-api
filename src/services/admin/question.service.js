const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const BodyValidationService = require("../core/body_validation.service");
const CustomError = require("../core/custom_error.service");
const { enums } = require("../../models/model-template");

class QuestionService extends BaseService {
  constructor() {
    super();
    this.Question = this.models.Question;
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
      ...(req_query.isActive !== undefined && {
        isActive: req_query.isActive === "true",
      }),
      ...(req_query.domain && {
        domain: this.ObjectId(req_query.domain),
      }),
      ...(req_query.type &&
        enums.questionTypes.includes(req_query.type) && {
          type: req_query.type,
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
                  { question: { $regex: new RegExp(regexSearch, "i") } },
                  { "domain.title": { $regex: new RegExp(regexSearch, "i") } },
                ],
              },
            },
          ]
        : [];

    let result = await this.Question.aggregate([
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
    if (!id) throw new CustomError("Question ID is required", 400);

    const question = await this.Question.aggregate([
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
    ]);

    if (!question || question.length === 0)
      throw new CustomError("Question not found", 404);

    return { question: question[0] };
  }

  async create(body) {
    this.bodyValidationService.validateRequiredFields(body, [
      "question",
      "domain",
      "type",
    ]);

    if (!enums.questionTypes.includes(body.type))
      throw new CustomError("Invalid question type", 400);

    const domain = await this.Domain.findOne({
      _id: this.ObjectId(body.domain),
      isDeleted: false,
    });

    if (!domain) throw new CustomError("Domain not found", 404);

    if (body.type === "radio" || body.type === "checkbox") {
      this.bodyValidationService.validateRequiredFields(body, ["answers"]);
      if (!Array.isArray(body.answers) || body.answers.length === 0)
        throw new CustomError("Answers must be a non-empty array", 400);
    }

    if (body.type === "number") {
      this.bodyValidationService.validateRequiredFields(body, ["min", "max"]);
      this.bodyValidationService.validateFieldTypes(body, {
        min: "number",
        max: "number",
      });
      if (body.min >= body.max)
        throw new CustomError("Min must be less than max", 400);
    }

    if (body.type === "text") {
      if (body.answers !== undefined)
        throw new CustomError("Text type questions cannot have answers", 400);
      if (body.min !== undefined || body.max !== undefined)
        throw new CustomError("Text type questions cannot have min/max", 400);
    }

    const question = await this.Question({
      question: body.question,
      domain: this.ObjectId(body.domain),
      type: body.type,
      ...(body.isActive !== undefined && {
        isActive: body.isActive === "true" ? true : false,
      }),
      ...(body.type === "radio" && { answers: body.answers }),
      ...(body.type === "checkbox" && { answers: body.answers }),
      ...(body.type === "number" && { min: body.min, max: body.max }),
    }).save();

    return question;
  }

  async update(body) {
    const question = await this.Question.findOne({
      _id: this.ObjectId(body._id),
      isDeleted: false,
    });

    if (!question) throw new CustomError("Question not found", 404);

    if (body.domain) {
      const domain = await this.Domain.findOne({
        _id: this.ObjectId(body.domain),
        isDeleted: false,
      });

      if (!domain) throw new CustomError("Domain not found", 404);
    }

    const newType = body.type || question.type;
    if (body.type) {
      if (!enums.questionTypes.includes(body.type))
        throw new CustomError("Invalid question type", 400);
    }

    const validationType = body.type || question.type;
    const isTypeChanging = body.type && body.type !== question.type;

    if (validationType === "radio" || validationType === "checkbox") {
      if (isTypeChanging || body.answers !== undefined) {
        this.bodyValidationService.validateRequiredFields(body, ["answers"]);
        if (!Array.isArray(body.answers) || body.answers.length === 0)
          throw new CustomError("Answers must be a non-empty array", 400);
      }
    }

    if (validationType === "number") {
      if (isTypeChanging || body.min !== undefined || body.max !== undefined) {
        this.bodyValidationService.validateRequiredFields(body, ["min", "max"]);
        this.bodyValidationService.validateFieldTypes(body, {
          min: "number",
          max: "number",
        });
        if (body.min >= body.max)
          throw new CustomError("Min must be less than max", 400);
      }
    }

    if (validationType === "text") {
      if (body.answers !== undefined)
        throw new CustomError("Text type questions cannot have answers", 400);
      if (body.min !== undefined || body.max !== undefined)
        throw new CustomError("Text type questions cannot have min/max", 400);
    }

    const updateData = {
      ...(body.question && { question: body.question }),
      ...(body.domain && { domain: this.ObjectId(body.domain) }),
      ...(body.isActive !== undefined && {
        isActive: body.isActive == "true" ? true : false,
      }),
      ...(body.type && { type: body.type }),
    };

    const unsetData = {};

    if (newType === "radio" || newType === "checkbox") {
      if (body.answers !== undefined) {
        updateData.answers = body.answers;
      }
      if (isTypeChanging) {
        unsetData.min = "";
        unsetData.max = "";
      }
    } else if (newType === "number") {
      if (body.min !== undefined && body.max !== undefined) {
        updateData.min = body.min;
        updateData.max = body.max;
      }
      if (isTypeChanging) {
        unsetData.answers = "";
      }
    } else if (newType === "text") {
      if (isTypeChanging) {
        unsetData.answers = "";
        unsetData.min = "";
        unsetData.max = "";
      }
    }

    const finalUpdate = {};
    if (Object.keys(updateData).length > 0) {
      finalUpdate.$set = updateData;
    }
    if (Object.keys(unsetData).length > 0) {
      finalUpdate.$unset = unsetData;
    }

    await this.Question.updateOne({ _id: body._id }, finalUpdate);

    return await this.Question.findOne({ _id: body._id });
  }

  async delete(ids) {
    ids = ids.split(",");
    await this.Question.updateMany({ _id: { $in: ids } }, { isDeleted: true });
  }
}

module.exports = QuestionService;
