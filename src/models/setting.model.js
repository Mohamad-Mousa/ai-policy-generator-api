const { mongoose, Phone } = require("./model-template");

const settingSchema = new mongoose.Schema(
  {
    contact: {
      email: {
        type: String,
        required: true,
        trim: true,
      },
      phone: Phone,
    },
    subscriptions: {
      notifications: {
        type: Boolean,
        required: true,
        default: true,
      },
      emails: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    privacyPolicy: {
      type: String,
      required: true,
      trim: true,
    },
    termsAndConditions: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

module.exports = Setting;
