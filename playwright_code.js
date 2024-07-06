// @ts-check
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('has title', async ({ page }) => {
  await page.goto('https://vidsrc.xyz/embed/tv?imdb=tt0903747');
  await wait (10000)
  await page.locator("#player_iframe").click({ force: true });
  await page.locator("#player_iframe").click({ force: true });
  await page.locator("#player_iframe").click({ force: true });


  page.on('request', request => {
    if (request.url().startsWith("https://tmstr.vidsrc.stream/stream/")) console.log(request.url())
  });
  page.on('response', response => {
    if (response.url().startsWith("https://tmstr.vidsrc.stream")) console.log(response.url())
  });
  await wait (100000)
  test.setTimeout(120000);
});

// /https://tmstr.vidsrc.stream/stream/H4sIAAAAAAAAAw3PwXKCMBRA0V_KQ7HaXRESZEwcMS8h2UFCRyUgw1Cp_fq6vatzd9CQ79oBkHYL23hDYNU2xO1a_9GsNm79aRm8eOaPPitGc5ml09aYaLf3_cjfPTValLUqJ6ceIAktfIqLHrpfJB3RA4LN1UVV4Q8h_JhoO10gmeuBTkegV9eHpY5sVZNu7WTRtzKbJBZDW2VPm_rbKR973rvY0nI60TKUd5WIaozL7AGOxXjWIuFsXrvMAnalsMPXC2k4cC0Mh5DY9BD53Cf8bmKHo2qkfTXRsiBebzJwch5C8TYnmAr1ftrIIKqaKSb3M9MoGFL1_Ae4_VzjIQEAAA--/master.m3u8