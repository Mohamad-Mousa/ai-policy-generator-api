const { mongoose, ObjectId } = require("./model-template");

const subdomainSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: ObjectId,
      ref: "Domain",
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
  { timestamps: true },
);

subdomainSchema.index({ isDeleted: 1, isActive: 1 });
subdomainSchema.index({ createdAt: -1 });
subdomainSchema.index({ title: 1 });
subdomainSchema.index({ isDeleted: 1 });
subdomainSchema.index({ domain: 1, isDeleted: 1 });
subdomainSchema.index({ title: "text" });

const Subdomain = mongoose.model("Subdomain", subdomainSchema);

module.exports = Subdomain;
