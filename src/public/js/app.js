class Mashed {
  constructor() {
    this.search = this.search.bind(this);

    this.initialize();
    this.addEventListeners();
  }

  initialize() {
    // Egenskaper för instanser av den här klassen, används för att referera till samma Node/Element i DOM.
    this.sentinel = document.querySelector('.sentinel');
    this.searchInput = document.querySelector('.search input');
    this.searchBtn = document.querySelector('.search button');
    this.sidebarWords = document.querySelectorAll('aside ul');
    this.searchResultsContainer = document.querySelector('.results ul');

    // Frivilligt: för att visa en laddningsindikator!
    this.loadingIndicator = document.querySelector('.loader');
  }

  /**
   * Metod som sätter upp våra eventlyssnare
   */
  addEventListeners() {
    // Eventlyssnare för sök-knappen
    this.searchBtn.addEventListener('click', event =>
      this.search(event, this.searchInput.value)
    );

    /*
    * Eventlyssnare för alla ord i sidomenyn
    * För mer information om forEach: https://mzl.la/IysHjg
    */
    this.sidebarWords.forEach(wordEl =>
      wordEl.addEventListener('click', event =>
        this.search(event, event.target.textContent)
      )
    );
  }

  /**
   * Metod (används som callback) för att hantera sökningar
   *
   * @param {*} event Det event som gjorde att denna callback anropades
   * @param {*} [searchString=null] Den söksträng som användaren matat in i fältet, är null by default
   */
  search(event, searchString = null) {
    event.preventDefault();
    // Om söksträngen inte är tom och är definierad så ska vi söka
    if (this.checkSearchInput(searchString)) {
      console.log(`Trigga sökning med ${searchString}`);
      
      // 1) Bygg upp en array med anrop (promise) till fetchFlickrPhotos och fetchWordlabWords med searchString
      // Notera: att ordningen du skickar in dessa i spelar roll i steg 3)

      let flickResult = this.fetchFlickrPhotos(searchString);
      let wordlabResult = this.fetchWordlabWords(searchString);
      let promiseArray = [flickResult, wordlabResult];

      // 2) Använd Promise.all för att hantera varje anrop (promise)
      Promise.all(promiseArray)
        .then(result => {
          return result.map(response => {
            if (response.status === 200) {
              return response.json(); //Gör om Response.body till JSON
            } else {
              console.error("Något gick galet!") //Gör en bättre utskrift för användaren
            }
          })
        })
        .catch((error) => console.error(error)) //Gör något bättre
        .then((result) => {
          Promise.all(result).then((data) => {
            //Skicka data för utskrift
            this.renderFlickrResults(data[0]);
            this.renderWordlabResults(data[1]);
          })
        })
      .catch(error => console.error(error)) //Gör  bättre utskrift för anvädaren
 
      // 2 a) then(results) => Om varje anrop lyckas och varje anrop returnerar data

      // 3) För varje resultat i arryen results, visa bilder från FlickR or ord från WordLab.
      // 4 results[0] kommer nu innehålla resultat från FlickR och results[1] resultat från WordLab.
      // 5 skapa element och visa dem i DOM:en med metoderna (renderFlickResults och renderWordlabResults)

      // 2 b) catch() => Om något anrop misslyckas, visa felmeddelande
      let inputField = document.querySelector(".search input");
      inputField.value = "";
    } else {
      console.log(
        `Söksträngen är tom, visa ett meddelande eller bara returnera`
      );
      return;
    }
  }

  /**
   * Metod som används för att kolla att söksträngen är giltig
   *
   * @param {*} searchString Söksträngen som matats in av användaren
   * @returns Boolean (true/false)
   */
  checkSearchInput(searchString) {
    return searchString && searchString.trim().length > 0;
  }

  /**
   *  Metod som används för att göra API-anrop till Flickr's API för att få bildresultat.
   *
   * @author (Set the text for this tag by adding docthis.authorName to your settings file.)
   * @param {*} searchString Söksträngen som matats in av användaren
   * @returns {Promise} Ett fetch() Promise
   */
  fetchFlickrPhotos(searchString) {
    let flickrAPIkey = `7ea9dd27dfc81721b63e798b2d91a755`; // Din API-nyckel här
    let flickerAPIRootURL = `https://api.flickr.com/services/rest/?`; // Grundläggande delen av Flickr's API URL

    // Olika sökparametrar som behövs för Flickr's API. För mer info om detta kolla i Flickrs API-dokumentation
    let flickrQueryParams = `&method=flickr.photos.search&api_key=${flickrAPIkey}&text=searchString&extras=url_q, url_o, url_m&format=json&tags=${searchString}&license=2,3,4,5,6,9&sort=relevance&parse_tags=1&nojsoncallback=1`;
    let flickrURL = `${flickerAPIRootURL}${flickrQueryParams}`;

    return fetch(flickrURL);
  }

  /**
   * Metod som används för att göra API-anrop till wordlab API:et för att få förslag på andra söktermer
   *
   * @param {*} searchString Söksträngen som matats in av användaren
   * @returns {Promise} Ett fetch() Promise
   */
  fetchWordlabWords(searchString) {
    let wordLabAPIkey = `fc2bfc6d19223e3c76372747fffc9714`; // Din API-nyckel här
    let wordLabURL = `http://words.bighugelabs.com/api/2/${wordLabAPIkey}/${searchString}/json`;

    return fetch(wordLabURL);
  }

  /**
   * Metod som skapar bild-element och relaterade element för varje sökresultat mot Flickr
   *
   * @param {Object} data Sökresultaten från Flickr's API.
   */
  renderFlickrResults(data) {
    let bilder = document.getElementById("bilder");
    let photos = data.photos.photo;
    bilder.innerHTML = ""; //Tar bort allt i listan.

    for (let index = 0; index < photos.length; index++) {
      let photo = photos[index];
      let li = document.createElement("li");
      li.setAttribute("class", "result");
      let imgShow = document.createElement("img");
      // Länk till bilder:
      // https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg

      let link = `https://farm${photo.farm}.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`
      let anchorTag = document.createElement("a");
      anchorTag.href = link;
      imgShow.src = link;
      anchorTag.appendChild(imgShow);
      li.appendChild(anchorTag);
      bilder.appendChild(li);
    }
  }

  /**
   * Metod som skapar ord-element för relaterade sökord som kommer från Wordlabs API
   *
   * @param {Object} data Sökresultaten från Flickr's API.
   */
  renderWordlabResults(data) {
    let suggestions = document.getElementById("suggestions");
    let words = [];
    if (!this.checkIfEmpty(data.noun)) {
      words = data.noun.syn;
    }
    if (!this.checkIfEmpty(data.verb)) {
      let verbs = data.verb.syn;
      words.push.apply(words, verbs);
    }
    
    //Rensa listan!
    suggestions.innerHTML = "";
    for (let index = 0; index < words.length; index++) {
      let word = words[index];
      let link = document.createElement("a");
      link.src = "#";
      link.innerHTML = word;
      let li = document.createElement("li");
      li.appendChild(link);
      suggestions.appendChild(li);
    }

  }
  /*
  * Metod som kontrollerar om något är undefined.
  */
  checkIfEmpty(data) {
    return (data === undefined);
  }
}

/**
   * Metod som lyssnar på mikrofonen och söker.
   */

function listenOnInput() {
  if (window.hasOwnProperty("webkitSpeechRecognition")) {
    let voiceInput = new webkitSpeechRecognition();
    let searchBtn = document.querySelector('.search button');
    voiceInput.continuos = false;
    voiceInput.interimResults = false;
    voiceInput.lang = "en-US";
    voiceInput.start();
    let inputField = document.querySelector(".search input");
    inputField.value = "";
    inputField.placeholder = "Searching..";
    voiceInput.onresult = function (e) {
      inputField.value = e.results[0][0].transcript;
      voiceInput.stop();
      searchBtn.click();
      inputField.placeholder = "Search for images…"
    };
    voiceInput.onnomatch = function (e) {
      console.log("fel");
      voiceInput.stop();
      inputField.value = "Couldn't hear anything!";
      inputField.placeholder = "Search for images…"
    };
    
    voiceInput.onerror = function (e) {
      voiceInput.stop();
      inputField.value = "Error occured in recognition";
      inputField.placeholder = "Search for images…"
    };
    voiceInput.onend = function (e) {
      inputField.placeholder = "Search for images…"
    };
  }
}

// Immediately-Invoked Function Expression, detta betyder att när JS-filen läses in så körs koden inuti funktionen nedan.
(function() {
  new Mashed();
})();
