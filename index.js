const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const { test, expect } = require('@playwright/test');
const playwright = require('playwright');
const fs = require('fs')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const m3u8ToMp4 = require('m3u8-to-mp4')
const converter = new m3u8ToMp4();
app.engine('pug', require('pug').__express)
app.set('views', path.join(__dirname, 'views'));


app.set('view engine', 'pug')

let browser;

const request = require('request-promise')
app.get('/', (req, res) => {
  res.send('Hello World!')
})


async function downloadM3(m3u8Url, res) {

    //res as in express.js response

    const response = await request(m3u8Url)
    await fs.writeFileSync("./output.m3u8", response)
    await res.download("./output.m3u8", async (err) => {
        await fs.unlinkSync('./output.m3u8')
    })

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
                .then((page) => {
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
                            return downloadM3(request.url(), res)
                            // return res.send(request.url())
                        }
                    });
                    page.on('request', request => {
                        if ((request.url().startsWith("https://tmstr.vidsrc.stream/stream/")) && (downloaded == false)) {
                            downloaded = true;
                            page.close()
                            console.log("url found in req")
                            return downloadM3(request.url(), res)
                            // return res.send(request.url())
                        }
                    });
                    const {url, season, episode} = req.query
                    const full_url = `${url}&season=${season}&episode=${episode}`
                    
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

