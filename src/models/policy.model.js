const { mongoose, ObjectId } = require("./model-template");
const enums = require("../config/enums");

const policySchema = new mongoose.Schema(
  {
    domains: [
      {
        type: ObjectId,
        ref: "Domain",
        required: true,
      },
    ],
    source: {
      type: String,
      required: true,
      enum: ["assessment", "initiative"],
      default: "assessment",
    },
    assessments: [
      {
        type: ObjectId,
        ref: "Assessment",
        required: true,
      },
    ],
    sector: {
      type: String,
      required: true,
      enum: enums.sectors,
    },
    organizationSize: {
      type: String,
      required: true,
      enum: enums.organizationSizes,
    },
    riskAppetite: {
      type: String,
      required: true,
      enum: enums.riskAppetites,
    },
    implementationTimeline: {
      type: String,
      required: true,
      enum: enums.implementationTimelines,
    },
    analysisType: {
      type: String,
      required: true,
      enum: enums.analysisTypes,
    },
    analysis: {
      overallReadiness: {
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
        level: {
          type: String,
          enum: ["Low", "Medium", "High"],
        },
        summary: {
          type: String,
        },
        confidenceLevel: {
          type: String,
          enum: ["High", "Medium", "Low"],
        },
      },
      domainAssessments: [
        {
          domainId: {
            type: String,
          },
          domainTitle: {
            type: String,
          },
          readinessScore: {
            type: Number,
            min: 0,
            max: 100,
          },
          strengths: [
            {
              finding: {
                type: String,
              },
              evidence: {
                type: String,
              },
            },
          ],
          weaknesses: [
            {
              finding: {
                type: String,
              },
              impact: {
                type: String,
                enum: ["High", "Medium", "Low"],
              },
              evidence: {
                type: String,
              },
            },
          ],
          recommendations: [
            {
              priority: {
                type: String,
                enum: ["High", "Medium", "Low"],
              },
              action: {
                type: String,
              },
              timeline: {
                type: String,
              },
              resourcesNeeded: {
                type: String,
              },
              expectedImpact: {
                type: String,
              },
            },
          ],
          priorityLevel: {
            type: String,
            enum: ["High", "Medium", "Low"],
          },
          detailedAnalysis: {
            type: String,
          },
        },
      ],
      crossCuttingThemes: [
        {
          theme: {
            type: String,
          },
          description: {
            type: String,
          },
          affectedDomains: [
            {
              type: String,
            },
          ],
        },
      ],
      keyFindings: [
        {
          type: String,
        },
      ],
      riskFactors: [
        {
          risk: {
            type: String,
          },
          severity: {
            type: String,
            enum: ["High", "Medium", "Low"],
          },
          mitigationStrategy: {
            type: String,
          },
        },
      ],
      nextSteps: [
        {
          step: {
            type: String,
          },
          priority: {
            type: String,
            enum: ["High", "Medium", "Low"],
          },
          owner: {
            type: String,
          },
          timeline: {
            type: String,
          },
        },
      ],
    },
    analysisMetadata: {
      totalDomains: {
        type: Number,
      },
      totalAssessments: {
        type: Number,
      },
      totalQuestions: {
        type: Number,
      },
      model: {
        type: String,
      },
      tokensUsed: {
        type: Number,
      },
      tokensInput: {
        type: Number,
      },
      thinkingUsed: {
        type: Boolean,
      },
      analysisStrategy: {
        type: String,
        enum: ["full-analysis", "domain-by-domain"],
      },
      analyzedAt: {
        type: Date,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

policySchema.index({ createdAt: -1 });
policySchema.index({ sector: 1 });
policySchema.index({ organizationSize: 1 });
policySchema.index({ riskAppetite: 1 });
policySchema.index({ implementationTimeline: 1 });
policySchema.index({ domains: 1 });
policySchema.index({ assessments: 1 });
policySchema.index({ isDeleted: 1 });
policySchema.index({ isDeleted: 1, createdAt: -1 });
policySchema.index({ isDeleted: 1, sector: 1 });
policySchema.index({ isDeleted: 1, organizationSize: 1 });
policySchema.index({ isDeleted: 1, riskAppetite: 1 });
policySchema.index({ isDeleted: 1, implementationTimeline: 1 });
policySchema.index({ isDeleted: 1, domains: 1 });
policySchema.index({ isDeleted: 1, assessments: 1 });
policySchema.index({ isDeleted: 1, sector: 1, createdAt: -1 });
policySchema.index({ isDeleted: 1, organizationSize: 1, createdAt: -1 });
policySchema.index({ isDeleted: 1, riskAppetite: 1, createdAt: -1 });
policySchema.index({ isDeleted: 1, implementationTimeline: 1, createdAt: -1 });
policySchema.index({ isDeleted: 1, domains: 1, createdAt: -1 });
policySchema.index({ isDeleted: 1, assessments: 1, createdAt: -1 });
// Index for findOne query optimization
policySchema.index({ _id: 1, isDeleted: 1 });
policySchema.index({ sector: 1, organizationSize: 1, riskAppetite: 1 });
policySchema.index({ createdAt: -1, sector: 1 });
policySchema.index({ sector: 1, createdAt: -1 });
policySchema.index({ organizationSize: 1, createdAt: -1 });
policySchema.index({ riskAppetite: 1, createdAt: -1 });
policySchema.index({ implementationTimeline: 1, createdAt: -1 });
policySchema.index({ domains: 1, createdAt: -1 });
policySchema.index({ assessments: 1, createdAt: -1 });

const Policy = mongoose.model("Policy", policySchema);

module.exports = Policy;
