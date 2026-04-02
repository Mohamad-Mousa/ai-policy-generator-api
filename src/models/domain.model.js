const { mongoose } = require("./model-template");

const domainSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    predefinedAssessmentTitle: {
      type: String,
      trim: true,
    },
    icon: String,
    subDomains: [String],
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    /** Mean of assessment scoreAvg (1–5) for this domain; null if none */
    scoreAvg: {
      type: Number,
    },
    /** Mean of assessment scorePercentage for this domain; null if none */
    scorePercentage: {
      type: Number,
    },
  },
  { timestamps: true }
);

domainSchema.index({ isDeleted: 1, isActive: 1 });
domainSchema.index({ createdAt: -1 });
domainSchema.index({ title: 1 });
domainSchema.index({ isDeleted: 1 });
domainSchema.index({
  title: "text",
  description: "text",
  predefinedAssessmentTitle: "text",
});
// Additional indexes for assessment service queries
domainSchema.index({ _id: 1, isDeleted: 1, isActive: 1 }); // For $lookup and generateExcelTemplate
domainSchema.index({ title: 1, isDeleted: 1 }); // For import by title lookup
// Index for policy service $lookup queries (optimized for $in with isDeleted filter)
domainSchema.index({ _id: 1, isDeleted: 1 });

const Domain = mongoose.model("Domain", domainSchema);

module.exports = Domain;
