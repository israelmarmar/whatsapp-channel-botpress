const axios = require("axios");

class WhatsAppMessagingClient {
  constructor(phone_number_id, from) {
    this.phone_number_id = phone_number_id;
    this.from = from;
  }

  async sendMsg(msg, phone_number_id, from) {
    try {
      await axios.post(
        "https://graph.facebook.com/v14.0/" + phone_number_id + "/messages",
        { ...msg, to: from, messaging_product: "whatsapp" },
        {
          headers: {
            Authorization: "Bearer " + process.env.WHATSAPP_API_TOKEN || "",
            "Content-Type": "application/json",
          },
        }
      );
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  }

  async sendMsgToUser(event) {
    const body = event.payload.text;
    switch (event.payload.type) {
      case "text":
        this.sendMsg(
          {
            text: { body },
          },
          this.phone_number_id || "",
          this.from || ""
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
          this.from || ""
        );
        break;
      default:
        this.sendMsg(
          {
            text: { body },
          },
          this.phone_number_id || "",
          this.from || ""
        );
    }
  }
}

module.exports = WhatsAppMessagingClient;
