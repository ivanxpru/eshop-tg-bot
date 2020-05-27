const bot = require('./modules/bots/mainBot');
const getAllGames = require('./modules/getAllGames');
const logger = require('./modules/logger');

bot.launch().catch((err) => {
  logger.log('eror', err);
});

getAllGames(false); // true - искать со скидками, false - все игры

setInterval(() => {
  // Поиск скидок раз  в сутки
  getAllGames(true);
}, 1000 * 60 * 60 * 24);

setInterval(() => {
  // Поиск новых игр раз в неделю
  getAllGames(false);
}, 1000 * 60 * 60 * 24 * 7);
