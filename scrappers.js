  const puppeteer = require('puppeteer-extra');
  const pluginStealth = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(pluginStealth());

  async function scrappeDataRozaje(){
      (async () => {
        scraperForRozaje(await latestLink());  
      })();
  }

  async function latestLink(){
    
    const browser = await puppeteer.launch();   
    
        try {
    
          const mainPage = await browser.newPage();
          await mainPage.goto('https://www.ijzcg.me/',{timeout: 0, waitUntil: 'networkidle0'});
    
          //SCRAPING ALL THE TEXT FROM THE PAGE
          const hrefs = await mainPage.$$eval('a', as => as.map(a => a.href));
    
          //GETTING THE LATEST LINK WITH PRESJEK SUBSTRING WITHIN IT
          return await hrefs.filter((data) =>  JSON.stringify(data).toLowerCase().indexOf("presjek".toLowerCase()) !== -1)[0];
          
    
        } catch (err) { 
          console.error(err.message);
        } finally {
          await browser.close();
        }
  }

  async function scraperForRozaje(url){

    const browser = await puppeteer.launch();   
    try {
      const page = await browser.newPage();
      await page.goto(url,{timeout: 0, waitUntil: 'networkidle0'});
      //SCRAPING ALL THE TEXT FROM THE PAGE
      const allText = await page.$eval('*', el => el.innerText); 

      //SPLITIING THE TEXT INTO ARRAY WITH STARTING WORD Rožaje
      let rozajeFinderArray = allText.split("Rožaje");
      let dateOfPublishing = allText.split("Objavljeno:")[1].substring(0, 13);

      let arrayOfData = [];
      for(let j = 0; j < rozajeFinderArray.length; j++){

        let finalData = "Rožaje";

        for(let i = 0; i < 31; i++){
          finalData+= rozajeFinderArray[j][i]
        }

        finalData = finalData.split("\n").filter(item => item != "" && item !="\t");
        arrayOfData.push(finalData);
      
      }

      let currentData = arrayOfData[arrayOfData.length - 1];

      let objectData = {
                        "Datum": dateOfPublishing.toString().trim(), 
                        "Grad": currentData[0], 
                        "Aktivni": currentData[1], 
                        "Oporavljeni": currentData[2],
                        "Umrli": currentData[3]
                      };

      insertTheDataToFirebase(objectData);

      } catch (err) { 
        console.error(err.message);
      } finally {
        await browser.close();
      }
  }

 // Add the Firebase products that you want to use
 var firebase = require("firebase/app");
 require("firebase/auth");
 require("firebase/firestore");
 
 
 var firebaseConfig = {
     apiKey: 'AIzaSyCJ7c9yyP-fhFZl5WoyiwU7ntGqB6BrL54',
     authDomain: 'covid-19-rozaje.firebaseapp.com',
     databaseURL: 'https://covid-19-rozaje.firebaseio.com',
     projectId: 'covid-19-rozaje',
     storageBucket: 'covid-19-rozaje.appspot.com',
     messagingSenderId: '317837040399',
     appId: '1:317837040399:web:2a82de07fe691d5c27bc7a',
     measurementId: 'G-843Q7THJ64',
 };
 
 // Initialize Firebase
 firebase.initializeApp(firebaseConfig);
 
 var firebase = require("firebase");
 

function insertTheDataToFirebase(data) {
  firebase.database().ref('dailyStatistics').push({
    activeCases: data.Aktivni,
    recovered: data.Oporavljeni,
    deaths: data.Umrli,
    date: data.Datum,
  })
  .then(function onSuccess(res) {
    process.exit(1);
  })
}


scrappeDataRozaje();

