const { mongoose } = require("./model-template");

const aiPrincipleSchema = new mongoose.Schema(
  {
    /** OECD API AI principle id; unique */
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
    subLabel: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

aiPrincipleSchema.index({ label: 1 });
aiPrincipleSchema.index({ subLabel: 1 });
aiPrincipleSchema.index({ label: 1, createdAt: -1 });
aiPrincipleSchema.index({ createdAt: -1 });

const AiPrinciple = mongoose.model("AiPrinciple", aiPrincipleSchema);

module.exports = AiPrinciple;
