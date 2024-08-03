const puppeteer = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
puppeteer.use(pluginStealth());
const environment = require('./environment.js');
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
require("firebase/database");

firebase.initializeApp(environment.firebaseConfig);

async function scrapeDataRozaje() {
  try {
    const latestUrl = await getLatestLink();
    if (latestUrl) {
      const data = await scrapeRozajeData(latestUrl);
      if (data) {
        await insertDataToFirebase(data);
        process.exit(1);
      }
    }
  } catch (err) {
    console.error('Error in scrapeDataRozaje:', err.message);
  }
}

async function getLatestLink() {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto('https://www.ijzcg.me/', { timeout: 0, waitUntil: 'networkidle0' });

    const hrefs = await page.$$eval('a', as => as.map(a => a.href));
    return hrefs.find(href => href.toLowerCase().includes('presjek'));
  } catch (err) {
    console.error('Error in getLatestLink:', err.message);
  } finally {
    await browser.close();
  }
}

async function scrapeRozajeData(url) {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { timeout: 0, waitUntil: 'networkidle0' });

    const allText = await page.$eval('*', el => el.innerText);
    const rozajeFinderArray = allText.split("Rožaje");
    const dateOfPublishing = allText.split("Objavljeno:")[1].substring(0, 13).trim();

    const currentData = extractRozajeData(rozajeFinderArray);
    if (currentData) {
      return {
        Datum: dateOfPublishing,
        Grad: currentData[0],
        Aktivni: currentData[1],
        Oporavljeni: 'Nepoznato',
        Umrli: 'Nepoznato'
      };
    }
  } catch (err) {
    console.error('Error in scrapeRozajeData:', err.message);
  } finally {
    await browser.close();
  }
}

function extractRozajeData(rozajeFinderArray) {
  const latestEntry = rozajeFinderArray[rozajeFinderArray.length - 1];
  let finalData = "Rožaje";
  for (let i = 0; i < 31; i++) {
    finalData += latestEntry[i];
  }
  return finalData.split("\n").filter(item => item !== "" && item !== "\t");
}

async function insertDataToFirebase(data) {
  try {
    await firebase.database().ref('dailyStatistics').push({
      activeCases: data.Aktivni,
      recovered: data.Oporavljeni,
      deaths: data.Umrli,
      date: data.Datum,
    });
  } catch (err) {
    console.error('Error in insertDataToFirebase:', err.message);
  }
}

scrapeDataRozaje();
