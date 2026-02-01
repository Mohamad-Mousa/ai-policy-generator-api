const { mongoose } = require("./model-template");

const initiativeTypeSchema = new mongoose.Schema(
  {
    /** OECD API initiative type id; unique */
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

initiativeTypeSchema.index({ label: 1 });
initiativeTypeSchema.index({ label: 1, createdAt: -1 });
initiativeTypeSchema.index({ createdAt: -1 });

const InitiativeType = mongoose.model("InitiativeType", initiativeTypeSchema);

module.exports = InitiativeType;
