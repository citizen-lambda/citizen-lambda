const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on("console", (msg) => console.log(msg.text()));

  const cdp = await page.target().createCDPSession();
  await cdp.send("Network.enable");
  await cdp.send("Page.enable");
  cdp.on(
    "Network.eventSourceMessageReceived",
    ({ requestId, timestamp, eventName, eventId, data }) =>
      console.log(requestId, timestamp, eventName, eventId, data)
  );

  await page.goto(
    "http://localhost:4200/programs/1/observations#observations",
    {
      waitUntil: "networkidle2",
    }
  );

  await page.waitFor(1200);
  await page.waitFor("*");
  await page.waitForXPath('//*[@id="obslist"]/div[2]/p/text()[2]');

  const match = await page.$("div.obs-count > p");
  const count = await match.evaluate((node) => node.innerText);
  console.debug(count);

  const date = new Date();
  await page.screenshot({ path: `example-${date.toISOString()}.png` });
  console.log("success");
  browser.close();
})();
