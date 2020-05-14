const bot = require('./modules/bot');
const getAllgames = require('./modules/getAllGames');

setInterval(() => { // Поиск игр новых игр раз  в сутки
  getAllgames();
}, 1000 * 60 * 60 * 24);

bot.on('message', async (ctx) => {
  await ctx.reply('I am here');
});

bot.launch()
  .catch(() => {
  //
  });
