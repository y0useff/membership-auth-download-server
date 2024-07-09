
const REGION = 'ny'; // If German region, set this to an empty string: ''
const BASE_HOSTNAME = 'storage.bunnycdn.com';
const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
const STORAGE_ZONE_NAME = 'delicious-soap-stor';
const FILENAME_TO_UPLOAD = 'test.txt';
const FILE_PATH = 'test.txt';
const ACCESS_KEY = '2453c502-879a-4374-bcce4970b7ce-a65b-4267';

const fs = require('fs')
const https = require('https')

const m3u8ToMp4 = require("m3u8-to-mp4");
const converter = new m3u8ToMp4();
// (async function() {
//   await converter
//     .setInputFile("https://<URL_OF_THE_WEBSITE>/<PATH_TO_THE_M3U8_FILE>")
//     .setOutputFile("dummy.mp4")
//     .start();

//   console.log("File converted");
// })();

const uploadFile = async () => {
    const readStream = fs.createReadStream(FILE_PATH);
  
    const options = {
      method: 'PUT',
      host: HOSTNAME,
      path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
      headers: {
        AccessKey: ACCESS_KEY,
        'Content-Type': 'application/octet-stream',
      },
    };
  
    const req = https.request(options, (res) => {
      res.on('data', (chunk) => {
        console.log(chunk.toString('utf8'));
      });
    });
  
    req.on('error', (error) => {
      console.error(error);
    });
  
    readStream.pipe(req);
};

const main = async () => {
    await uploadFile();
};
  
main();