const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const { test, expect } = require('@playwright/test');
const playwright = require('playwright');
const fs = require('fs')
const https = require('https')


const m3u8ToMp4 = require("m3u8-to-mp4");
const converter = new m3u8ToMp4()

const {REGION, BASE_HOSTNAME, STORAGE_ZONE_NAME, ACCESS_KEY, CDN_LINK} = require("./config.json")


const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;


const uploadFile = async (titleId) => {
    console.log("Uploading")
    const FILE_PATH = `${titleId}.mp4`
    const FILENAME_TO_UPLOAD = `${titleId}.mp4`
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
        return true;
      });
    });
  
    req.on('error', (error) => {
      console.error(error);
    });
  
    readStream.pipe(req);


};



let browser;

const request = require('request-promise');
const { title } = require('process');
app.get('/', (req, res) => {
  res.send('Hello World!')
})


async function downloadM3(m3u8Url, res, req) {
    const title = req.query.url.split("imdb=")[1]
    //res as in express.js response
    await converter.setInputFile(m3u8Url)
    await converter.setOutputFile(`${title}.mp4`)
    console.log("Converting!")

    converter.start()
        .then(() => {
            
            if (uploadFile(title) == true) {
                console.log("redirecting")
                res.redirect(`${CDN_LINK}/${title}.mp4`)
            } else res.redirect(`${CDN_LINK}/${title}.mp4`);
        })
        .catch((err) => {
            console.log(err)
            res.send("an error ocurred attempting to download this stream.")
        })


    

}

// grabConvertMp4()
(async () => {
    this.browser = await playwright.firefox.launch()
    console.log("Firefox browser launched!")
})()

app.get('/download', async (req, res) => {
    const {url, season, episode} = req.query;
    if (!(url)) return res.send("no url present");
    const title_id = url.split("imdb=")[1]
    const urlToContent = `${CDN_LINK}/${title_id}.mp4`
    request(urlToContent)
        .then(() => {
            console.log("found! redirecting")
            return res.redirect(urlToContent)
        })
        .catch((err) => {
            (() => {
                console.log("not found in cdn. downloading...")
                try {
                    this.browser.newPage()   
                        .then(async (page) => {
                            console.log("new page created")
                            let downloaded = false
                            page.on('request', request => {
                                if ((request.url().startsWith("https://tmstr2.vidsrc.stream/stream/")) && (downloaded == false)) {
                                    downloaded = true;
                                    page.close()
                                    console.log(request.url())
                                    console.log("url found in req")
                                    return downloadM3(request.url(), res, req)
                                    // return res.send(request.url())
                                }
                            });
                            page.on('request', request => {
                                if ((request.url().startsWith("https://tmstr.vidsrc.stream/stream/")) && (downloaded == false)) {
                                    downloaded = true;
                                    page.close()
                                    console.log("url found in req")
                                    return downloadM3(request.url(), res, req)
                                    // return res.send(request.url())
                                }
                            });
                            page.on('response', response => {
                                if ((response.url().startsWith("https://tmstr.vidsrc.stream/stream/")) && (downloaded == false)) {
                                    downloaded = true;
                                    page.close()
                                    console.log("url found in req")
                                    return downloadM3(response.url(), res, req)
                                    // return res.send(request.url())
                                }
                            });
                            page.on('response', response => {
                                if ((response.url().startsWith("https://tmstr2.vidsrc.stream/stream/")) && (downloaded == false)) {
                                    downloaded = true;
                                    page.close()
                                    console.log("url found in req")
                                    return downloadM3(response.url(), res, req)
                                    // return res.send(request.url())
                                }
                            });

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
                                    page.locator("#player_iframe").click({ force: true });
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
    // if 
    // const cdn_status_code = ().statusCode
    // console.log(cdn_status_code)
    // if (cdn_status_code != 404) {
    //     console.log("title found in cdn, redirecting")
    //     return res.redirect(urlToContent)
    // };
    
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

