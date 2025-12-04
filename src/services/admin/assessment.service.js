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

  async validateAnswer(question, answer) {
    if (!question) {
      throw new CustomError("Question not found", 404);
    }

    if (answer === undefined || answer === null || answer === "") {
      throw new CustomError(
        `Answer is required for question: ${question.question}`,
        400
      );
    }

    switch (question.type) {
      case "text":
        if (typeof answer !== "string") {
          throw new CustomError(
            `Answer must be a string for text type question: ${question.question}`,
            400
          );
        }
        break;

      case "radio":
        if (typeof answer !== "string") {
          throw new CustomError(
            `Answer must be a string for radio type question: ${question.question}`,
            400
          );
        }
        if (!question.answers || !Array.isArray(question.answers)) {
          throw new CustomError(
            `Question "${question.question}" is missing valid answer options`,
            400
          );
        }
        if (!question.answers.includes(answer)) {
          throw new CustomError(
            `Answer "${answer}" is not a valid option for question "${
              question.question
            }". Valid options: ${question.answers.join(", ")}`,
            400
          );
        }
        break;

      case "checkbox":
        if (!Array.isArray(answer)) {
          throw new CustomError(
            `Answer must be an array for checkbox type question: ${question.question}`,
            400
          );
        }
        if (answer.length === 0) {
          throw new CustomError(
            `At least one answer is required for checkbox type question: ${question.question}`,
            400
          );
        }
        if (!question.answers || !Array.isArray(question.answers)) {
          throw new CustomError(
            `Question "${question.question}" is missing valid answer options`,
            400
          );
        }
        const invalidAnswers = answer.filter(
          (a) => !question.answers.includes(a)
        );
        if (invalidAnswers.length > 0) {
          throw new CustomError(
            `Invalid answer(s) "${invalidAnswers.join(", ")}" for question "${
              question.question
            }". Valid options: ${question.answers.join(", ")}`,
            400
          );
        }
        break;

      case "number":
        const numAnswer =
          typeof answer === "string" ? parseFloat(answer) : answer;
        if (isNaN(numAnswer) || typeof numAnswer !== "number") {
          throw new CustomError(
            `Answer must be a number for number type question: ${question.question}`,
            400
          );
        }
        if (question.min !== undefined && numAnswer < question.min) {
          throw new CustomError(
            `Answer ${numAnswer} is less than minimum value ${question.min} for question "${question.question}"`,
            400
          );
        }
        if (question.max !== undefined && numAnswer > question.max) {
          throw new CustomError(
            `Answer ${numAnswer} is greater than maximum value ${question.max} for question "${question.question}"`,
            400
          );
        }
        break;

      default:
        throw new CustomError(`Unknown question type: ${question.type}`, 400);
    }

    return true;
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
        domain: req_query.domain.includes(",")
          ? {
              $in: req_query.domain
                .split(",")
                .map((id) => this.ObjectId(id.trim())),
            }
          : this.ObjectId(req_query.domain),
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

    let domain = null;
    if (body.domain) {
      domain = await this.Domain.findOne({
        _id: this.ObjectId(body.domain),
        isDeleted: false,
      });

      if (!domain) throw new CustomError("Domain not found", 404);
    }

    let questionsData = [];
    if (body.questions && body.questions.length > 0) {
      for (const qa of body.questions) {
        const questionQuery = { isDeleted: false };

        if (this.mongoose.Types.ObjectId.isValid(qa.question)) {
          questionQuery._id = this.ObjectId(qa.question);
        } else {
          questionQuery.question = qa.question;
          if (domain) {
            questionQuery.domain = domain._id;
          }
        }

        const question = await this.Question.findOne(questionQuery);

        if (!question) {
          throw new CustomError(`Question not found: ${qa.question}`, 404);
        }

        await this.validateAnswer(question, qa.answer);

        questionsData.push({
          question: question.question,
          questionRef: question._id,
          answer: qa.answer,
        });
      }
    }

    const assessment = await this.Assessment({
      ...(body.domain && { domain: this.ObjectId(body.domain) }),
      questions: questionsData,
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

    if (assessment.status === "completed") {
      throw new CustomError("Completed assessments cannot be updated", 400);
    }

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

    let domain = null;
    if (body.domain) {
      domain = await this.Domain.findOne({
        _id: this.ObjectId(body.domain),
        isDeleted: false,
      });

      if (!domain) throw new CustomError("Domain not found", 404);
    }

    let questionsUpdate;
    if (body.questions) {
      questionsUpdate = [];

      for (const qa of body.questions) {
        const questionQuery = { isDeleted: false };

        if (this.mongoose.Types.ObjectId.isValid(qa.question)) {
          questionQuery._id = this.ObjectId(qa.question);
        } else {
          questionQuery.question = qa.question;
          if (domain) {
            questionQuery.domain = domain._id;
          }
        }

        const question = await this.Question.findOne(questionQuery);

        if (!question) {
          throw new CustomError(`Question not found: ${qa.question}`, 404);
        }

        await this.validateAnswer(question, qa.answer);

        questionsUpdate.push({
          question: question.question,
          questionRef: question._id,
          answer: qa.answer,
        });
      }
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

  async import(file) {
    const XLSX = require("xlsx");
    const fs = require("fs");

    if (!file) {
      throw new CustomError("File not provided", 400);
    }

    let workbook;

    if (file.buffer) {
      workbook = XLSX.read(file.buffer, { type: "buffer" });
    } else if (file.path) {
      if (!fs.existsSync(file.path)) {
        throw new CustomError("File not found", 404);
      }
      workbook = XLSX.readFile(file.path);
    } else {
      throw new CustomError("Invalid file object", 400);
    }

    let sheetName = workbook.SheetNames.find(
      (name) => name.toLowerCase() === "template"
    );

    if (!sheetName) {
      sheetName = workbook.SheetNames[0];
    }

    if (!sheetName) {
      throw new CustomError("No sheets found in Excel file", 400);
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      throw new CustomError("Excel file is empty", 400);
    }

    const requiredColumns = ["Title", "Domain", "Question", "Answer"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(
      (col) => !firstRow.hasOwnProperty(col)
    );

    if (missingColumns.length > 0) {
      throw new CustomError(
        `Missing required columns: ${missingColumns.join(", ")}`,
        400
      );
    }

    const assessmentsMap = {};
    for (const row of data) {
      const title = row.Title?.toString().trim();
      if (!title) continue;

      if (!assessmentsMap[title]) {
        assessmentsMap[title] = {
          title: title,
          description: row.Description?.toString().trim() || "",
          fullName: row["Full Name"]?.toString().trim() || "",
          domain: row.Domain?.toString().trim(),
          questions: [],
        };
      }

      const question = row.Question?.toString().trim();
      const answer = row.Answer?.toString().trim() || "";

      if (question) {
        assessmentsMap[title].questions.push({
          question: question,
          answer: answer,
        });
      }
    }

    const results = {
      success: [],
      errors: [],
      total: Object.keys(assessmentsMap).length,
    };

    for (const [title, assessmentData] of Object.entries(assessmentsMap)) {
      try {
        let domain = null;
        if (assessmentData.domain) {
          const domainQuery = { isDeleted: false };
          if (this.mongoose.Types.ObjectId.isValid(assessmentData.domain)) {
            domainQuery._id = this.ObjectId(assessmentData.domain);
          } else {
            domainQuery.title = {
              $regex: new RegExp(
                `^${assessmentData.domain
                  .trim()
                  .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                "i"
              ),
            };
          }

          domain = await this.Domain.findOne(domainQuery);

          if (!domain) {
            results.errors.push({
              title: title,
              error: `Domain not found: ${assessmentData.domain}`,
            });
            continue;
          }
        }

        const questionsData = [];
        for (const qa of assessmentData.questions) {
          const questionQuery = { isDeleted: false };
          if (this.mongoose.Types.ObjectId.isValid(qa.question)) {
            questionQuery._id = this.ObjectId(qa.question);
          } else {
            questionQuery.question = qa.question;
            if (domain) {
              questionQuery.domain = domain._id;
            }
          }

          const question = await this.Question.findOne(questionQuery);

          if (!question) {
            results.errors.push({
              title: title,
              error: `Question not found: ${qa.question}${
                domain ? ` in domain "${domain.title}"` : ""
              }`,
            });
            continue;
          }

          if (domain && question.domain.toString() !== domain._id.toString()) {
            results.errors.push({
              title: title,
              error: `Question "${qa.question}" does not belong to domain "${domain.title}"`,
            });
            continue;
          }

          let parsedAnswer = qa.answer;
          if (question.type === "checkbox") {
            if (typeof qa.answer === "string") {
              parsedAnswer = qa.answer
                .split(",")
                .map((a) => a.trim())
                .filter((a) => a !== "");
            } else if (Array.isArray(qa.answer)) {
              parsedAnswer = qa.answer
                .map((a) => String(a).trim())
                .filter((a) => a !== "");
            }
          } else if (question.type === "number") {
            parsedAnswer =
              typeof qa.answer === "string" ? parseFloat(qa.answer) : qa.answer;
          }

          try {
            await this.validateAnswer(question, parsedAnswer);
          } catch (error) {
            results.errors.push({
              title: title,
              error: `Question "${question.question}": ${error.message}`,
            });
            continue;
          }

          questionsData.push({
            question: question.question,
            answer: parsedAnswer,
          });
        }

        const hasTitle =
          assessmentData.title && assessmentData.title.trim() !== "";
        const hasDescription =
          assessmentData.description &&
          assessmentData.description.trim() !== "";
        const hasFullName =
          assessmentData.fullName && assessmentData.fullName.trim() !== "";
        const hasDomain = domain !== null;
        const hasQuestions = questionsData.length > 0;
        const allQuestionsAnswered =
          hasQuestions &&
          questionsData.every((q) => {
            if (Array.isArray(q.answer)) {
              return (
                q.answer.length > 0 &&
                q.answer.every((a) => a && String(a).trim() !== "")
              );
            }
            return (
              q.answer !== undefined &&
              q.answer !== null &&
              String(q.answer).trim() !== ""
            );
          });

        const status =
          hasTitle &&
          hasDescription &&
          hasFullName &&
          hasDomain &&
          hasQuestions &&
          allQuestionsAnswered
            ? "completed"
            : "draft";

        const assessment = await this.Assessment({
          ...(domain && { domain: domain._id }),
          questions: questionsData,
          title: assessmentData.title,
          ...(assessmentData.description && {
            description: assessmentData.description,
          }),
          ...(assessmentData.fullName && { fullName: assessmentData.fullName }),
          status: status,
          isActive: true,
        }).save();

        results.success.push({
          title: title,
          id: assessment._id,
        });
      } catch (error) {
        results.errors.push({
          title: title,
          error: error.message || "Unknown error",
        });
      }
    }

    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }

    return results;
  }

  async generateExcelTemplate(domainId) {
    const XLSX = require("xlsx");

    if (!domainId) {
      throw new CustomError("Domain ID is required", 400);
    }

    if (!this.mongoose.Types.ObjectId.isValid(domainId)) {
      throw new CustomError("Invalid domain ID format", 400);
    }

    const domain = await this.Domain.findOne({
      _id: this.ObjectId(domainId),
      isDeleted: false,
      isActive: true,
    }).select("_id title");

    if (!domain) {
      throw new CustomError("Domain not found or inactive", 404);
    }

    const questions = await this.Question.find({
      domain: this.ObjectId(domainId),
      isDeleted: false,
      isActive: true,
    }).select("_id question type answers min max");

    if (questions.length === 0) {
      throw new CustomError("No active questions found for this domain", 404);
    }

    const templateData = questions.map((q, index) => {
      let answerHint = "";
      if (q.type === "text") {
        answerHint = "Enter text";
      } else if (q.type === "radio") {
        answerHint = `One of: ${q.answers ? q.answers.join(", ") : "N/A"}`;
      } else if (q.type === "checkbox") {
        answerHint = `Comma-separated values from: ${
          q.answers ? q.answers.join(", ") : "N/A"
        }`;
      } else if (q.type === "number") {
        answerHint = `Number between ${
          q.min !== undefined ? q.min : "N/A"
        } and ${q.max !== undefined ? q.max : "N/A"}`;
      }

      return {
        Title: "",
        Description: "",
        "Full Name": "",
        Domain: domain.title,
        Question: q.question,
        "Question Type": q.type,
        Answer: "",
        "Answer Format": answerHint,
      };
    });

    const workbook = XLSX.utils.book_new();

    const instructionsData = [
      [`ASSESSMENT IMPORT TEMPLATE - ${domain.title.toUpperCase()}`],
      [""],
      ["Column Descriptions:"],
      [
        "Title",
        "Required. Assessment title. Rows with same title are grouped into one assessment.",
      ],
      [
        "Domain",
        `Pre-filled. Domain: ${domain.title}. Do not change this value.`,
      ],
      ["Question", "Pre-filled. Question text. Do not change this value."],
      [
        "Question Type",
        "Pre-filled. Type of question (text, radio, checkbox, number). Do not change this value.",
      ],
      [
        "Answer Format",
        "Pre-filled. Format hint for the answer. Reference only, do not change.",
      ],
      [
        "Answer",
        "Required. Fill in the answer to each question. For checkbox questions, use comma-separated values (e.g., 'Option1, Option2').",
      ],
      [
        "Description",
        "Required for completed status. Assessment description (same for all rows with same Title).",
      ],
      [
        "Full Name",
        "Required for completed status. Full name of the person (same for all rows with same Title).",
      ],
      [""],
      ["How to Use:"],
      [
        "1. Fill in the 'Title' column - use the same title for all questions that belong to the same assessment",
      ],
      [
        "2. Fill in the 'Answer' column for each question",
        "   - For text questions: Enter any text",
        "   - For radio questions: Enter one of the valid options",
        "   - For checkbox questions: Enter comma-separated values (e.g., 'Option1, Option2')",
        "   - For number questions: Enter a number within the specified range",
      ],
      [
        "3. Fill 'Description' and 'Full Name' if you want the assessment to be marked as 'completed'",
      ],
      ["4. You can create multiple assessments by using different titles"],
      [
        "5. Do NOT change the 'Domain' or 'Question' columns - they are pre-filled correctly",
      ],
      [""],
      ["Automatic Status Determination:"],
      [
        "- Status will be automatically set to 'completed' if ALL required fields are filled:",
      ],
      ["  • Title (required)"],
      ["  • Description (required for completed)"],
      ["  • Full Name (required for completed)"],
      ["  • Domain (pre-filled)"],
      ["  • All Questions with Answers (required)"],
      ["- If any required field is missing, status will be set to 'draft'"],
      [""],
      ["Important Notes:"],
      [
        "- Multiple rows with the same Title will be grouped into one assessment",
      ],
      ["- Each row represents one question-answer pair"],
      [
        "- All questions in this template belong to the domain: " +
          domain.title,
      ],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    const templateSheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");

    const questionsReferenceData = questions.map((q) => ({
      "Question ID": q._id.toString(),
      "Question Text": q.question,
      "Question Type": q.type,
      "Valid Options": q.answers
        ? q.answers.join(", ")
        : q.type === "number"
        ? `${q.min || "N/A"} - ${q.max || "N/A"}`
        : "N/A",
      Domain: domain.title,
    }));

    const questionsSheet = XLSX.utils.json_to_sheet(questionsReferenceData);
    XLSX.utils.book_append_sheet(
      workbook,
      questionsSheet,
      "Questions Reference"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return buffer;
  }
}

module.exports = AssessmentService;
