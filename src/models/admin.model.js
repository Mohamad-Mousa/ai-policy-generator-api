const { mongoose, ObjectId } = require("./model-template");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    type: {
      type: ObjectId,
      ref: "AdminType",
      required: true,
    },
    image: {
      type: String,
    },
    tokens: [
      {
        type: String,
        validate: {
          validator: function (tokens) {
            return tokens.length > 0;
          },
          message: "Token to be provided",
        },
      },
    ],
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

adminSchema.index({ type: 1 });
adminSchema.index({ isDeleted: 1, isActive: 1 });
adminSchema.index({ createdAt: -1 });

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
