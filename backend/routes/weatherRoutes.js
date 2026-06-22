const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /weather/:city
router.get('/weather/:city', weatherController.getWeather);

// GET /forecast/:city
router.get('/forecast/:city', weatherController.getForecast);

// POST /save-weather
router.post('/save-weather', weatherController.saveWeather);

// GET /history
router.get('/history', weatherController.getHistory);

// DELETE /history (Clear all)
router.delete('/history', weatherController.clearHistory);

// DELETE /history/:id
router.delete('/history/:id', weatherController.deleteHistory);

module.exports = router;
