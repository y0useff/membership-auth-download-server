const express = require('express')
const app = express()
const port = 3000
const { test, expect } = require('@playwright/test');
const playwright = require('playwright');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/download', (req, res) => {
        (async () => {
            try {

                const browser = await playwright.firefox.launch();
                const page = await browser.newPage();
                let downloaded = false
                page.on('response', response => {
                    if ((response.url().startsWith("https://tmstr.vidsrc.stream/stream/")) && (downloaded == false)) {
                        downloaded = true;
                        browser.close()
                        return res.send(response.url())
                    }
                })
                page.on('request', request => {
                    if ((request.url().startsWith("https://tmstr.vidsrc.stream/stream/")) && (downloaded == false)) {
                        downloaded = true;
                        browser.close()
                        return res.send(request.url())
                    }
                });

                page.goto(req.query.url)
                .then(async () => {
                    await page.locator("#player_iframe").click({ force: true });
                    await page.locator("#player_iframe").click({ force: true });
                    await page.locator("#player_iframe").click({ force: true });
                })
            } catch (err) {
                console.log(err)
                res.send("uhhhhh")
            }
        })()

    })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

