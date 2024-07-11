const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const { test, expect } = require('@playwright/test');
const playwright = require('playwright');
const fs = require('fs')
const https = require('https')
const wait = ms => new Promise(res => setTimeout(res, ms));

const fetch = require('node-fetch')

const m3u8ToMp4 = require("m3u8-to-mp4");
const converter = new m3u8ToMp4()

const {REGION, BASE_HOSTNAME, STORAGE_ZONE_NAME, ACCESS_KEY, CDN_LINK} = require("./config.json")


const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;


const uploadFile = async (file_name, resp) => {
    console.log("Uploading")
    const FILE_PATH = `${file_name}`
    const FILENAME_TO_UPLOAD = `${file_name}`
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
        console.log("redirecting")
        resp.redirect(`${CDN_LINK}/${file_name}`)
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


async function downloadM3(m3u8_urls, res, req, info ) {
    const title = req.query.url.split("imdb=")[1]
    //res as in express.js response
    const file_name = `${title}s${info.season}e${info.episode}.mp4`

    let i = 0;
    while (i < m3u8_urls.length) {
        console.log("Converting!")
        converter.setInputFile(m3u8_urls[i])
        converter.setOutputFile(file_name)
        converter.start()
            .then(() => {
                uploadFile(file_name, res)
            })
            .catch((err) => {
                console.log("Conversion failed: " + err)
            })
        i++
    }






    

}

// grabConvertMp4()
(async () => {
    this.browser = await playwright.firefox.launch({headless: false})
    console.log("Firefox browser launched!")
})()

app.get('/download', async (req, resp) => {
    let {url, season, episode} = req.query;
    if (season == undefined) season = 1;
    if (episode == undefined) episode = 1
    const info = {
        url, season, episode
    }
    if (!(url)) return res.send("no url present");
    const title_id = (url.split("imdb=")[1]).split("?")[0]
    console.log()
    const urlToContent = `${CDN_LINK}/${title_id}s${season}e${episode}.mp4`
    console.log("url to content: " + title_id)
    fetch(urlToContent)
        .then((res) => {
            if (res.status == 404) return grabM3u8(this.browser, resp, req, info)
            console.log("found! redirecting");
            return resp.redirect(urlToContent)
        })
        .catch(() => {
            console.log("testing error, caught an error, proceed");
            grabM3u8(this.browser, resp, req, info)

        })
    // if 
    // const cdn_status_code = ().statusCode
    // console.log(cdn_status_code)
    // if (cdn_status_code != 404) {
    //     console.log("title found in cdn, redirecting")
    //     return res.redirect(urlToContent)
    // };
    
})
const m3u8_urls = []



async function grabM3u8(browser, res, req, info) {
    const url = info.url;
    console.log("not found in cdn. downloading...")
    try {
        await browser.newPage()   
            .then(async (page) => {
                console.log("new page created")
                page.on('response',  async response => {
                    if (response.url().endsWith(".m3u8")) {
                        m3u8_urls.push(response.url())
                        console.log("url found in resp")
                    }
                })
                request(`https://${url}`, {resolveWithFullResponse: true})
                    .then((body) => {
                        if (body.statusCode != 200) return res.send("Invalid movie! doesnt exist in database")
                    })
                    .catch((err) => {
                        console.log(err)
                        console.log("movie dont exist in db")
                        return res.send("Invalid movie! doesnt exist in database")
                    })
            
                let full_url;
                if (url.split("/movie?").length == 1) full_url = `${url}&season=${info.season}&episode=${info.episode}`
                else full_url = url;     
                               
                console.log(full_url)
                page.goto(`https://${full_url}`)
                    .then(async () => {
                        page.locator("#player_iframe").click({ force: true });
                        page.locator("#player_iframe").click({ force: true });

                        console.log("clicked")
                        await wait(7500)
                        downloadM3(m3u8_urls, res, req, info)
                        
                    })
                    .catch(err => {
                        res.send("error occured. please stay on this page while the file downloads.")
                    })
            })

        }
        
            
        catch (err) {
            console.log("ERROR +++ " + err)
            res.send("error occured. please stay on this page while the file downloads.")
        }
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

