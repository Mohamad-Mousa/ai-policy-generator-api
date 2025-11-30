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
