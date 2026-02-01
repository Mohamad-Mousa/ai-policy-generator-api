const { mongoose } = require("./model-template");

const initiativeSyncMetaSchema = new mongoose.Schema(
  {
    lastApiTotal: {
      type: Number,
      default: 0,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    lastPageFetched: {
      type: Number,
      default: 0,
    },
    /** Prevents overlapping syncs; only one sync runs at a time */
    syncInProgress: {
      type: Boolean,
      default: false,
    },
    syncStartedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/** For lock acquisition: find by syncInProgress / syncStartedAt */
initiativeSyncMetaSchema.index({ syncInProgress: 1, syncStartedAt: 1 });

const InitiativeSyncMeta = mongoose.model(
  "InitiativeSyncMeta",
  initiativeSyncMetaSchema
);

module.exports = InitiativeSyncMeta;
