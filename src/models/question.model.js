const { mongoose, ObjectId } = require("./model-template");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: ObjectId,
      required: true,
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

questionSchema.index({ isDeleted: 1, isActive: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ question: "text" });
questionSchema.index({ domain: 1, isDeleted: 1 });
questionSchema.index({ domain: 1, isDeleted: 1, isActive: 1 });
questionSchema.index({ domain: 1, isDeleted: 1, createdAt: -1 });
questionSchema.index({ isDeleted: 1, createdAt: -1 });

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
