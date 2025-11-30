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
// Additional indexes for assessment service queries
questionSchema.index({ question: 1, isDeleted: 1 }); // For import by question text lookup
questionSchema.index({ _id: 1, isDeleted: 1 }); // For $in queries with isDeleted filter

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
