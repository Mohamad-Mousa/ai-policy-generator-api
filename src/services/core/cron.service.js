const { CronJob } = require("cron");
const MongooseLoader = require("../../loaders/mongoose.loader");
const initiativeSync = require("./initiative_sync.service");
const logger = require("./logger.service");

class CronService {
    /** Existing job (e.g. every minute) - adjust schedule as needed */
    static job = new CronJob(
        "* * * * *", // every minute (optional: run other cleanup tasks)
        () => {},
        null,
        false
    );

    /** Initiative sync: runs daily at midnight; only fetches if API total changed */
    static initiativeSyncJob = new CronJob(
        "0 0 * * *", // 0 min, 0 hour = midnight every day
        this.runInitiativeSync.bind(this),
        null,
        false
    );

    static startJob() {
        this.job.start();
        this.initiativeSyncJob.start();
        logger.info("Cron jobs started (including initiative sync at midnight).");
    }

    static async runInitiativeSync() {
        try {
            const Initiative = MongooseLoader.models.Initiative;
            const InitiativeSyncMeta = MongooseLoader.models.InitiativeSyncMeta;
            if (!Initiative || !InitiativeSyncMeta) {
                logger.warn("[InitiativeSync] Models not loaded; skipping.");
                return;
            }
            await initiativeSync.syncIfTotalChanged({
                Initiative,
                InitiativeSyncMeta,
            });
        } catch (err) {
            logger.error("[InitiativeSync] Cron run failed:", err);
        }
    }
}

module.exports = CronService;