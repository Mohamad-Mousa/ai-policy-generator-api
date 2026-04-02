const BaseService = require("../core/base.service");
const StringFormatter = require("../core/string_formatter");
const BodyValidationService = require("../core/body_validation.service");
const CustomError = require("../core/custom_error.service");
const { enums } = require("../../models/model-template");

class QuestionAnswerNormalizer {
  static normalizeRadioAnswers(bodyAnswers) {
    if (!Array.isArray(bodyAnswers) || bodyAnswers.length === 0) {
      throw new CustomError("Answers must be a non-empty array", 400);
    }
    if (bodyAnswers.length > 5) {
      throw new CustomError(
        "Radio type allows at most 5 options (scores 1–5)",
        400
      );
    }
    const normalized = [];
    const scores = new Set();
    for (let i = 0; i < bodyAnswers.length; i++) {
      const item = bodyAnswers[i];
      let text;
      let score;
      if (typeof item === "string") {
        text = item.trim();
        if (!text) {
          throw new CustomError(
            `Radio answer at index ${i} cannot be empty`,
            400
          );
        }
        score = i + 1;
      } else if (item && typeof item === "object") {
        text = (item.text ?? item.label ?? "").toString().trim();
        score = Number(item.score);
        if (!text) {
          throw new CustomError(
            `Radio answer at index ${i} must include non-empty text`,
            400
          );
        }
        if (!Number.isInteger(score) || score < 1 || score > 5) {
          throw new CustomError(
            `Radio answer at index ${i} must have integer score between 1 and 5`,
            400
          );
        }
      } else {
        throw new CustomError(
          `Radio answer at index ${i} must be a string or { text, score }`,
          400
        );
      }
      if (scores.has(score)) {
        throw new CustomError(
          "Radio answers must have unique scores from 1 to 5",
          400
        );
      }
      scores.add(score);
      normalized.push({ text, score });
    }
    normalized.sort((a, b) => a.score - b.score);
    return normalized;
  }

  static normalizeCheckboxAnswers(bodyAnswers) {
    if (!Array.isArray(bodyAnswers) || bodyAnswers.length === 0) {
      throw new CustomError("Answers must be a non-empty array", 400);
    }
    return bodyAnswers.map((item, i) => {
      if (typeof item === "string") {
        const t = item.trim();
        if (!t) {
          throw new CustomError(
            `Checkbox answer at index ${i} cannot be empty`,
            400
          );
        }
        return { text: t };
      }
      if (item && typeof item === "object" && item.text != null) {
        const t = String(item.text).trim();
        if (!t) {
          throw new CustomError(
            `Checkbox answer at index ${i} must include non-empty text`,
            400
          );
        }
        return { text: t };
      }
      throw new CustomError(
        `Checkbox answer at index ${i} must be a string or { text }`,
        400
      );
    });
  }
}

const SUBDOMAIN_LOOKUP_PIPELINE = [
  {
    $lookup: {
      from: "subdomains",
      let: { sid: "$subdomain" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$_id", "$$sid"] },
                { $eq: ["$isDeleted", false] },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "domains",
            let: { did: "$domain" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$did"] },
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
            as: "domainArr",
          },
        },
        {
          $addFields: {
            domain: { $arrayElemAt: ["$domainArr", 0] },
          },
        },
        { $project: { domainArr: 0 } },
        {
          $project: {
            _id: 1,
            title: 1,
            isActive: 1,
            domain: 1,
          },
        },
      ],
      as: "subdomain",
    },
  },
  { $unwind: { path: "$subdomain", preserveNullAndEmptyArrays: true } },
  { $match: { subdomain: { $ne: null } } },
  { $match: { "subdomain.domain": { $ne: null } } },
];

class QuestionService extends BaseService {
  constructor() {
    super();
    this.Question = this.models.Question;
    this.Domain = this.models.Domain;
    this.Subdomain = this.models.Subdomain;
    this.bodyValidationService = BodyValidationService;
  }

  async assertSubdomainUsable(subdomainId) {
    const subdomain = await this.Subdomain.findOne({
      _id: this.ObjectId(subdomainId),
      isDeleted: false,
      isActive: true,
    });

    if (!subdomain) {
      throw new CustomError(
        "Subdomain not found, inactive, or deleted",
        400
      );
    }

    const domain = await this.Domain.findOne({
      _id: subdomain.domain,
      isDeleted: false,
      isActive: true,
    });

    if (!domain) {
      throw new CustomError(
        "Subdomain's domain is missing, inactive, or deleted",
        400
      );
    }

    return { subdomain, domain };
  }

  async findMany(req_query, limit = 10) {
    if (req_query.limit) limit = +req_query.limit;

    if (req_query.subdomain) {
      if (!this.mongoose.Types.ObjectId.isValid(req_query.subdomain)) {
        throw new CustomError("Invalid subdomain id", 400);
      }
    }

    if (req_query.domain) {
      const domainParts = req_query.domain.includes(",")
        ? req_query.domain.split(",").map((id) => id.trim())
        : [req_query.domain.trim()];
      for (const id of domainParts) {
        if (!this.mongoose.Types.ObjectId.isValid(id)) {
          throw new CustomError("Invalid domain id", 400);
        }
      }
    }

    const query = {
      isDeleted: false,
      ...(req_query.isActive !== undefined && {
        isActive: req_query.isActive === "true",
      }),
      ...(req_query.type &&
        enums.questionTypes.includes(req_query.type) && {
          type: req_query.type,
        }),
    };

    if (req_query.subdomain) {
      query.subdomain = this.ObjectId(req_query.subdomain);
    } else if (req_query.domain) {
      const domainIds = req_query.domain.includes(",")
        ? req_query.domain
            .split(",")
            .map((id) => this.ObjectId(id.trim()))
        : [this.ObjectId(req_query.domain.trim())];
      const subIds = await this.Subdomain.find({
        domain: { $in: domainIds },
        isDeleted: false,
      }).distinct("_id");
      query.subdomain = { $in: subIds };
    }

    const regexSearch = req_query.term
      ? StringFormatter.escapeBackslashAndPlus(req_query.term)
      : "";

    const pipes = [];
    if (req_query.sortBy) {
      let dir = 1;
      if (req_query.sortDirection == "desc") dir = -1;
      const key = req_query.sortBy;
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
                  {
                    "subdomain.title": {
                      $regex: new RegExp(regexSearch, "i"),
                    },
                  },
                  {
                    "subdomain.domain.title": {
                      $regex: new RegExp(regexSearch, "i"),
                    },
                  },
                  {
                    "answers.text": {
                      $regex: new RegExp(regexSearch, "i"),
                    },
                  },
                ],
              },
            },
          ]
        : [];

    const result = await this.Question.aggregate([
      { $match: query },
      ...SUBDOMAIN_LOOKUP_PIPELINE,
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
    const data = result[0].data;
    const totalCount = result[0].totalCount[0]
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
      ...SUBDOMAIN_LOOKUP_PIPELINE,
    ]);

    if (!question || question.length === 0)
      throw new CustomError("Question not found", 404);

    return { question: question[0] };
  }

  async create(body) {
    this.bodyValidationService.validateRequiredFields(body, [
      "question",
      "subdomain",
      "type",
    ]);

    if (!enums.questionTypes.includes(body.type))
      throw new CustomError("Invalid question type", 400);

    await this.assertSubdomainUsable(body.subdomain);

    if (body.type === "radio") {
      this.bodyValidationService.validateRequiredFields(body, ["answers"]);
    }
    if (body.type === "checkbox") {
      this.bodyValidationService.validateRequiredFields(body, ["answers"]);
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

    let answersForSave;
    if (body.type === "radio") {
      answersForSave = QuestionAnswerNormalizer.normalizeRadioAnswers(
        body.answers
      );
    } else if (body.type === "checkbox") {
      answersForSave = QuestionAnswerNormalizer.normalizeCheckboxAnswers(
        body.answers
      );
    }

    const question = await this.Question({
      question: body.question,
      subdomain: this.ObjectId(body.subdomain),
      type: body.type,
      ...(body.isActive !== undefined && {
        isActive: body.isActive === "true" ? true : false,
      }),
      ...(body.type === "radio" && { answers: answersForSave }),
      ...(body.type === "checkbox" && { answers: answersForSave }),
      ...(body.type === "number" && { min: body.min, max: body.max }),
    }).save();

    return await this.Question.findOne({ _id: question._id }).populate({
      path: "subdomain",
      select: "title isActive domain",
      populate: {
        path: "domain",
        select: "title description icon subDomains isActive isDeleted",
      },
    });
  }

  async update(body) {
    const question = await this.Question.findOne({
      _id: this.ObjectId(body._id),
      isDeleted: false,
    });

    if (!question) throw new CustomError("Question not found", 404);

    if (body.subdomain !== undefined) {
      await this.assertSubdomainUsable(body.subdomain);
    }

    const newType = body.type || question.type;
    if (body.type) {
      if (!enums.questionTypes.includes(body.type))
        throw new CustomError("Invalid question type", 400);
    }

    const validationType = body.type || question.type;
    const isTypeChanging = body.type && body.type !== question.type;

    if (validationType === "radio") {
      if (isTypeChanging || body.answers !== undefined) {
        this.bodyValidationService.validateRequiredFields(body, ["answers"]);
      }
    }
    if (validationType === "checkbox") {
      if (isTypeChanging || body.answers !== undefined) {
        this.bodyValidationService.validateRequiredFields(body, ["answers"]);
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
      ...(body.subdomain && { subdomain: this.ObjectId(body.subdomain) }),
      ...(body.isActive !== undefined && {
        isActive: body.isActive == "true" ? true : false,
      }),
      ...(body.type && { type: body.type }),
    };

    const unsetData = {};

    if (newType === "radio") {
      if (body.answers !== undefined) {
        updateData.answers = QuestionAnswerNormalizer.normalizeRadioAnswers(
          body.answers
        );
      }
      if (isTypeChanging) {
        unsetData.min = "";
        unsetData.max = "";
      }
    } else if (newType === "checkbox") {
      if (body.answers !== undefined) {
        updateData.answers = QuestionAnswerNormalizer.normalizeCheckboxAnswers(
          body.answers
        );
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

    return await this.Question.findOne({ _id: body._id }).populate({
      path: "subdomain",
      select: "title isActive domain",
      populate: {
        path: "domain",
        select: "title description icon subDomains isActive isDeleted",
      },
    });
  }

  async delete(ids) {
    ids = ids.split(",");
    await this.Question.updateMany({ _id: { $in: ids } }, { isDeleted: true });
  }
}

module.exports = QuestionService;
