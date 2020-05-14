const bot = require('./modules/bot');
const getAllGames = require('./modules/getAllGames');

getAllGames();

setInterval(() => { // Поиск игр новых игр раз  в сутки
  getAllGames();
}, 1000 * 60 * 60 * 24);

bot.on('message', async (ctx) => {
  await ctx.reply('I am here');
});

bot.launch()
  .catch(() => {
  //
  });
