const logger = require("./services/core/logger.service");
const MongooseLoader = require("./loaders/mongoose.loader");
// const firebase = require("firebase-admin");

MongooseLoader.load();
MongooseLoader.connect()
  .then(() => {
    logger.info("Database connection successful");
    console.log("Database connection successful");

    const ExpressLoader = require("./loaders/express.loader");
    new ExpressLoader();

    const CronService = require("./services/core/cron.service");
    CronService.startJob();
  })
  .catch((err) => {
    logger.error(err);
    console.log(err);
  });
