import axios from "axios";

const sendMsg = async (msg: any, phone_number_id: string, from: string) => {
  try {
    await axios.post(
      "https://graph.facebook.com/v14.0/" + phone_number_id + "/messages",
      { ...msg, to: from, messaging_product: "whatsapp" },
      {
        headers: {
          Authorization: "Bearer " + process.env.WHATSAPP_API_TOKEN || '',
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.log(e);
  }
};

export default sendMsg;
