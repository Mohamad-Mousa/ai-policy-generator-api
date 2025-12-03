const { mongoose, ObjectId } = require("./model-template");

const assessmentSchema = new mongoose.Schema(
  {
    domain: {
      type: ObjectId,
    },
    questions: [
      {
        question: {
          type: ObjectId,
        },
        answer: {
          type: mongoose.Schema.Types.Mixed,
          // Can be String for text/radio/number types, or Array for checkbox type
        },
      },
    ],
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["completed", "draft"],
      default: "draft",
    },
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
  },
  { timestamps: true }
);

assessmentSchema.index({ isDeleted: 1, isActive: 1 });
assessmentSchema.index({ createdAt: -1 });
assessmentSchema.index({
  title: "text",
  description: "text",
  fullName: "text",
});
assessmentSchema.index({ domain: 1, isDeleted: 1 });
assessmentSchema.index({ domain: 1, isDeleted: 1, isActive: 1 });
assessmentSchema.index({ domain: 1, isDeleted: 1, createdAt: -1 });
assessmentSchema.index({ isDeleted: 1, createdAt: -1 });
assessmentSchema.index({ status: 1, isDeleted: 1 });
assessmentSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
assessmentSchema.index({ domain: 1, status: 1, isDeleted: 1 });
assessmentSchema.index({ isActive: 1, status: 1, isDeleted: 1 });
assessmentSchema.index({ domain: 1, isActive: 1, status: 1, isDeleted: 1 });
assessmentSchema.index({ domain: 1, status: 1, isDeleted: 1, createdAt: -1 });
assessmentSchema.index({ isActive: 1, status: 1, isDeleted: 1, createdAt: -1 });
assessmentSchema.index({ _id: 1, isDeleted: 1 });
assessmentSchema.index({ _id: 1, domain: 1, isDeleted: 1, isActive: 1 });
// Index for policy service findOne query optimization ($in on _id + isDeleted filter + createdAt sort)
assessmentSchema.index({ _id: 1, isDeleted: 1, createdAt: -1 });

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;
