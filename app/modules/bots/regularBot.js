const Composer = require('telegraf/composer');

// Бот для обычных пользователей
const regularBot = new Composer();

// Запрет доступа к командам администратора для обычных пользователей
regularBot.command(['verify', 'users', 'user', 'banlot'], async (ctx) => {
  await ctx.reply('Доступ запрещён.');
});

// Переход на сцену с лотами
regularBot.command('mylots', async (ctx) => {
  ctx.scene.enter('lots_scene');
});

module.exports = regularBot;
