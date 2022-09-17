import * as sdk from 'botpress/sdk'
import WhatsAppMessaging from './messaging'
import _ from 'lodash'

export default async (bp: typeof sdk, botId: string) => {
  
  const msgClient = new WhatsAppMessaging(bp,botId)

  const router = bp.http.createRouterForBot(`${botId}-whatsapp`, {
    checkAuthentication: false
  })

  // Link to access this route: http://localhost:3000/api/v1/bots/BOT_NAME/mod/starter-module/my-first-route
  router.get('/hello', async (req: any, res: any) => {
    res.status(200).json({ msg: 'hello' })
  })

  router.post('/webhook', async (req: any, res: any) => {
    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    bp.logger.info((JSON.stringify({botId, ...req.body})))
    
    if (req.body.object) {
      if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
      ) {
        let phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id
        let from = req.body.entry[0].changes[0].value.messages[0].from // extract the phone number from the webhook payload
        let msg = req.body.entry[0].changes[0].value.messages[0]
        let timestamp = parseInt(req.body.entry[0].changes[0].value.messages[0].timestamp)
        let id = req.body.entry[0].changes[0].value.messages[0].id
        let name = req.body.entry[0].changes[0].value.contacts[0].profile.name

        let msg_body;
        switch(msg.type){
          case "text":
            msg_body = msg.text.body;
            break;
          case "interactive":
            msg_body = msg.interactive.button_reply.title;
          default:
            break;
        }
        const payload = {
          type: 'text',
          text: msg_body,
          from,
          phone_number_id,
          name
        }

        // bp.events.replyToEvent(eventDestination, [payload])

        try {
          msgClient.setWid(from,phone_number_id)
          const attr = await msgClient.getUserAttributes()
          const timenow = Math.floor(Date.now() / 1000)

          if (!_.isEqual(attr.lastMessage, msg) && timenow - timestamp < 4) {
            await msgClient.setUserAttributes({ lastMessage: msg })
            await msgClient.sendMsgToBot(payload)
            res.sendStatus(200)
          }
        } catch (e) {
          res.sendStatus(404)
        }
      }
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      res.sendStatus(404)
    }
  })

  router.get('/webhook', async (req: any, res: any) => {
    const verify_token = process.env[`WHATSAPP_API_VERIFY_TOKEN_${botId.replace("-","_")}`] || ""

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode']
    let token = req.query['hub.verify_token']
    let challenge = req.query['hub.challenge']

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
            if (mode === 'subscribe' && token === verify_token) {
                // Respond with 200 OK and challenge token from the request
                res.status(200).send(challenge)
            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.sendStatus(403)
            }
        }
    })

  let apiUrl = await router.getPublicPath()
  apiUrl = apiUrl.replace('BOT_ID', botId)
  bp.logger.info(`Private API Path is ${apiUrl}`)

}