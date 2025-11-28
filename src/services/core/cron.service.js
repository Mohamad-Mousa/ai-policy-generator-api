const { CronJob } = require("cron");
const MongooseLoader = require("../../loaders/mongoose.loader");

class CronService {

    static VerificationToken = MongooseLoader.models.VerificationToken;
    static Business = MongooseLoader.models.Business;
    static User = MongooseLoader.models.User;

    static job = new CronJob(
        '* * * * * *', // 0 0 * * 0
        this.onTick.bind(this),
        null, // onComplete
        false, // start
        // 'America/Los_Angeles' // timeZone
    );

    static startJob() {
        this.job.start();
    }

    static onTick() {
        this.deletePendingBusinesses();
        this.deletePendingUsers();
        this.deleteOldUnavailabilities();
        this.deleteExpiredVerficationTokens();
    }

    static deletePendingBusinesses() { // delete old pending registrees
        var thresholdTime = new Date();
        thresholdTime.setMinutes(thresholdTime.getDate() - 1);
        this.Business.deleteMany({isVerified: false, createdAt: { $lt: thresholdTime }})
    }

    static deletePendingUsers() { // delete old pending registrees
        var thresholdTime = new Date();
        thresholdTime.setMinutes(thresholdTime.getDate() - 1);
        this.User.deleteMany({isVerified: false, createdAt: { $lt: thresholdTime }})
    }

    static deleteOldUnavailabilities() { // delete past unavailabilities when the business wasn't operating 
    }

    static deleteExpiredVerficationTokens() { // delete expired tokens from verificationTokens table 
    }
}

module.exports = CronService;