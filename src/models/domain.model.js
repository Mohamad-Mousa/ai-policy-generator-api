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
  },
  { timestamps: true }
);

domainSchema.index({ isDeleted: 1, isActive: 1 });
domainSchema.index({ createdAt: -1 });
domainSchema.index({ title: 1 });
domainSchema.index({ isDeleted: 1 });
domainSchema.index({ title: "text", description: "text" });

const Domain = mongoose.model("Domain", domainSchema);

module.exports = Domain;
