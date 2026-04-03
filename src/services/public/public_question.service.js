const BaseService = require("../core/base.service");
const CustomError = require("../core/custom_error.service");

/**
 * Read-only question listing for public clients (by one or more domains).
 * Query: domains=comma-separated ObjectIds.
 */
class PublicQuestionService extends BaseService {
  constructor() {
    super();
    this.Question = this.models.Question;
    this.Domain = this.models.Domain;
    this.Subdomain = this.models.Subdomain;
  }

  async _questionsForDomain(domainId) {
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
      return null;
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

  async findByDomains(domainsParam) {
    if (!domainsParam || String(domainsParam).trim() === "") {
      throw new CustomError("Query parameter domains is required", 400);
    }

    const rawIds = String(domainsParam)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!rawIds.length) {
      throw new CustomError("Query parameter domains is required", 400);
    }

    const uniqueIds = [...new Set(rawIds)];

    for (const id of uniqueIds) {
      if (!this.mongoose.Types.ObjectId.isValid(id)) {
        throw new CustomError(`Invalid domain id: ${id}`, 400);
      }
    }

    const items = [];
    let totalCount = 0;

    for (const domainId of uniqueIds) {
      const block = await this._questionsForDomain(domainId);
      if (!block) {
        throw new CustomError(
          `Domain not found or inactive: ${domainId}`,
          404,
        );
      }
      items.push(block);
      totalCount += block.totalCount;
    }

    return { items, totalCount };
  }
}

module.exports = PublicQuestionService;
