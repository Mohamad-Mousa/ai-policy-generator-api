const { mongoose, ObjectId } = require("./model-template");

const Privilege = mongoose.model(
  "Privilege",
  new mongoose.Schema(
    {
      function: {
        type: ObjectId,
        ref: "Function",
      },
      adminType: {
        type: ObjectId,
        ref: "AdminType",
      },
      read: {
        type: Boolean,
        default: false,
      },
      write: {
        type: Boolean,
        default: false,
      },
      update: {
        type: Boolean,
        default: false,
      },
      delete: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true }
  )
);

module.exports = Privilege;
