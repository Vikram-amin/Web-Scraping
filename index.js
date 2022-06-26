const puppeteer = require("puppeteer");
const fs = require("fs");

const scrape = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const context = browser.defaultBrowserContext();
  await context.overridePermissions("https://food.grab.com/sg/en/restaurants", [
    "geolocation",
  ]);
  await page.setGeolocation({ latitude: 90, longitude: 20 });
  await page.goto("https://food.grab.com/sg/en/restaurants", {
    waitUntil: "networkidle0",
  });

  let data = [];

  page.on("response", async (response) => {
    if (
      response.url().startsWith("https://portal.grab.com/foodweb/v2/search") &&
      response.request().method() !== "OPTIONS"
    ) {
      const respData = await response.json();
      const modifiedData = respData.searchResult.searchMerchants.map((item) => {
        return { name: item.address.name, latlng: item.latlng };
      });
      data = [...data, ...modifiedData];
      fs.writeFile("./data.json", JSON.stringify(data), (err) => {
        if (err) {
          console.error(err);
          return;
        }
        //file written successfully
      });
    }
  });

  const clickLoadMore = async () => {
    await page.click("button[type=button]", { waitUntil: "networkidle0" });
  };

  setInterval(async () => {
    await clickLoadMore();
  }, 10000);
};

scrape();
