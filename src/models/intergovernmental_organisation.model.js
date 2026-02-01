const { mongoose } = require("./model-template");

const intergovernmentalOrganisationSchema = new mongoose.Schema(
  {
    /** OECD API intergovernmental organisation id; unique */
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

intergovernmentalOrganisationSchema.index({ label: 1 });
intergovernmentalOrganisationSchema.index({ label: 1, createdAt: -1 });
intergovernmentalOrganisationSchema.index({ createdAt: -1 });

const IntergovernmentalOrganisation = mongoose.model(
  "IntergovernmentalOrganisation",
  intergovernmentalOrganisationSchema
);

module.exports = IntergovernmentalOrganisation;
