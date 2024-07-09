const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const { test, expect } = require('@playwright/test');
const playwright = require('playwright');
const fs = require('fs')

const https = require('https')


const REGION = 'New York, US'; // If German region, set this to an empty string: ''
const BASE_HOSTNAME = 'storage.bunnycdn.com';
const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
const STORAGE_ZONE_NAME = 'delicious-soap-stor';
const FILENAME_TO_UPLOAD = 'test.txt';
const FILE_PATH = './test.txt';
const ACCESS_KEY = '2708e727-6642-427a-b245-1c60c5d07c800bad7415-625f-497b-a070-4acc67ab461e';

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

let browser;

const request = require('request-promise')
app.get('/', (req, res) => {
  res.send('Hello World!')
})


async function grabConvertMp4(m3u8Url, res) {

    await converter.setInputFile(m3u8Url)
    await converter.setOutputFile("output.mp4")
    await converter.start();

    await res.download("output.mp4", async (err) => {
        // await fs.unlinkSync("output.mp4")
    })

    //res as in express.js response

    // const response = await request(m3u8Url)
    // await fs.writeFileSync("./output.m3u8", response)
    // await res.download("./output.m3u8", async (err) => {
    //     await fs.unlinkSync('./output.m3u8')
    // })

}

// grabConvertMp4()
(async () => {
    this.browser = await playwright.firefox.launch()
    console.log("Firefox browser launched!")
})()

app.get('/download', (req, res) => {
    (() => {
        try {
            this.browser.newPage()   
                .then(async (page) => {
                    console.log("new page created")
                    let downloaded = false
                    // page.on('response', response => {
                    //     if ((response.url().startsWith("https://tmstr.vidsrc.stream/stream/")) && (downloaded == false)) {
                    //         downloaded = true;
                    //         page.close()
                    //         console.log("url found in res")

                    //         return downloadM3(response.url(), res)
                    //         // return res.send(response.url())
                    //     }
                    // })
                    page.on('request', request => {
                        if ((request.url().startsWith("https://tmstr2.vidsrc.stream/stream/")) && (downloaded == false)) {
                            downloaded = true;
                            page.close()
                            console.log("url found in req")
                            return grabConvertMp4(request.url(), res)
                            // return res.send(request.url())
                        }
                    });
                    page.on('request', request => {
                        if ((request.url().startsWith("https://tmstr.vidsrc.stream/stream/")) && (downloaded == false)) {
                            downloaded = true;
                            page.close()
                            console.log("url found in req")
                            return grabConvertMp4(request.url(), res)
                            // return res.send(request.url())
                        }
                    });
                    const {url, season, episode} = req.query;
                    request(url, {resolveWithFullResponse: true})
                        .then((body) => {
                            if (body.statusCode != 200) return res.send("Invalid movie! doesnt exist in database")
                        })
                        .catch((err) => {
                            return res.send("Invalid movie! doesnt exist in database")
                        })
                
                    let full_url;
                    if (url.split("/movie?").length == 1) full_url = `${url}&season=${season}&episode=${episode}`
                    else full_url = url;                    
                    page.goto(full_url)
                        .then(() => {
                            page.locator("#player_iframe").click({ force: true });
                            console.log("clicked")
                        })
                        .catch(err => {
                            res.send("error occured. please stay on this page while the file downloads.")
                        })
                })
            }
            
                
            catch (err) {
                console.log(err)
                res.send("error occured. please stay on this page while the file downloads.")
            }
    })()
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

