const express = require('express')
const path = require('path')
const app = express()
const port = 3000

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const {checkMembership} = require("./utils/checkIfMember.js")

const wait = ms => new Promise(res => setTimeout(res, ms));
require("json-circular-stringify");

// const TwoCaptcha = require("@2captcha/captcha-solver")

const videoExtensions = ["webm", "mkv", "flv", "vob", "ogv", "ogg", "rrc", "gifv", "mng", "mov", "avi", "qt", "wmv", "yuv", "rm", "asf", "amv", "mp4", "m4p", "m4v", "mpg", "mp2", "mpeg", "mpe", "mpv", "m4v", "svi", "3gp", "3g2", "mxf", "roq", "nsv", "flv", "f4v", "f4p", "f4a", "f4b", "mod"]


const { parse } =require('node-html-parser');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.redirect("https://soap2daymovies.app")
  })
  

app.get('/checkMembership', async (req,res) => {
    const {email} = req.query
    res.send(await checkMembership(email))
    
})

// const searchResults = []

async function checkCaptcha() {
    const captcha = (await page.$("#recaptcha"))
    console.log(captcha)

    if (!(captcha == null)) {
        await page.click("#recaptcha")
        await page.waitForSelector('.captcha-solver')

        const captcha_screen = await page.$eval(`div[style*="visibility: visible"]`, element => {
            element.setAttribute('style', "")
            console.log(element)
        })
        await wait(4000)
        await page.click('.captcha-solver-info')
        await wait(2000)
        console.log("clicked")
        await page.click('.captcha-solver-info')
        await wait(2000)
        console.log("clicked")
        await page.click('.captcha-solver-info')
        await wait(2000)
        console.log("clicked")

        return await page.waitForSelector("#searchform", {timeout: 180000})
    }


    else return console.log("an error occured while trying to solve captcha");


}
let search_results = []

async function getResults(query, start=0, redirect=false, ) {
    if (start >= 20) return search_results;
    if (redirect==true) {
        console.log('redirecting')
        await page.goto(`https://google.com/search?q=${query}&start=${start}`)
            .catch((err) => {
                console.log('navigation error, likely proxy slow')
            })
    }
    
    const not_found = await page.$('.card-section > p:nth-child(1)')
    console.log(`not_found var: ${not_found}`)
    if (not_found) {
        return search_results
    }

    const isResultsFound = await page.waitForSelector("h3", {timeout: 60000})
    console.log(`isResultsFound var: ${isResultsFound}`)
    let page_results = []
    if (isResultsFound != null) {
        page_results = await page.$$eval("h3", (elements, page_results) => {
            elements.map(el => {
                const t_name = el.innerHTML
                const t_url = el.parentElement.href;
                const result = {
                    name: t_name,
                    url: t_url,
                }
                page_results.push(result)
            })
            return page_results
        }, page_results)

        // console.log(JSON.stringify(results))


        search_results.push({
            start: start,
            results: page_results
        })
        return getResults(query, start + 10, true)        
    }
    else return search_results;
}


async function searchGoogle(title, dorkMode=0) {
    
    let result_count = 0;
    let query = [`intext:"${title}" (avi|mkv|.mov|mp4|mpg|wmv|flv) intitle:"index.of./" -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml|py) -inurl:(index_of|index.of|listen77|mp3raid|mp3toss|mp3drug|unknownsecret|sirens|wallywashis)`, `-inurl:htm -inurl:html intitle:"index of" (avi|mp4|mkv) "${title}"`]
    query = query[dorkMode]
    await wait(2000)
    await page.goto(`https://google.com/search?q=${query}`)
    await checkCaptcha()
    console.log("captcha finished, beginnning scraped")
    const scraped_results = (await getResults(query, 0, false, dorkMode))
    return scraped_results;

    // await page.exposeFunction("setter", (key, val) => result_map.set(key, val))
    // if (isResultsFound != null) {
    //     page.$$eval("h3", (elements, result_map) => {
    //         elements.map(el => {
    //             const t_name = el.innerHTML
    //             console.log(el.parentElement.href)
    //             setter(t_name, "")
    //             console.log(result_map)
    //         })
    //     },result_map)
    // }


}


let browser;
let page;

// app.get("/results", async (req, res) => {
//     const {title} = req.query
    
//     res.render("results")
// })

var re = /(?:\.([^.]+))?$/;
let site_results = []
async function recursivelyFindVideos(directory, files_found) {
    fetch(directory)
        .then(async (response) => {
            const html = await response.text()

            let dom = parse(html)
            //if pre tag is found, parse + process inner pre text 
            if (dom.querySelector('pre') != null) dom = parse(dom.querySelector('pre').rawText)
            const directories = dom.querySelectorAll('a')
            for (let dir of directories) {
                const sub_dir = dir.getAttribute('href')
                if (!(sub_dir == "." || sub_dir == ".." || sub_dir == "/" || sub_dir == "../")) {
                    let extension = re.exec(sub_dir)[1]
                    if(videoExtensions.includes(extension)) {
                        // console.log(`file found : ${directory}${sub_dir}`)
                        site_results.push(`${directory}${sub_dir}`)
                        console.log(site_results)
                    }
                    else {
                        console.log('fun call!')
                        // console.log(`visiting ${directory}${sub_dir}`)
                        await recursivelyFindVideos(`${directory}${sub_dir}`, files_found)
                    }
                }
            }
        })
        .catch(err => {
            console.log(err)
        })
        return site_results
    // let html;

    // fetch(directory)
    //     .then(async res => {
    //         html = await res.text();
    //     })
    //     .catch(err => {
    //         console.log(err)
    //     })
    
    // if (html == undefined) return; 

//     .then(async (response) => {
//         // console.log("********************************************")
// //        console.log(directory)
        
//         return returnFiles(files_found)
//             // for (let ext of videoExtensions) {
//             //     if (sub_dir.endsWith(ext)) {
//             //         console.log(`file found : ${sub_dir}`)
//             //     }
//             //     else {
//             //         console.log(`visiting ${directory}/${sub_dir}`)
//             //         recursivelyFindVideos(`${directory}/${sub_dir}`)
//             //     }
//             // }


//             // if (sub_dir != '' || sub_dir != "/") extension = sub_dir.split('.') // Extract the extension after the last dot
//             // extension = extension[1];
//             // console.log(sub_dir)
//             // console.log(extension)
//             // if (!(extension == null || extension == undefined)) {
//             //     if (videoExtensions.some(ext => ext === extension)) {
//             //     };
//             // }
//             // else {
//             // }
      
        
//         console.log("********************************************")

//     })
//     .catch(err => {
//         console.log(err)
//         console.log(`${directory} failed`)
//     });

    // return (returnFiles = (files) => {return files})()



};

//@OVERRIDE



app.get("/scrape", async (req, res) => {
    try {
        const proxy = (() => require('fs').readFileSync('proxies.txt', 'utf8').split('\n').filter(Boolean)[Math.floor(Math.random() * require('fs').readFileSync('proxies.txt', 'utf8').split('\n').filter(Boolean).length)])(); 
        await (async () => {
            const pathToExtension = require('path').join(__dirname, '2captcha-solver');
            puppeteer.use(StealthPlugin())
            browser = await puppeteer.launch({
                headless: false,
                args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
                `--proxy-server=http://${proxy}`,
                '--ignore-certificate-errors',
                ],
                executablePath: "/usr/bin/google-chrome"
            })
            page = (await browser.pages())[0]
            await page.authenticate({
                username: "scraperapi.country_code=us.device_type=desktop",
                password: "a3c8252319373673cfb9b9cd4115dcc1"
            })
            
        })();

        const {title} = req.query
        const response = await searchGoogle(title, 1)
        // const response = await searchGoogle(title)
        // console.log(response)
        const db_results = []
        search_results = []
        for (let page of response) {
            results = page.results
            for (let result of results) {
                const directory = result.url;
                // const indexes = await (await fetch(directory)).text()
                if (directory == `http://movie.basnetbd.com/Data/TV%20Series/Breaking%20Bad/`) {
                    site_results = []
                    const results = await recursivelyFindVideos(directory,site_results) 

                    // console.log(files)
                    console.log(`results :::::: ${site_results}`)

                    db_results.push(results)
                    await res.send(JSON.stringify(results))
                }

                // console.log(files)
                // await res.send(files)
                // files = []
            }
            // for (let result of page) {
            //     console.log(result.url)
            // }
        }
        // await res.send(db_results)
        // await browser.close()

        // await res.render("results", {
        //     response: response
        // })
        // return await res.send(response)
    }
    catch (e) {
        console.log(e)
        await browser.close()
    }


    //create hashmap using file_name: file_url as key:value
    // const result_map = new Map()

    // let result_count = 0;
    // console.log(page)    
    // while (result_count <= 50) {

    //     // const titles = await page.$$("h3")

    //     // console.log(titles)
    //     // for (let t of titles) {
    //     //     console.log(t)

    //     // }
    // }

    // console.log(result_map)
    // await wait(60000)
    // searchGoogle("good will hunting")
    // await wait(60000)
    // searchGoogle("teen titans go")
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

// function addToQueue(title) {
//     queue.push({title})

//     //if above object is only member of queue
//     if (queue.length == 1) {
//         return searchGoogle(title)
//     }
// }

// function startNextQueue() {
//     let last_upload = queue.shift()
//     console.log("current queue length is " + queue.length)
//     if (queue.length == 0) return console.log('queue empty');

//     return addToQueue(queue[0].title)
// }

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
  

