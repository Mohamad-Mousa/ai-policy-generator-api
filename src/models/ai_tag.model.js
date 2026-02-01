const { mongoose } = require("./model-template");

const aiTagSchema = new mongoose.Schema(
  {
    /** OECD API AI tag id; unique */
    value: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

aiTagSchema.index({ label: 1 });
aiTagSchema.index({ label: 1, createdAt: -1 });
aiTagSchema.index({ createdAt: -1 });

const AiTag = mongoose.model("AiTag", aiTagSchema);

module.exports = AiTag;
