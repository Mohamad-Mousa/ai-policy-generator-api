const { mongoose } = require("./model-template");

const initiativeSchema = new mongoose.Schema(
  {
    /** OECD API id; unique to prevent duplicate initiatives in DB */
    apiId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    englishName: String,
    originalName: String,
    slug: { type: String, trim: true },
    description: String,
    website: String,
    status: String,
    responsibleOrganisation: String,
    responsibleOrganisationSI: String,
    responsibleOrganisationSILocation: String,
    responsibleOrganisationSDLocation: String,
    category: String,
    extentBinding: String,
    joint: String,
    startYear: Number,
    endYear: Number,
    overview: String,
    actionPlan: String,
    budget: mongoose.Schema.Types.Mixed,
    budgetAvailable: mongoose.Schema.Types.Mixed,
    isEvaluated: mongoose.Schema.Types.Mixed,
    evaluationBy: String,
    otherEvaluationBy: String,
    evaluationUrls: [String],
    evaluationDescription: String,
    isEvaluationResultsPubliclyAvailable: Boolean,
    relevantUrls: [String],
    engagementDescription: String,
    hasMonitoringMechanism: mongoose.Schema.Types.Mixed,
    monitoringMechanismDescription: String,
    videoUrl: String,
    moreInfos: mongoose.Schema.Types.Mixed,
    trustworthyAIRelation: String,
    intergovernmentalCoordination: String,
    trustworthyAIMechanismDescription: String,
    otherEngagementMechanism: String,
    otherInitiativeType: String,
    createdByEmail: String,
    createdByName: String,
    updatedByEmail: String,
    updatedByName: String,
    publishedByEmail: String,
    publishedByName: String,
    editorialStatus: String,
    apiCreatedAt: Date,
    apiUpdatedAt: Date,
    gaiinCountry: mongoose.Schema.Types.Mixed,
    intergovernmentalOrganisation: mongoose.Schema.Types.Mixed,
    images: [mongoose.Schema.Types.Mixed],
    sourceFiles: [mongoose.Schema.Types.Mixed],
    evaluationFiles: [mongoose.Schema.Types.Mixed],
    relevantFiles: [mongoose.Schema.Types.Mixed],
    targetSectors: [mongoose.Schema.Types.Mixed],
    initiativeType: mongoose.Schema.Types.Mixed,
    principles: [mongoose.Schema.Types.Mixed],
    tags: [mongoose.Schema.Types.Mixed],
    gaiinCountryId: Number,
    intergovernmentalOrganisationId: mongoose.Schema.Types.Mixed,
    isWarningHighlight: Boolean,
    isDisabledHighlight: Boolean,
    isInfoHighlight: Boolean,
    isEditable: Boolean,
    isDeletable: Boolean,
    isEditorialStatusUpdatable: Boolean,
  },
  { timestamps: true }
);

initiativeSchema.index({ slug: 1 }, { unique: true, sparse: true });
initiativeSchema.index({ status: 1, createdAt: -1 });
initiativeSchema.index({ category: 1, createdAt: -1 });
initiativeSchema.index({ gaiinCountryId: 1, createdAt: -1 });
initiativeSchema.index({ createdAt: -1 });
initiativeSchema.index({ englishName: 1 });
initiativeSchema.index(
  { englishName: "text", description: "text", overview: "text", slug: "text" },
  { name: "initiative_text_search" }
);

const Initiative = mongoose.model("Initiative", initiativeSchema);

module.exports = Initiative;
