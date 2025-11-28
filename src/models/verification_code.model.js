const { mongoose } = require("./model-template");

const VerificationCode = mongoose.model(
  "VerificationCode",
  new mongoose.Schema(
    {
      email: {
        type: String,
        trim: true,
      },
      phone: {
        code: Number,
        number: Number,
      },
      code: {
        type: Number,
        required: true,
        unique: true,
      },
      expiredAt: {
        type: Date,
        required: true,
        index: true,
        default: () => new Date(Date.now() + 60 * 5 * 1000),
      },
    },
    { timestamps: true }
  )
);
VerificationCode.collection.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 5 }
);
module.exports = VerificationCode;
