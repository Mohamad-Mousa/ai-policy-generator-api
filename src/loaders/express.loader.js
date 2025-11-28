const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ResponseService = require("../services/core/response.service");

const routers = require("../routers");
const logger = require("../services/core/logger.service");
const config = require("../config");
const { rateLimit } = require("express-rate-limit");
const PostmanService = require("../services/core/postman.service");

class ExpressLoader {
  constructor() {
    const app = express();

    app.use(
      cors({
        origin: function (origin, callback) {
          if (!origin || config.allowedOrigins.indexOf(origin) !== -1) {
            callback(null, origin);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        allowHeaders: [
          "Access-Control-Allow-Headers",
          "X-Requested-With",
          "content-type",
          "x-access-token",
          "authorization",
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      })
    );

    const limiter = rateLimit({
      windowMs: 1 * 1 * 1000,
      limit: 2,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler: (req, res, next) => {
        ResponseService.error(res, "Rate limit exceeded", 429);
      },
    });

    // Apply the rate limiting middleware to all requests.
    // app.use(limiter)

    // Serve static content
    app.use(express.static(path.join(__dirname, "../../", "public/uploads")));

    app.use(cookieParser());
    app.use(
      express.urlencoded({
        extended: false,
        limit: "20mb",
      })
    );
    app.use(express.json({ limit: "20mb" }));

    // Pass app to routers
    routers(app);

    // Route Not Found
    app.use((req, res, next) => {
      ResponseService.error(res, "Route not found", 404);
    });

    // Setup error handling, this must be after all other middleware
    app.use(ExpressLoader.errorHandler);

    app.use(/(.*)/, (req, res) => {
      res.set("Content-Type", "text/html");
    });

    // Start application
    this.server = app.listen(config.port, () => {
      logger.info(`Express running, now listening on port ${config.port}`);
      console.log(`Express running, now listening on port ${config.port}`);

      if (process.env.NODE_ENV === "development") {
        PostmanService.generatePostmanCollection();
      }
    });
    // new SocketLoader(this.server);
  }

  get Server() {
    return this.server;
  }

  static errorHandler(error, req, res, next) {
    logger.error(error);
    if (process.env.NODE_ENV === "development") {
      console.log(error);
    }
    ResponseService.error(res, error.message, error.code);
  }
}

module.exports = ExpressLoader;
