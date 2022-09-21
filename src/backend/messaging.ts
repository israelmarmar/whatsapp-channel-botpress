import * as sdk from "botpress/sdk";
import { MessageNewEvent, MessagingClient } from "@botpress/messaging-client";
import stringToUuid from "./utils/stringToUuid";
import WDb from "./db";

export default class WhatsAppMessagingServer {
  bp: any;
  db: WDb;
  botId: string;
  userWId: string | undefined;
  userId: string | undefined;
  phone_number_id: string | undefined;
  from: string | undefined;
  userAttr: any;
  messaging: any;

  constructor(bp: typeof sdk, db: WDb, botId: string) {
    this.bp = bp;
    this.db = db;
    this.botId = botId;
    this.messaging = this.bp.messaging.forBot(this.botId);
  }

  async getUserAttributes(): Promise<any> {
    await this.bp.users.getOrCreateUser("whatsapp", this.userWId, this.botId);
    return await this.bp.users.getAttributes("whatsapp", this.userWId);
  }

  setWid(from: string, phone_number_id: string) {
    this.from = from;
    this.phone_number_id = phone_number_id;
    this.userWId = stringToUuid(phone_number_id);
  }

  async setUserAttributes(newAttr: any) {
    await this.bp.users.getOrCreateUser("whatsapp", this.userWId, this.botId);
    const attr = await this.bp.users.getAttributes("whatsapp", this.userWId);
    await this.bp.users.setAttributes("whatsapp", this.userWId, {
      ...attr,
      ...newAttr,
    });
  }

  async getRecent(userId: string) {
    try {
      const convs = await this.messaging.listConversations(userId, 1);
      if (convs?.length) {
        return convs[0];
      }
      return this.messaging.createConversation(userId);
    } catch (e) {
      return this.messaging.createConversation(userId);
    }
  }

  async sendMsgToBot(payload: any) {
    console.log(JSON.stringify({payload}))
    const attr = await this.getUserAttributes();
    const user_map = await this.db.getUser(this.botId, this.userWId);

    if (!attr.userId || (attr.userId && !(await this.messaging.getUser(attr.userId)))) {
      const userId = (await this.messaging.createUser()).id;
      this.userId = userId;
      this.setUserAttributes({ userId })
    } else if((await this.messaging.getUser(attr.userId)) !== undefined){
      this.userId = attr.userId;
    }

    if(!user_map){
      console.log("this.userWId",this.userWId)
      const user_res = await this.db.createUserMapping(this.botId, this.userWId, this.userId)
      console.log("user_res",user_res)
    }

    const conversationId = (await this.getRecent(this.userId)).id;

    const message = await this.messaging.createMessage(
      conversationId,
      this.userId,
      payload
    );

    const { from, phone_number_id, name } = payload;

    payload['conversation_id'] = conversationId.toString()

    /*
    let img_url;
    if (payload.img_url){
      img_url = payload.img_url;
      payload.img_url = undefined;
    }
    */

    const event = this.bp.IO.Event({
      messageId: message.id,
      botId: this.botId,
      channel: "whatsapp",
      direction: "incoming",
      payload,
      target: JSON.stringify({
        phone_number_id,
        from,
        botId: this.botId,
        name
      }),
      threadId: conversationId.toString(),
      type: payload.type
    });

    /*
    event.state.user = {
      firstname: name,
      lastname: ""
    }

    event.state.temp = {img_url}
    */

    await this.bp.events.sendEvent(event);
  }
}
