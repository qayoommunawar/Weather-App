// -----------------------------
//         Selectors
// -----------------------------

const searchInput = document.querySelector('#searchInput');
const weatherHero = document.querySelector('.weather-hero');
const weatherCondition = document.querySelector('.weather-hero__condition');
const heroTemp = document.querySelector('.weather-hero__temp');
const statsValues = document.querySelectorAll('.stats-card__value');
const statsNote = document.querySelectorAll('.stats-card__note');
const hourlyList = document.querySelector('.hourly-list');
const dailyForecast = document.querySelector('.daily__forecast');
const weatherCity = document.querySelector('.weather-hero__city');
const app = document.querySelector('.app');
const spinner = document.querySelector('.spinner');
const mainContainer = document.querySelector('.main__container');
const humidityValue = document.querySelector('.humidity-card__value');
const humidityNote = document.querySelector('.humidity-card__note')
const AQIValue = document.querySelector('.aqi-card__value');
const AQINote = document.querySelector('.aqi-card__note');
const searchBtn = document.querySelector('.search-bar__btn');
const emptyState = document.querySelector('.main__empty');
const error = document.querySelector('.error');
const emptyBtn = document.querySelector('.empty-hero__btn');
const overlay = document.querySelector('.overlay');
const emptyInput = document.querySelector('.empty-input');
const searchBg = document.querySelector('.bg');

// -----------------------------
//         VARIABLES
// -----------------------------

const bgMap = {
    'Rain' : `rain`,
    'Clear' : `sunny`,
    'Clouds' : `cloudy`,
    'Thunderstorm': 'thunder',
    'Snow': 'snow',
    'Fog': 'fog',
    'Mist': 'fog',
    'Haze': 'fog',
    'Smoke' : 'fog',
    'Dust'  : 'fog',
    'Sand'  : 'fog',
    'Ash'   : 'fog',
    'Squall': 'thunder',
    'Tornado': 'thunder',
    'Drizzle': 'rain',
    'Default': 'default'
}


const AQImap = {
    1: 'Air quality is good',
    2: 'Air quality is fair',
    3: 'Air quality is moderate',
    4: 'Air quality is poor',
    5: 'Air quality is very poor'
}

// -----------------------------
//         CORE LOGICS
// -----------------------------

// -------------- SEARCH BAR BACKGROUND ------------------

let scrollLimit = 5;
window.addEventListener('scroll', () => {
    if(window.scrollY > scrollLimit){
        searchBg.classList.add('scrolled');
    }else{
        searchBg.classList.remove('scrolled');
    }
})


// -------------- SEARCH LOGIC ------------------

searchBtn.addEventListener('click', () => {
    let value = searchInput.value.trim();
    if(!value) {
        renderInput()
    }else{
        getWeather(value);
        searchInput.value = '';
    }
    
})

searchInput.addEventListener('keydown', (e) => {
    let value = searchInput.value.trim();

    if(e.key === 'Enter'){
        if(!value) {
            renderInput()
        }else{
            getWeather(value);
            searchInput.value = '';
        }
    }

})

searchInput.addEventListener("blur", () => {
    requestAnimationFrame(() => {
        if(document.activeElement !== searchBtn){
            searchBtn.classList.remove('active');
        }
    })
});

searchInput.addEventListener("focus", () => {
    searchBtn.classList.add('active');
});


emptyBtn.addEventListener('click', () => {
    searchInput.focus();
})



// ------------- 
//            Funcitons 
// ---------------


// -------------- API FETCH FUNCTION ------------------


async function getWeather(city){
    renderSpinner();
    try{
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=a62213b61cd31cef1ba67cb6eb760504&units=metric`)
        const current = await response.json()
        if(!response.ok) {
            throw new Error(current.message)
        }else{
            mainContainer.classList.remove('sr-only');
            emptyState.classList.add('sr-only')
        }

        const { lat, lon } = current.coord

        const [forecastRes, airRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=a62213b61cd31cef1ba67cb6eb760504&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=a62213b61cd31cef1ba67cb6eb760504`)
        ])

        const [forecast, air] = await Promise.all([
            forecastRes.json(),
            airRes.json()
        ]);

        renderStats(current);
        renderBg(current);
        renderHourly(forecast.list);
        renderDaily(forecast.list);
        renderHero(current);
        renderAQI(air);

    }catch(err){
        renderError();
        console.log(err.message)
    }finally{
        removeSpinner();
    }
}

// -------------- SPINNER RENDER FUNCTION ------------------


function renderSpinner(){
    spinner.classList.add('active');
    overlay.classList.add('active');
}

function removeSpinner(){
    spinner.classList.remove('active');
    overlay.classList.remove('active');
}

// -------------- APP BG RENDER FUNCTION ------------------

function renderBg(current){
    const condition = current.weather[0].main;
    const bgClass = bgMap[condition] || 'default';

    weatherCondition.textContent = condition;
    app.className = 'app';  
    app.classList.add(bgClass);
}

// -------------- ERROR RENDER FUNCTION ------------------

function renderError(){
    error.classList.add('active');
    setTimeout(() => {
        error.classList.remove('active');
    }, 3000)
}

// -------------- Empty Input RENDER FUNCTION ------------------

function renderInput(){
    emptyInput.classList.add('active');
    setTimeout(() => {
        emptyInput.classList.remove('active');
    }, 3000)
}

// -------------- HOURLY RENDER FUNCTION ------------------

function renderHourly(forecasts){

    hourlyList.innerHTML = '';
    const limit = Math.min(8, forecasts.length)

    for(let i =0; i < limit; i++){
    
    const temperature = forecasts[i].main.temp;
    const condition = forecasts[i].weather[0].main;
    const iconPath = getWeahterIcon(condition)
    

    const li = document.createElement('li');
    li.classList.add('section__item');
    li.innerHTML = `
        <span class="section__time">
            ${forecasts[i].dt_txt.split(' ')[1].slice(0,5)}
        </span>
        <span class="section__temp">
            ${temperature} <sup class="temp-unit">&deg;</sup>
        </span>
        <div class="section__icon">
            <img src="${iconPath}" 
            alt="${condition}">
        </div>
    `;

    hourlyList.append(li);
    }
}

// -------------- 5-DAY HOURLY RENDER FUNCTION ------------------

function renderDaily(forecasts){

    dailyForecast.innerHTML = '';

    for(let i =0; i < forecasts.length; i += 8){

        const temperature = forecasts[i].main.temp;
        const condition = forecasts[i].weather[0].main;
        const isDate = forecasts[i].dt_txt.split(' ')[0];
        const isToday = isDate === new Date().toLocaleDateString('en-CA');
        const dayLabel = isToday ? 'Today' : new Date(forecasts[i].dt_txt.split(' ')[0]).toLocaleDateString('en-US', {weekday: 'short'});
        const iconPath = getWeahterIcon(condition);

        const li = document.createElement('li');
        li.classList.add('section__item');
        li.innerHTML = `
            <span class="section__time">
                ${dayLabel}
            </span>
            <span class="section__temp">
                ${temperature} <sup class="temp-unit">&deg;</sup>
            </span>
            <div class="section__icon">
                <img src="${iconPath}" 
                alt="${condition}">
            </div>
        `;
        dailyForecast.append(li);
    }
}

// -------------- FORECASTS ICON REDNDERING FUNCTION ------------------


function getWeahterIcon(condition){
    const iocnMap = {
        'Rain': 'Images/Icons/icon-cloud.svg',
        'Clouds' : 'Images/Icons/icon-cloud.svg',
        'Clear' : 'Images/Icons/icon-sunny.svg',
        'Thunderstorm': 'Images/Icons/icon-cloud.svg',
        'Snow' : 'Images/Icons/icon-cloud.svg'
    }
    return iocnMap[condition] || 'Images/Icons/icon-cloud.svg'
}

// -------------- HERO CONTENT RENDER FUNCTION ------------------

function renderHero(current){
    heroTemp.innerHTML = `${current.main.temp} <sup class="temp-unit">&deg;</sup>`;
    weatherCity.textContent = `${current.name}, ${current.sys.country}`;
}

// -------------- AQI RENDER FUNCTION ------------------

function renderAQI(air){
    const AQI = air.list[0].main.aqi;
    AQIValue.textContent = AQI;
    AQINote.textContent = AQImap[AQI];
}

// -------------- STATS REDNDERING FUNCTION ------------------

function renderStats(current){
    const feelsLike = current.main.feels_like;
    const humidity = current.main.humidity;
    const visibility = current.visibility/1000;
    const prec = current.rain?.['1h'] ?? 0;
    
        statsValues[0].innerHTML = `${feelsLike} <sup class="temp-unit">&deg;</sup>`;
        statsNote[0].textContent = `${feelsLike > current.main.temp ? "Feels warmer than it is" : 
        feelsLike < current.main.temp ? "Feels cooler than it is" : 'Feels about right'}`
        
        statsValues[1].textContent = prec;
        statsNote[1].textContent = `${prec === 0 ? `No precipitation expected` : prec < 2 ? 'Light rain expected' 
        : prec < 10 ? 'Moderate rain expected' : 'Heavy rain expected'}`

        statsValues[2].textContent = `${visibility} Km`;
        statsNote[2].textContent = `${ visibility >= 10 ? 'Clear visibility' : visibility >= 5 ? 'Moderate visibility' 
        : 'Low visibility'}`
        
        statsValues[3].textContent = `${humidity} %`;
        statsNote[3].textContent = `${humidity < 30 ? 'Air is dry' : humidity < 60 ? 'Comfortable humidity' 
        : 'Air feels humid'}`;

        humidityValue.textContent = `${humidity} %`;
        humidityNote.textContent = `${humidity < 30 ? 'Air is dry' : humidity < 60 ? 'Comfortable humidity' 
        : 'Air feels humid'}`;
}