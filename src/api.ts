import * as sdk from 'botpress/sdk'
import WhatsAppMessaging from './messaging'
import _ from 'lodash'

export default async (bp: typeof sdk, botId: string) => {
  /**
   * This is an example route to get you started.
   * Your API will be available at `http://localhost:3000/api/v1/bots/BOT_NAME/mod/starter-module`
   * Just replace BOT_NAME by your bot ID
   */
  const router = bp.http.createRouterForBot('whatsapp')

  // Link to access this route: http://localhost:3000/api/v1/bots/BOT_NAME/mod/starter-module/my-first-route
  router.get('/hello', async (req: any, res: any) => {
    res.status(200).json({ msg: 'hello' })
  })

  router.post('/webhook', async (req: any, res: any) => {
    res.sendStatus(200)
    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
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
        let msg_body = msg.text.body // extract the message text from the webhook payload
        let timestamp = parseInt(req.body.entry[0].changes[0].value.messages[0].timestamp)

        const payload = {
          type: 'text',
          text: msg_body
        }

        // bp.events.replyToEvent(eventDestination, [payload])
        console.log('começando')

        try {

          console.log('phone_number_id ' + phone_number_id)

          const msgClient = new WhatsAppMessaging(bp,botId,phone_number_id,from)

          const attr = await msgClient.getUserAttributes()

          console.log(attr.lastMessage, msg)

          const timenow = Math.floor(Date.now() / 1000)

          //verificar se a mensagem recebida é igual ao da anterior
          if (!_.isEqual(attr.lastMessage, msg) && timenow - timestamp < 4) {
            await msgClient.setUserAttributes({ lastMessage: msg })

            console.log('usuario criado')

            await msgClient.sendMsgToBot(payload)
          }
        } catch (e) {
          console.log(e)
          res.sendStatus(404)
        }
      }
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      res.sendStatus(404)
    }
  })

  router.get('/webhook', async (req: any, res: any) => {
    const verify_token = process.env.VERIFY_TOKEN

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode']
    let token = req.query['hub.verify_token']
    let challenge = req.query['hub.challenge']

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
            if (mode === 'subscribe' && token === verify_token) {
                // Respond with 200 OK and challenge token from the request
                console.log('WEBHOOK_VERIFIED')
                res.status(200).send(challenge)
            } else {
                // Responds with '403 Forbidden' if verify tokens do not match
                res.sendStatus(403)
            }
        }
    })

}