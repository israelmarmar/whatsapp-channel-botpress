const axios = require("axios");

class WhatsAppMessagingClient {
  constructor(phone_number_id, from) {
    this.phone_number_id = phone_number_id;
    this.from = from;
  }

  async sendMsg(msg, phone_number_id, from, botId) {
      try {
        if (process.env[`WHATSAPP_API_TOKEN_${botId.replace("-","_")}`])
          await axios.post(
            "https://graph.facebook.com/v14.0/" + phone_number_id + "/messages",
            { ...msg, to: from, messaging_product: "whatsapp" },
            {
              headers: {
                Authorization:
                  "Bearer " + process.env[`WHATSAPP_API_TOKEN_${botId.replace("-","_")}`] ||
                  "",
                "Content-Type": "application/json",
              },
            }
          );
      } catch (e) {
        console.log(e);
      }
  }

  async sendMsgToUser(event) {
    const botId = event.botId;
    const body = event.payload.text;
    switch (event.payload.type) {
      case "text":
        this.sendMsg(
          {
            text: { body },
          },
          this.phone_number_id || "",
          this.from || "",
          botId || ""
        );
        break;
      case "single-choice":
        this.sendMsg(
          {
            text: {
              body: `${body}${event.payload.choices.reduce(
                (acc, choice, i) => `${acc}${i + 1}- ${choice.title}\n`,
                "\n"
              )}`,
            },
          },
          this.phone_number_id || "",
          this.from || "",
          botId || ""
        );
        break;
      case "image":
        this.sendMsg(
          {
            type: "image",
            image: {
              link: event.payload.image
            }
          },
          this.phone_number_id || "",
          this.from || "",
          botId || ""
        );
        break;
      default:
        this.sendMsg(
          {
            text: { body },
          },
          this.phone_number_id || "",
          this.from || "",
          botId || ""
        );
    }
  }
}

module.exports = WhatsAppMessagingClient;
