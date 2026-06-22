-- Database Schema for Weather Dashboard

-- Create weather_history table to store search logs
CREATE TABLE IF NOT EXISTS weather_history (
    id SERIAL PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    temperature FLOAT NOT NULL,
    weather_description TEXT NOT NULL,
    humidity INT NOT NULL,
    wind_speed FLOAT NOT NULL,
    weather_icon VARCHAR(50),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
