require("dotenv").config();

let config = {
  dbUrl: process.env.DBURL,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  env: process.env.NODE_ENV,
  domain: process.env.DOMAIN,
  origin: process.env.ORIGIN,
  allowedOrigins: [
    "http://localhost:4200",
    "https://policygeneratorai.com",
    "https://www.policygeneratorai.com",
  ],
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    apiUrl:
      process.env.CLAUDE_API_URL || "https://api.anthropic.com/v1/messages",
    model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
  },
};

module.exports = config;
