// Next-Gen SkyFlow Weather Dashboard UI Logic

// DOM Elements
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');

const welcomeCard = document.getElementById('welcome-card');
const weatherCard = document.getElementById('weather-card');
const errorCard = document.getElementById('error-card');
const loadingSpinner = document.getElementById('loading-spinner');

// Weather Display Components
const wCity = document.getElementById('w-city');
const wDate = document.getElementById('w-date');
const wTemp = document.getElementById('w-temp');
const wDesc = document.getElementById('w-desc');
const wHumidity = document.getElementById('w-humidity');
const wWind = document.getElementById('w-wind');
const wIcon = document.getElementById('w-icon');

// Search History
const historyList = document.getElementById('history-list');
const emptyHistory = document.getElementById('empty-history');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const recentPills = document.getElementById('recent-pills');

// Analytics & Filters
const analyticsBar = document.getElementById('analytics-bar');
const statHotToday = document.getElementById('stat-hot-today');
const statColdToday = document.getElementById('stat-cold-today');
const statMostCity = document.getElementById('stat-most-city');
const historyFilterWrapper = document.getElementById('history-filter-wrapper');
const historySearch = document.getElementById('history-search');

// Upgraded Widgets
const btnGeolocation = document.getElementById('btn-geolocation');
const chartCard = document.getElementById('chart-card');
const forecastCard = document.getElementById('forecast-card');
const forecastGrid = document.getElementById('forecast-grid');
const statWorldHot = document.getElementById('stat-world-hot');
const statWorldCold = document.getElementById('stat-world-cold');
const worldExtremesBar = document.getElementById('world-extremes-bar');

// Theme Switch
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// API Path Config
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://weather-dashboardapi-67uwix4t.b4a.run/api'; // Back4app URL

// State Variables
let searchHistory = [];
let activeWeatherTheme = 'theme-default';
let tempChartInstance = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    initTheme();
    setupFilters();
    setupGeolocation();
    fetchWorldExtremes();
});

function setupFilters() {
    historySearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        renderHistoryTable(query);
    });
}

function setupGeolocation() {
    btnGeolocation.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        btnGeolocation.disabled = true;
        btnGeolocation.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Locating...</span>';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherAndForecastByCoords(lat, lon);
                btnGeolocation.disabled = false;
                btnGeolocation.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> <span>Use Current Location</span>';
            },
            (error) => {
                console.error('Geolocation Error:', error);
                alert(`Location access denied: ${error.message}`);
                btnGeolocation.disabled = false;
                btnGeolocation.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> <span>Use Current Location</span>';
            }
        );
    });
}

// World Climate Extremes Today
const EXTREME_CITIES = [
    'Yakutsk',     
    'Norilsk',     
    'Yellowknife', 
    'Ulaanbaatar', 
    'Nuuk',        
    'Anchorage',   
    'Khartoum',    
    'Riyadh',      
    'Kuwait',      
    'Cairo',       
    'Baghdad',     
    'Timbuktu'     
];

async function fetchWorldExtremes() {
    try {
        statWorldHot.textContent = 'Scanning...';
        statWorldCold.textContent = 'Scanning...';

        const fetchPromises = EXTREME_CITIES.map(async (city) => {
            try {
                const res = await fetch(`${API_BASE}/weather/${encodeURIComponent(city)}?save=false`);
                if (!res.ok) return null;
                return await res.json();
            } catch (err) {
                return null;
            }
        });

        const results = await Promise.all(fetchPromises);
        const validResults = results.filter(r => r !== null);

        if (validResults.length === 0) {
            statWorldHot.textContent = 'Unavailable';
            statWorldCold.textContent = 'Unavailable';
            return;
        }

        // Evaluate extremes
        let worldHottest = validResults[0];
        let worldColdest = validResults[0];

        validResults.forEach(r => {
            if (r.temperature > worldHottest.temperature) worldHottest = r;
            if (r.temperature < worldColdest.temperature) worldColdest = r;
        });

        statWorldHot.innerHTML = `${escapeHTML(worldHottest.city_name)} <span style="font-size:0.9rem; font-weight:600; opacity:0.8;">(${Math.round(worldHottest.temperature)}°C)</span>`;
        statWorldHot.onclick = () => fetchWeather(worldHottest.city_name);

        statWorldCold.innerHTML = `${escapeHTML(worldColdest.city_name)} <span style="font-size:0.9rem; font-weight:600; opacity:0.8;">(${Math.round(worldColdest.temperature)}°C)</span>`;
        statWorldCold.onclick = () => fetchWeather(worldColdest.city_name);
    } catch (error) {
        console.error('Failed to retrieve world climate extremes:', error);
        statWorldHot.textContent = 'Error';
        statWorldCold.textContent = 'Error';
    }
}

// Setup Dark/Light Theme Settings
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyThemeMode(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentMode = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyThemeMode(currentMode);
    });
}

function applyThemeMode(mode) {
    if (mode === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        themeIcon.className = 'fa-solid fa-moon';
    } else {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        themeIcon.className = 'fa-solid fa-sun';
    }
    localStorage.setItem('theme', mode);
}

// Map weather conditions to CSS theme classes (Sunny, Rainy, Cloudy, etc.)
function updateWeatherTheme(conditionCode, description) {
    // Remove current weather classes
    document.body.classList.remove('theme-default', 'theme-clear', 'theme-rain', 'theme-clouds', 'theme-snow');
    
    let themeClass = 'theme-default';
    const mainDesc = description ? description.toLowerCase() : '';
    
    // Grouping by OpenWeatherMap condition code prefixes
    if (conditionCode) {
        const id = parseInt(conditionCode);
        if (id >= 200 && id < 600) {
            themeClass = 'theme-rain'; // Thunderstorm, Drizzle, Rain
        } else if (id >= 600 && id < 700) {
            themeClass = 'theme-snow'; // Snow
        } else if (id === 800) {
            themeClass = 'theme-clear'; // Clear / Sunny
        } else if (id > 800 && id < 900) {
            themeClass = 'theme-clouds'; // Clouds
        } else if (id >= 700 && id < 800) {
            themeClass = 'theme-clouds'; // Atmosphere (Mist, Fog, Smoke)
        }
    } else if (mainDesc) {
        if (mainDesc.includes('rain') || mainDesc.includes('drizzle') || mainDesc.includes('storm')) {
            themeClass = 'theme-rain';
        } else if (mainDesc.includes('clear') || mainDesc.includes('sun')) {
            themeClass = 'theme-clear';
        } else if (mainDesc.includes('cloud') || mainDesc.includes('mist') || mainDesc.includes('fog')) {
            themeClass = 'theme-clouds';
        } else if (mainDesc.includes('snow')) {
            themeClass = 'theme-snow';
        }
    }

    activeWeatherTheme = themeClass;
    document.body.classList.add(themeClass);
}

// Search Submissions
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});

// Fetch Weather API Handler
async function fetchWeather(city) {
    welcomeCard.classList.add('hidden');
    weatherCard.classList.add('hidden');
    chartCard.classList.add('hidden');
    forecastCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    
    searchBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/weather/${encodeURIComponent(city)}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request to satellite server failed.');
        }

        displayWeather(data);

        // Fetch forecast parallel
        try {
            const forecastResponse = await fetch(`${API_BASE}/forecast/${encodeURIComponent(city)}`);
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                displayForecastAndChart(forecastData);
            }
        } catch (forecastErr) {
            console.error('Forecast fetch error:', forecastErr);
        }

        loadHistory();
        cityInput.value = '';
    } catch (error) {
        console.error('Satellite Query Failure:', error);
        displayError(error.message);
    } finally {
        loadingSpinner.classList.add('hidden');
        searchBtn.disabled = false;
    }
}

// Fetch by coordinates
async function fetchWeatherAndForecastByCoords(lat, lon) {
    welcomeCard.classList.add('hidden');
    weatherCard.classList.add('hidden');
    chartCard.classList.add('hidden');
    forecastCard.classList.add('hidden');
    errorCard.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    
    searchBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/weather/coords?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request to satellite server failed.');
        }

        displayWeather(data);

        // Fetch forecast parallel
        try {
            const forecastResponse = await fetch(`${API_BASE}/forecast/coords?lat=${lat}&lon=${lon}`);
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                displayForecastAndChart(forecastData);
            }
        } catch (forecastErr) {
            console.error('Forecast fetch error:', forecastErr);
        }

        loadHistory();
        cityInput.value = '';
    } catch (error) {
        console.error('Satellite Query Failure:', error);
        displayError(error.message);
    } finally {
        loadingSpinner.classList.add('hidden');
        searchBtn.disabled = false;
    }
}

// Render dynamic weather details
function displayWeather(data) {
    wCity.textContent = data.city_name;
    
    // Nice clock format
    const formatOptions = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    wDate.textContent = new Date().toLocaleDateString('en-US', formatOptions);
    
    wTemp.textContent = Math.round(data.temperature);
    wDesc.textContent = data.weather_description;
    wHumidity.textContent = `${data.humidity}%`;
    wWind.textContent = `${data.wind_speed} m/s`;
    
    if (data.weather_icon) {
        wIcon.src = `https://openweathermap.org/img/wn/${data.weather_icon}@2x.png`;
    }

    // Update the custom theme class dynamically based on search result!
    // OpenWeather API usually passes icon code which we can parse or check.
    // data.weather_icon example: '01d', '02n', '09d', etc.
    let conditionCode = null;
    if (data.weather_icon) {
        // Map icon code prefixes to rough weather condition IDs for updates
        const prefix = data.weather_icon.substring(0, 2);
        if (prefix === '01') conditionCode = 800; // Clear
        else if (['02', '03', '04'].includes(prefix)) conditionCode = 803; // Clouds
        else if (['09', '10', '11'].includes(prefix)) conditionCode = 500; // Rain
        else if (prefix === '13') conditionCode = 600; // Snow
        else if (prefix === '50') conditionCode = 701; // Mist
    }
    
    updateWeatherTheme(conditionCode, data.weather_description);

    // Fade-in animation class trigger
    weatherCard.classList.remove('hidden');
    weatherCard.style.animation = 'none';
    setTimeout(() => {
        weatherCard.style.animation = 'cardLoadIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    }, 10);
}

// Display Forecast Cards and Temp Chart
function displayForecastAndChart(forecastData) {
    if (!forecastData || !forecastData.list) return;
    renderTempChart(forecastData.list);
    render5DayForecast(forecastData.list);
}

function renderTempChart(forecastList) {
    const canvas = document.getElementById('temp-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (tempChartInstance) {
        tempChartInstance.destroy();
    }

    // First 8 items = 24 hours (3-hour intervals)
    const points = forecastList.slice(0, 8);
    const labels = points.map(item => {
        const date = new Date(item.dt * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    const temps = points.map(item => Math.round(item.main.temp));

    const bodyStyles = getComputedStyle(document.body);
    const accentColor = bodyStyles.getPropertyValue('--accent').trim() || '#a855f7';
    const accentGlow = bodyStyles.getPropertyValue('--accent-glow').trim() || 'rgba(168, 85, 247, 0.2)';

    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, accentGlow);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    tempChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temp (°C)',
                data: temps,
                borderColor: accentColor,
                borderWidth: 3,
                pointBackgroundColor: accentColor,
                pointBorderColor: '#ffffff',
                pointHoverRadius: 6,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: bodyStyles.getPropertyValue('--text-tertiary') || '#94a3b8' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: bodyStyles.getPropertyValue('--text-tertiary') || '#94a3b8' }
                }
            }
        }
    });

    chartCard.classList.remove('hidden');
}

function render5DayForecast(forecastList) {
    forecastGrid.innerHTML = '';

    const dailyForecasts = [];
    const daysSeen = new Set();

    for (const item of forecastList) {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hour = date.getHours();

        if (!daysSeen.has(dayName) && (hour >= 11 && hour <= 14 || dailyForecasts.length === 0)) {
            daysSeen.add(dayName);
            dailyForecasts.push(item);
        }

        if (dailyForecasts.length >= 5) break;
    }

    if (dailyForecasts.length < 5) {
        dailyForecasts.length = 0;
        for (let i = 4; i < forecastList.length && dailyForecasts.length < 5; i += 8) {
            dailyForecasts.push(forecastList[i]);
        }
    }

    dailyForecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(item.main.temp);
        const desc = item.weather[0].description;
        const icon = item.weather[0].icon;

        const card = document.createElement('div');
        card.className = 'forecast-item';
        card.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Icon">
            <span class="forecast-temp">${temp}°C</span>
            <span class="forecast-desc">${desc}</span>
        `;
        forecastGrid.appendChild(card);
    });

    forecastCard.classList.remove('hidden');
}

// Styled Errors
function displayError(message) {
    const errorMsgElement = document.getElementById('error-message');
    errorMsgElement.textContent = message || 'Station did not reply. Check spelling.';
    errorCard.classList.remove('hidden');
    
    // Clear dynamic weather themes on error
    document.body.classList.remove('theme-clear', 'theme-rain', 'theme-clouds', 'theme-snow');
    document.body.classList.add('theme-default');
}

// Load Search logs from DB
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/history`);
        if (!response.ok) {
            throw new Error('Database connection offline.');
        }

        searchHistory = await response.json();
        updateAnalytics();
        renderHistoryTable();
        renderRecentPills();
    } catch (error) {
        console.error('History Query Error:', error);
    }
}

// Update Database Stats Analytics
function updateAnalytics() {
    if (searchHistory.length === 0) {
        analyticsBar.classList.add('hidden');
        historyFilterWrapper.classList.add('hidden');
        return;
    }

    analyticsBar.classList.remove('hidden');
    historyFilterWrapper.classList.remove('hidden');

    // Filter searches made today
    const todayStr = new Date().toDateString();
    const todayRecords = searchHistory.filter(r => new Date(r.searched_at).toDateString() === todayStr);

    if (todayRecords.length > 0) {
        // Hottest & Coldest today
        let hottest = todayRecords[0];
        let coldest = todayRecords[0];
        
        todayRecords.forEach(r => {
            if (r.temperature > hottest.temperature) hottest = r;
            if (r.temperature < coldest.temperature) coldest = r;
        });

        statHotToday.innerHTML = `${escapeHTML(hottest.city_name)} <span style="font-size:0.9rem; font-weight:600; opacity:0.8;">(${Math.round(hottest.temperature)}°C)</span>`;
        statHotToday.onclick = () => fetchWeather(hottest.city_name);

        statColdToday.innerHTML = `${escapeHTML(coldest.city_name)} <span style="font-size:0.9rem; font-weight:600; opacity:0.8;">(${Math.round(coldest.temperature)}°C)</span>`;
        statColdToday.onclick = () => fetchWeather(coldest.city_name);
    } else {
        statHotToday.textContent = 'None Today';
        statHotToday.onclick = null;
        statColdToday.textContent = 'None Today';
        statColdToday.onclick = null;
    }

    // Most searched city counts
    const cityCounts = {};
    searchHistory.forEach(r => {
        const city = r.city_name;
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    let mostCity = '';
    let maxCount = 0;
    for (const city in cityCounts) {
        if (cityCounts[city] > maxCount) {
            maxCount = cityCounts[city];
            mostCity = city;
        }
    }
    
    statMostCity.textContent = mostCity || '--';
    if (mostCity) {
        statMostCity.onclick = () => fetchWeather(mostCity);
    } else {
        statMostCity.onclick = null;
    }
}

// Render DB History Table
function renderHistoryTable(filterQuery = '') {
    historyList.innerHTML = '';
    
    if (searchHistory.length === 0) {
        emptyHistory.classList.remove('hidden');
        clearHistoryBtn.classList.add('hidden');
        return;
    }

    emptyHistory.classList.add('hidden');
    clearHistoryBtn.classList.remove('hidden');

    const displayRecords = filterQuery
        ? searchHistory.filter(r => 
            r.city_name.toLowerCase().includes(filterQuery) || 
            r.weather_description.toLowerCase().includes(filterQuery)
          )
        : searchHistory;

    if (displayRecords.length === 0) {
        historyList.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-tertiary); padding: 32px;">
                    No history logs matching "${escapeHTML(filterQuery)}"
                </td>
            </tr>
        `;
        return;
    }

    displayRecords.forEach(record => {
        const tr = document.createElement('tr');
        
        const timeFormatted = new Date(record.searched_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const iconUrl = record.weather_icon 
            ? `https://openweathermap.org/img/wn/${record.weather_icon}.png`
            : null;

        const iconMarkup = iconUrl 
            ? `<img src="${iconUrl}" alt="icon">` 
            : '<i class="fa-solid fa-cloud-sun" style="font-size: 1.1rem; opacity: 0.7;"></i>';

        tr.innerHTML = `
            <td>
                <div class="city-cell-primary">
                    <span>${escapeHTML(record.city_name)}</span>
                    <span class="city-cell-time">${timeFormatted}</span>
                </div>
            </td>
            <td><strong>${Math.round(record.temperature)}°C</strong></td>
            <td>
                <div class="cond-cell">
                    ${iconMarkup}
                    <span>${escapeHTML(record.weather_description)}</span>
                </div>
            </td>
            <td>${record.humidity}%</td>
            <td>${record.wind_speed} m/s</td>
            <td>
                <button class="btn-delete-row" onclick="deleteHistoryRecord(${record.id}, event)" title="Discard record">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </td>
        `;

        // Row click triggers automatic re-lookup
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-delete-row')) {
                fetchWeather(record.city_name);
            }
        });

        historyList.appendChild(tr);
    });
}

// Render top 5 unique pills
function renderRecentPills() {
    recentPills.innerHTML = '';
    
    if (searchHistory.length === 0) {
        recentPills.classList.add('hidden');
        return;
    }

    const uniqueCities = [];
    const recentList = [];
    
    for (let i = 0; i < searchHistory.length; i++) {
        const city = searchHistory[i].city_name;
        if (!uniqueCities.includes(city)) {
            uniqueCities.push(city);
            recentList.push(searchHistory[i]);
        }
        if (recentList.length >= 5) break;
    }

    recentPills.classList.remove('hidden');

    recentList.forEach(pill => {
        const pillEl = document.createElement('div');
        pillEl.className = 'quick-pill';
        pillEl.innerHTML = `
            <i class="fa-solid fa-bolt-lightning" style="font-size:0.75rem;"></i>
            <span>${escapeHTML(pill.city_name)}</span>
            <span class="pill-temp">${Math.round(pill.temperature)}°C</span>
        `;
        pillEl.addEventListener('click', () => {
            fetchWeather(pill.city_name);
        });
        recentPills.appendChild(pillEl);
    });
}

// Delete Search log by ID
async function deleteHistoryRecord(id, event) {
    if (event) event.stopPropagation();

    try {
        const response = await fetch(`${API_BASE}/history/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Discard command failed.');
        }

        loadHistory();
    } catch (error) {
        console.error('Delete Record Error:', error);
        alert('Could not discard record. Please retry.');
    }
}

// Clear all records from DB
clearHistoryBtn.addEventListener('click', async () => {
    if (!confirm('Discard entire PostgreSQL search history?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/history`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Clear history command failed.');
        }

        loadHistory();
    } catch (error) {
        console.error('Clear DB Error:', error);
        alert('Could not clear database records. Please retry.');
    }
});

// HTML XSS Escaper
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
