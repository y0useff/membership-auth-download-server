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

const {checkMembership} = require("./checkIfMember.js")


app.get("/validateTitle", (req, res) => {
    let {url, season, episode} = req.query;
    if (season == undefined) season = 1;
    if (episode == undefined) episode = 1
    const info = {
        url, season, episode
    }
    console.log(info)
    if (!(url)) return res.send("no url present");
    const title_id = (url.split("imdb=")[1]).split("?")[0]
    console.log()
    const urlToContent = `${CDN_LINK}/${title_id}s${season}e${episode}.mp4`

    fetch(urlToContent)
        .then((res) => {
            if (res.statusCode == 404) return res.status(404);
            return res.status(200)

        })
})

const uploadFile = async (file_name, resp, redirect) => {
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
      res.on('data', async (chunk) => {
        console.log(chunk.toString('utf8'));
        console.log("redirecting")
        await fs.unlinkSync(file_name)
        if (redirect) resp.redirect(`${CDN_LINK}/${file_name}`);

        return true;
      });
    });
  
    req.on('error', (error) => {
      console.error(error);
    });
  
    readStream.pipe(req);


};


app.get('/checkMembership', async (req,res) => {
    const {email} = req.query

    res.send(await checkMembership(email))
    
})


let browser;

const request = require('request-promise');
const { title } = require('process');
app.get('/', (req, res) => {
  res.send('Hello World!')
})


async function downloadM3(m3u8_urls, res, req, info, i, download_began, redirect) {
    if (download_began) return; 
    const title = req.query.url.split("imdb=")[1]
    //res as in express.js response
    const file_name = `${title}s${info.season}e${info.episode}.mp4`

        console.log("Converting!")
        try {
            if (i == m3u8_urls.length) return console.log("failed to find valid m3u8");
            converter.setInputFile(m3u8_urls[i])
            converter.setOutputFile(file_name)
            converter.start()
                .then(() => {
                    uploadFile(file_name, res, redirect)
                })
                .catch((err) => {
                    console.log("Conversion failed: " + err)
                    console.log(err)
                    downloadM3(m3u8_urls, res, req, info, i + 1, false, redirect)
                })
        } catch (err) {
            console.log(err)
            downloadM3(m3u8_urls, res, req, info, i + 1, false, redirect)
        }
}

app.get('/stream', (req, res) => {
    let {url, season, episode} = req.query;
    if (season == undefined) season = 1;
    if (episode == undefined) episode = 1
    const info = {
        url, season, episode
    }
    console.log(info)
    if (!(url)) return res.send("no url present");
    const title_id = (url.split("imdb=")[1]).split("?")[0]
    console.log()
    const urlToContent = `${CDN_LINK}/${title_id}s${season}e${episode}.mp4`
    
    fetch(urlToContent)
        .then((r) => {
            if (r.status == 404) {
                upload(info)
                res.status(404)
            } else {
                res.status(200)
            }
        })
        .catch(() => {
            res.status(404)
            upload(info)
        })
    const upload = (info) => {return grabM3u8(this.browser, res, req, info, false)}
});
    

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
    console.log(info)
    if (!(url)) return res.send("no url present");
    const title_id = (url.split("imdb=")[1]).split("?")[0]
    console.log()
    const urlToContent = `${CDN_LINK}/${title_id}s${season}e${episode}.mp4`
    console.log("url to content: " + title_id)
    fetch(urlToContent)
        .then((res) => {
            if (res.status == 404) return grabM3u8(this.browser, resp, req, info, true)
            console.log("found! redirecting");
            return resp.redirect(urlToContent)
        })
        .catch(() => {
            console.log("testing error, caught an error, proceed");
            grabM3u8(this.browser, resp, req, info, true)

        })
    // if 
    // const cdn_status_code = ().statusCode
    // console.log(cdn_status_code)
    // if (cdn_status_code != 404) {
    //     console.log("title found in cdn, redirecting")
    //     return res.redirect(urlToContent)
    // };
    
})



async function grabM3u8(browser, res, req, info, redirect) {
    const url = info.url;
    console.log("not found in cdn. downloading...")
    const m3u8_urls = []
    try {
        await browser.newPage()   
            .then(async (page) => {
                console.log("new page created")
                let download_began = false
                page.on('response',  async response => {
                    if (response.url().endsWith(".m3u8")) {
                        m3u8_urls.push(response.url())
                        console.log("url found in resp")
                        wait(7000).then(async () => {
                            downloadM3(m3u8_urls, res, req, info, 0, download_began, redirect)
                            download_began = true
                            await page.close()
                        })
                    }
                })
                request(`https://${url}`, {resolveWithFullResponse: true})
                    .then(async (body) => {
                        if (body.statusCode != 200) {
                                await page.close()
                                return res.send("Invalid movie! doesnt exist in database")
                            }
                    })
                    .catch(async (err) => {
                        console.log(err)
                        console.log("movie dont exist in db")
                        await page.close()
                        return res.send("Invalid movie! doesnt exist in database")
                    })
            
                let full_url;
                if (url.split("/movie?").length == 1) full_url = `${url}&season=${info.season}&episode=${info.episode}`
                else full_url = url;     
                               
                console.log(full_url)
                page.goto(`https://${full_url}`)
                    .then(async () => {
                        await page.locator("#player_iframe").click({ force: true });
                        await page.locator("#player_iframe").click({ force: true });
                        console.log("clicked")                        
                    })
                    .catch(async err => {
                        res.send("error occured. please stay on this page while the file downloads.")
                        await page.close()
                    })

            })

        }
        
            
        catch (err) {
            console.log("ERROR +++ " + err)
            res.send("error occured. please stay on this page while the file downloads.")
            page.close()
        }
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

