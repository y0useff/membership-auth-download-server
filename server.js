const express = require('express')
const path = require('path')
const app = express()
const port = 3000
const {_2CAP_KEY} = require("./config.json")

const puppeteer = require('puppeteer');

const {checkMembership} = require("./utils/checkIfMember.js")

const wait = ms => new Promise(res => setTimeout(res, ms));

const TwoCaptcha = require("@2captcha/captcha-solver")
const solver = new TwoCaptcha.Solver(_2CAP_KEY)

let browser;

(async () => {
    await puppeteer.executablePath
    this.browser = await puppeteer.launch({browser:"firefox", headless: false}  )
    console.log("Firefox browser launched!")
})()

app.get('/', (req, res) => {
    res.redirect("https://soap2daymovies.app")
  })
  

app.get('/checkMembership', async (req,res) => {
    const {email} = req.query
    res.send(await checkMembership(email))
    
})



//@OVERRIDE
app.get("/download", async (req, res) => {
    const {title} = req.query
    console.log(title)

    //create hashmap using file_name: file_url as key:value
    const result_map = new Map()

    const page = await this.browser.newPage()
    let result_count = 0;

    while (result_count <= 50) {
        let query = `intext:"${title}" (avi|mkv|.mov|mp4|mpg|wmv|flv) intitle:"index.of./" -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml|py) -inurl:(index_of|index.of|listen77|mp3raid|mp3toss|mp3drug|unknownsecret|sirens|wallywashis)&start=${result_count}`
        await page.goto(`https://google.com/search?q=${query}`)
        
        const captcha = (await page.locator("#recaptcha"))
        console.log(captcha)

        if (!(captcha == undefined)) {

            const captcha_key = await page.evaluate(`document.querySelector("#recaptcha").getAttribute("data-sitekey")`)
            const data_s = await page.evaluate(`document.querySelector("#recaptcha").getAttribute("data-s")`)

            solver.recaptcha({
                pageurl: page.url(),
                googlekey: captcha_key,
                datas: data_s

              })
            .then(async (res) => {
                const token = res.data
                console.log(token)
                const text_area = (await page.locator("#g-recaptcha-response"))
                console.log(text_area)
                await page.evaluate(`document.querySelector('#g-recaptcha-response').textContent = "${token}";`)
                console.log("filled")
                await (await page.locator("#recaptcha")).click()
                console.log("clicked")
            })
              .catch((err) => {
                console.log(err);
              })
        }



        // const titles = await page.locator("h3").all()


        await wait(150000)
        for (let t of titles) {
            const title_text = t.textContent;
        
            //search for elements which contain the title, to find the parent, then access the href, of the a tag
            const title_url = (await page.locator('a', {has: t})).href;
            console.log(title_text)
            console.log(title_url)

            result_map.set(title_text,title_url)
            result_count = result_count + 1;
        }
    }



    await wait(10000)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })




/* **m3u8 -> mp4 conversion code**
!!! REMOVED DEPENDENCIES
//const {signUrl} = require("./utils/tokenCdnUrl.js")
//const {getRapidGatorToken} = require('./utils/getRapidGatorToken.js');
//const queue = [];
//const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
// const m3u8ToMp4 = require("m3u8-to-mp4");
// const converter = new m3u8ToMp4()

// const crypto = require('crypto')

// const request = require('request-promise');


// const {REGION, BASE_HOSTNAME, STORAGE_ZONE_NAME, ACCESS_KEY, CDN_LINK} = require("./config.json")

// const { test, expect } = require('@playwright/test');
// const fs = require('fs')
// const https = require('https')

// const fetch = require('node-fetch')
*/

/* !!! DEPRECATED app.get('/download', async (req, resp) => {
    let {url, season, episode, email} = req.query;
    if (season == undefined) season = 1;
    if (episode == undefined) episode = 1
    const info = {
        url, season, episode
    }
    console.log(info)
    console.log(email)
    for (let item of queue) {
        if (item.email == email) {
            return resp.send("You currently have something in queue to download!")
        }
    }
    if (!(url)) return resp.send("no url present");
    const title_id = (url.split("imdb=")[1]).split("?")[0]
    return addToQueue(this.browser, resp, req, info, true, email)

    // console.log()
    // const urlToContent = signUrl(`${CDN_LINK}/${title_id}s${season}e${episode}.mp4`)
    // console.log("url to content: " + title_id)
    fetch(urlToContent)
        .then((res) => {
            //this block of code is fucking shit up with bunny cdn down
            //all links resolve correctly with pull bunny down
            //address this
            return addToQueue(this.browser, resp, req, info, true, email)
            // if (res.status == 404) return addToQueue(this.browser, resp, req, info, true, email)
            // console.log("found! redirecting");
            // return resp.redirect(urlToContent)
        })
        .catch(() => {
            console.log("testing error, caught an error, proceed");
            addToQueue(this.browser, resp, req, info, true, email)

        })
    // if 
    // const cdn_status_code = ().statusCode
    // console.log(cdn_status_code)
    // if (cdn_status_code != 404) {
    //     console.log("title found in cdn, redirecting")
    //     return res.redirect(urlToContent)
    // };
    
})
*/

/* !!! DEPRECATED function addToQueue(browser, res, req, info, redirect, email) {
    queue.push({browser, res, req, info, redirect, email})

    //if above object is only member of queue
    if (queue.length == 1) {
        return grabM3u8(browser, res, req, info, redirect)
    }
} */

/* !!! DEPRECATED function startNextQueue() {
    let last_upload = queue.shift()
    console.log("current queue length is " + queue.length)
    if (queue.length == 0) return console.log('queue empty');

    return grabM3u8(queue[0].browser, queue[0].res, queue[0].req, queue[0].info, queue[0].redirect)
} */

/* !!! DEPRECATED app.get("/validateTitle", (req, res) => {
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
    const urlToContent = signUrl(`${CDN_LINK}/${title_id}s${season}e${episode}.mp4`)

    fetch(urlToContent)
        .then((r) => {
            if (r.status == 404) return res.sendStatus(404);
            return res.sendStatus(200)
        })
        .catch(() =>{
            return res.sendStatus(404)
        })
}) */

/* !!! DEPRECATED const uploadFile = async (file_name, resp, redirect) => {

    const FILE_PATH = `${file_name}`
    const FILENAME_TO_UPLOAD = `${file_name}`
    
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(FILE_PATH)

    stream.on('data', (data) => {
        hash.update(data);
        console.log(hash)
    });
    stream.on('end', () => {
        hash.digest('hex');
        console.log(hash)
    });

    console.log(hash)

    console.log(fs.stat(FILE_PATH))

    const readStream = fs.createReadStream(FILE_PATH);
  
    // const options = {
    //   method: 'PUT',
    //   host: HOSTNAME,
    //   path: `/${STORAGE_ZONE_NAME}/${FILENAME_TO_UPLOAD}`,
    //   headers: {
    //     AccessKey: ACCESS_KEY,
    //     'Content-Type': 'application/octet-stream',
    //   },
    // };
  
    // const req = https.request(options, (res) => {
    //   res.on('data', async (chunk) => {
    //     console.log(chunk.toString('utf8'));
    //     console.log("redirecting")
    //     await fs.unlinkSync(file_name)
    //     if (redirect) resp.redirect(signUrl(`${CDN_LINK}/${file_name}`));
    //     console.log('moving on in queue')
    //     startNextQueue()
    //     return true;
    //   });
    // });
  
    // req.on('error', (error) => {
    //   console.error(error);
    //   console.log("Upload failed!")
    //   startNextQueue()
    // });


    // readStream.pipe(req);
}; */

/* !!! DEPRECATED async function downloadM3(m3u8_urls, res, req, info, i, download_began, redirect) {
    if (download_began) return; 
    const title = req.query.url.split("imdb=")[1]
    //res as in express.js response
    const file_name = `${title}s${info.season}e${info.episode}.mp4`

        console.log("Converting!")
        try {
            if (i == m3u8_urls.length) {
                startNextQueue()
                return console.log("failed to find valid m3u8");
            }
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
} */

/* !!! DEPRECATED app.get('/stream', (req, res) => {
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
    const urlToContent = signUrl(`${CDN_LINK}/${title_id}s${season}e${episode}.mp4`)
    
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
    const upload = (info) => {return addToQueue(this.browser, res, req, info, false)}
}); */

/* !!! DEPRECATED async function grabM3u8(browser, res, req, info, redirect) {
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
                                startNextQueue()
                                return res.send("Invalid movie! doesnt exist in database")
                            }
                    })
                    .catch(async (err) => {
                        console.log(err)
                        console.log("movie dont exist in db")
                        await page.close()
                        startNextQueue()
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
                        startNextQueue()
                        await page.close()
                    })

            })

        }
        
            
        catch (err) {
            console.log("ERROR +++ " + err)
            res.send("error occured. please stay on this page while the file downloads.")
            startNextQueue()
            page.close()
        }
}*/
  

