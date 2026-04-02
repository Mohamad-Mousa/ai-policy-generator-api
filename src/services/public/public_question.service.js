const BaseService = require("../core/base.service");
const CustomError = require("../core/custom_error.service");

/**
 * Read-only question listing for public clients (by domain).
 */
class PublicQuestionService extends BaseService {
  constructor() {
    super();
    this.Question = this.models.Question;
    this.Domain = this.models.Domain;
    this.Subdomain = this.models.Subdomain;
  }

  async findByDomain(domainId) {
    if (!domainId || String(domainId).trim() === "") {
      throw new CustomError("Query parameter domain is required", 400);
    }
    if (!this.mongoose.Types.ObjectId.isValid(domainId)) {
      throw new CustomError("Invalid domain id", 400);
    }

    const domain = await this.Domain.findOne({
      _id: this.ObjectId(domainId),
      isDeleted: false,
      isActive: true,
    })
      .select(
        "_id title description icon subDomains predefinedAssessmentTitle scoreAvg scorePercentage createdAt updatedAt",
      )
      .lean();

    if (!domain) {
      throw new CustomError("Domain not found or inactive", 404);
    }

    const subIds = await this.Subdomain.find({
      domain: domain._id,
      isDeleted: false,
      isActive: true,
    }).distinct("_id");

    if (!subIds.length) {
      return { domain, questions: [], totalCount: 0 };
    }

    const raw = await this.Question.find({
      subdomain: { $in: subIds },
      isDeleted: false,
      isActive: true,
    })
      .select("_id question type answers min max subdomain createdAt")
      .populate({
        path: "subdomain",
        match: { isDeleted: false, isActive: true },
        select: "_id title",
      })
      .sort({ createdAt: 1 })
      .lean();

    const questions = raw
      .filter((q) => q.subdomain)
      .map((q) => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        answers: q.answers,
        min: q.min,
        max: q.max,
        subdomain: {
          _id: q.subdomain._id,
          title: q.subdomain.title,
        },
      }));

    return {
      domain,
      questions,
      totalCount: questions.length,
    };
  }
}

module.exports = PublicQuestionService;
