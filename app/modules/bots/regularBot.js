const Composer = require('telegraf/composer');

// Бот для обычных пользователей
const regularBot = new Composer();

regularBot.command(async (ctx, next) => {
  if (ctx.message.chat.type !== 'private') {
    await ctx.telegram
      .deleteMessage(ctx.chat.id, ctx.message.message_id)
      .catch(() => {});
  } else {
    return next();
  }
});

// Переход на сцену с лотами
regularBot.command('mylots', async (ctx) => {
  ctx.scene.enter('lots_scene');
});

module.exports = regularBot;
