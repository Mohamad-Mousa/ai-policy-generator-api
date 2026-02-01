const { mongoose } = require("./model-template");

const countrySchema = new mongoose.Schema(
  {
    /** OECD API country id; unique */
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

countrySchema.index({ label: 1 });
countrySchema.index({ label: 1, createdAt: -1 });
countrySchema.index({ createdAt: -1 });

const Country = mongoose.model("Country", countrySchema);

module.exports = Country;
