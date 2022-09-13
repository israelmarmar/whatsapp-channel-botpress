const isJsonString = require("./isJsonString");
const WhatsAppMessagingClient = require("./messaging");

(async () => {
  if (isJsonString(event.target)) {
    const { phone_number_id, from } = JSON.parse(event.target);
    const msgClient = new WhatsAppMessagingClient(phone_number_id, from);
    await msgClient.sendMsgToUser(event);
  }
})();
