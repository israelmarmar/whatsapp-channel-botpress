const axios = require('axios');
const WDb = require('./db');
const uuid = require('./uuid');
const URL = require('url').URL;
const stringToUuid = require('./stringToUuid');

const uploadImage = async () => {

    try{
        const db = new WDb(bp);
        const { fbimgid } = JSON.parse(event.payload.text);
        const { access_token, phone_number_id, api_url } = event.payload;
        const { data } = await axios.get('https://graph.facebook.com/v13.0/' + fbimgid, {
            headers: {
            Authorization:
                  "Bearer " + access_token
            }       
        })

        const { url } = data;
        
        const r = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                Authorization:
                    "Bearer " + access_token
            }       
        });

        const file_base64 = r.data.toString('base64')
        user[args.name] = 'data:image/jpg;base64, ' + file_base64;
        const file_uuid = uuid();
        const user_wid = stringToUuid(phone_number_id);
        await db.createFile(file_uuid, file_base64, user_wid);
        user[`${args.name}_shortlink`] = api_url + '/file?file_uuid=' + file_uuid; 
    }catch(e){
        console.log(e);
        user[args.name] = 'invalid';
    }
}

return uploadImage()