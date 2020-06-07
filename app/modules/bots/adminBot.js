const Composer = require('telegraf/composer');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const bot = require('./mainBot');
const verifyUser = require('../verifyUser');
const getLot = require('../getLot');
const logger = require('../logger');

// Бот для администраторов
const adminBot = new Composer();

/*
adminBot.start(async (ctx) => {
  const keyboard = Markup.keyboard([['/users', '/lots']])
    .resize()
    .oneTime();
  await ctx.reply('Menu ready', Extra.markup(keyboard));
});
*/

/*
// Информация по пользователе
adminBot.command('user', async (ctx) => {
  const user_id = ctx.message.text.split(' ')[1];
  await ctx.reply(`Информация о пользователе ${user_id}`);
});
*/

/*
// Список пользователей
adminBot.command('users', async (ctx) => {
  let message = '';
  message += '*Список пользователей*';
  await ctx.replyWithMarkdown(message);
});
*/
// Исключаем выполенение команд в чатах
adminBot.command(async (ctx, next) => {
  if (ctx.message.chat.type !== 'private') {
    await ctx.telegram
      .deleteMessage(ctx.chat.id, ctx.message.message_id)
      .catch(() => {});
  } else {
    return next();
  }
});

// Верификация пользователя
adminBot.command('verify', async (ctx) => {
  let user_id = ctx.message.text.split(' ')[1];
  let verify = ctx.message.text.split(' ')[2];
  let username;
  user_id = Number.parseInt(user_id, 10);
  if (user_id && (verify === 'true' || verify === 'false')) {
    verify = JSON.parse(verify);
    await bot
      .getChat(user_id)
      .then(async (chat) => {
        username = chat.username;
        await verifyUser(user_id, verify)
          .then(() => {
            if (verify) {
              ctx.replyWithMarkdown(ctx.i18n.t('verify_msg0', { username }));
            } else {
              ctx.replyWithMarkdown(ctx.i18n.t('verify_msg1', { username }));
            }
          })
          .catch(() => ctx.reply(ctx.i18n.t('verify_msg2')));
      })
      .catch(() => ctx.reply(ctx.i18n.t('verify_msg3')));
  } else {
    ctx.replyWithMarkdown(ctx.i18n.t('verify_msg3'));
  }
});

adminBot.command('banlot', async (ctx) => {
  const lot_id = ctx.message.text.split(' ')[1];
  await getLot
    .changeStatus(lot_id, 'banned')
    .then(async () => {
      await ctx.replyWithMarkdown(ctx.i18n.t('banlot_msg0'));
    })
    .catch((err) => {
      logger.log('error', err);
    });
});

adminBot.command('hide', async (ctx) => {
  const keyboard = Markup.removeKeyboard();
  ctx.reply('Menu hide', Extra.markup(keyboard));
});

module.exports = adminBot;
