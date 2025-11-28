const MongooseLoader = require("../../loaders/mongoose.loader");
const enums = require("../../config/enums");

module.exports = {
  mongoose: MongooseLoader.mongoose,
  enums,
  ObjectId: MongooseLoader.mongoose.Schema.Types.ObjectId,
  Image: {
    type: {
      path: {
        type: String,
      },
    },
  },
  Phone: {
    number: {
      type: Number,
      required: true,
    },
    code: {
      type: Number,
      required: true,
    },
  },
  Content: {
    en: {
      type: String,
      required: true,
      trim: true,
    },
    ar: {
      type: String,
      required: true,
      trim: true,
    },
  },
  Location: {
    type: {
      type: String,
      enum: enums.geoJson,
      default: "Point",
    },
    coordinates: {
      type: [Number], // lng, lat
    },
    name: String,
    iso2: {
      type: String,
      trim: true,
    },
  },
  Address: {
    state: String,
    city: String,
    street: String,
    postalCode: Number,
  },
};
