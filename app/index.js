// Стартовый скрипт для запуска бота
// и различных задач

const delay = require('delay');
const bot = require('./modules/bots/mainBot');
const getGamesEU = require('./modules/getGamesEU');
// const getGamesUS = require('./modules/getGamesUS');
// const getGamesJP = require('./modules/getGamesJP');
const getAmiibo = require('./modules/getAmiibo');
const logger = require('./modules/logger');

let isRun = false;

// Запуск бота
bot.launch().catch((err) => {
  logger.log('error', err);
});

// Первый запуск
(async () => {
  if (!isRun) {
    isRun = true;
    getAmiibo.getAllAmiibo(); // поиск Amiibo
    await delay(60 * 1000);
    await getGamesEU(false); // поиск новых игр
    await delay(60 * 1000);
    getGamesEU(true); // поиск скидок
    await delay(60 * 1000);
    isRun = false;
  }
})();

setInterval(async () => {
  // Поиск игр, dlc, скидок и amiibo раз  в сутки
  // getGamesXX(false): поиск новых игр
  // getGamesXX(true): поиск скидок на игры
  if (!isRun) {
    isRun = true;
    getAmiibo.getAllAmiibo();
    await delay(60 * 1000);
    getGamesEU(false);
    await delay(60 * 1000);
    getGamesEU(true);
    await delay(60 * 1000);
    isRun = false;
  }
}, 1000 * 60 * 60 * 24);
