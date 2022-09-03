import * as sdk from "botpress/sdk";
import { MessageNewEvent, MessagingClient } from "@botpress/messaging-client";
import stringToUuid from "./utils/stringToUuid";
import sendMsg from "./externalApi/sendMsg";

export default class WhatsAppMessaging {
  bp: typeof sdk;
  botId: string;
  userId: string;
  userMsgId: string | undefined;
  phone_number_id: string | undefined;
  from: string | undefined;
  userAttr: any;
  clientId: string | undefined;
  clientToken: string | undefined;
  webhookToken: string | undefined;
  conversationId: string | undefined;
  client: MessagingClient | undefined;

  async init() {
    await this.bp.users.getOrCreateUser("whatsapp", this.userId, this.botId);

    let messaging = this.bp.messaging.forBot(this.botId);

    const { clientId, clientToken, webhookToken } = messaging;
    this.clientId = clientId;
    this.clientToken = clientToken;
    this.webhookToken = webhookToken;

    /*
        this.userAttr = await this.bp.users.getAttributes('whatsapp', this.userId)

        if (this.userAttr.userMsgId != undefined) this.userMsgId = this.userAttr.userMsgId
        else {
            this.userMsgId = (await messaging.createUser()).id
            await this.bp.users.setAttributes('whatsapp', this.userId, { ...(this.userAttr), userMsgId: this.userMsgId })
        }

        if(this.userAttr.conversationId !== undefined){
            this.conversationId = this.userAttr.conversationId
            console.log('conversa recuperada')
        }
        else{
            this.conversationId = (await messaging.createConversation(this.userMsgId)).id
            await this.bp.users.setAttributes({ ...(this.userAttr), conversationId: this.conversationId })
            console.log('conversa criada')
        }
        */

    this.client = new MessagingClient({
      url: "http://localhost:3100",
      clientId,
      clientToken,
      webhookToken,
    });

    this.client.on("message", async ({ message }) => {
      if (message.authorId) {
        // we ingore user messages
        return;
      }

      const body = message.payload.text;
      switch (message.payload.type) {
        case "text":
          sendMsg(
            {
              text: { body },
            },
            this.phone_number_id || "",
            this.from || ""
          );
          break;
        case "single-choice":
          sendMsg(
            {
              type: "interactive",
              interactive: {
                type: "button",
                body: {
                  text: body,
                },
                action: {
                  buttons: message.payload.choices.map(
                    (choice: { title: any }, index: number) =>
                      Object.assign({
                        type: "reply",
                        reply: {
                          id: `UNIQUE_BUTTON_ID_${index}`,
                          title: choice.title,
                        },
                      })
                  ),
                },
              },
            },
            this.phone_number_id || "",
            this.from || ""
          );
          break;
        default:
          sendMsg(
            {
              text: { body },
            },
            this.phone_number_id || "",
            this.from || ""
          );
      }

      console.log("received", message);
    });
  }

  constructor(
    bp: typeof sdk,
    botId: string,
    phone_number_id: string,
    from: string
  ) {
    this.bp = bp;
    this.botId = botId;
    this.userId = stringToUuid(phone_number_id);
    this.phone_number_id = phone_number_id;
    this.from = from;
    this.init();
  }

  async getUserAttributes() {
    return await this.bp.users.getAttributes("whatsapp", this.userId);
  }

  async setUserAttributes(newAttr: any) {
    const attr = await this.bp.users.getAttributes("whatsapp", this.userId);
    await this.bp.users.setAttributes("whatsapp", this.userId, {
      ...attr,
      ...newAttr,
    });
  }

  on(cb: (arg: MessageNewEvent) => Promise<void>) {
    if (this.client) this.client.on("message", cb);
  }

  async sendMsgToBot(payload: any) {
    if (this.client) {
      this.conversationId = await this.client.mapEndpoint({
        channel: "whatsapp",
        identity: process.env.WHATSAPP_API_TOKEN || "",
        sender: this.phone_number_id || "",
        thread: this.conversationId || "",
      });
      this.userMsgId = (await this.client.getConversation(
        this.conversationId
      ))!.userId;

      const sent = this.client.createMessage(
        this.conversationId || "",
        this.userMsgId,
        payload
      );
      console.log("sent", sent);
    }
    /*
        const message = await this.bp.messaging.forBot(this.botId).createMessage(this.conversationId, this.userMsgId, payload)
            console.log('mensagem criada')

            const event = this.bp.IO.Event({
              messageId: message.id,
              botId: this.botId,
              channel: 'whatsapp',
              direction: 'incoming',
              payload,
              target: JSON.stringify({
                phone_number_id: this.phone_number_id,
                from: this.from
              }),
              threadId: this.conversationId,
              type: payload.type,
            })

            await this.bp.events.sendEvent(event)
            console.log('send event')

        */
  }
}
