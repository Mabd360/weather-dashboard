const db = require('../db');

// Get Weather by City or Coordinates
exports.getWeather = async (req, res) => {
  try {
    const { city } = req.params;
    const { lat, lon, save } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenWeatherMap API Key is missing on the server.' });
    }

    let apiUrl;
    if (city === 'coords' && lat && lon) {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
      apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    }
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: errorData.message || 'Error fetching weather data from OpenWeatherMap.' 
      });
    }

    const data = await response.json();

    // Format data to return to client
    const weatherInfo = {
      city_name: data.name,
      temperature: data.main.temp,
      weather_description: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      weather_icon: data.weather[0].icon
    };

    // Every search must be saved in the database automatically unless save=false is passed
    if (save !== 'false') {
      try {
        const queryText = `
          INSERT INTO weather_history (city_name, temperature, weather_description, humidity, wind_speed, weather_icon)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const values = [
          weatherInfo.city_name,
          weatherInfo.temperature,
          weatherInfo.weather_description,
          weatherInfo.humidity,
          weatherInfo.wind_speed,
          weatherInfo.weather_icon
        ];
        await db.query(queryText, values);
      } catch (dbError) {
        // Log DB error but don't crash the request if database is down or unconfigured
        console.error('Failed to automatically save search history to database:', dbError.message);
      }
    }

    return res.status(200).json(weatherInfo);
  } catch (error) {
    console.error('Error in getWeather controller:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};

// Get Weather Forecast by City or Coordinates
exports.getForecast = async (req, res) => {
  try {
    const { city } = req.params;
    const { lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenWeatherMap API Key is missing on the server.' });
    }

    let apiUrl;
    if (city === 'coords' && lat && lon) {
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
      apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: errorData.message || 'Error fetching forecast data from OpenWeatherMap.' 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in getForecast controller:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};

// Save Weather Data manually
exports.saveWeather = async (req, res) => {
  try {
    const { city_name, temperature, weather_description, humidity, wind_speed, weather_icon } = req.body;

    if (!city_name || temperature === undefined || !weather_description || humidity === undefined || wind_speed === undefined) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const queryText = `
      INSERT INTO weather_history (city_name, temperature, weather_description, humidity, wind_speed, weather_icon)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      city_name,
      temperature,
      weather_description,
      humidity,
      wind_speed,
      weather_icon || null
    ];

    const result = await db.query(queryText, values);
    return res.status(201).json({ message: 'Weather data saved successfully.', record: result.rows[0] });
  } catch (error) {
    console.error('Error in saveWeather controller:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};

// Get Search History
exports.getHistory = async (req, res) => {
  try {
    const queryText = 'SELECT * FROM weather_history ORDER BY searched_at DESC';
    const result = await db.query(queryText);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error in getHistory controller:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};

// Delete History Record
exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const queryText = 'DELETE FROM weather_history WHERE id = $1 RETURNING *';
    const result = await db.query(queryText, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'History record not found.' });
    }

    return res.status(200).json({ message: 'History record deleted successfully.', record: result.rows[0] });
  } catch (error) {
    console.error('Error in deleteHistory controller:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};

// Clear All History Records
exports.clearHistory = async (req, res) => {
  try {
    const queryText = 'DELETE FROM weather_history RETURNING *';
    const result = await db.query(queryText);
    return res.status(200).json({ message: 'All history records cleared successfully.', count: result.rowCount });
  } catch (error) {
    console.error('Error in clearHistory controller:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};
