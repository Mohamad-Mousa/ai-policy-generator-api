const qs = require("qs");
const axios = require("axios");
class UltraMessageService {
  async sendWhatsappMessage(to, body) {
    const data = qs.stringify({
      token: process.env.ULTRAMSG_TOKEN,
      to,
      body,
    });

    const config = {
      method: "post",
      url: `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    try {
      const response = await axios(config);
    } catch (error) {
      console.log("Error sending message:", error);
    }
  }
}

module.exports = UltraMessageService;
