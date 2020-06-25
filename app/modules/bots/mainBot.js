require('dotenv').config();
const delay = require('delay');
const path = require('path');
const Telegraf = require('telegraf');
const Composer = require('telegraf/composer');
const TelegrafI18n = require('telegraf-i18n');
// const session = require('telegraf/session');
const RedisSession = require('telegraf-session-redis');
const stage = require('../scenes/stage');
const logger = require('../logger');
const adminBot = require('./adminBot');
const regularBot = require('./regularBot');
const getData = require('../getData');
const getUser = require('../getUser');

const bot = new Telegraf(process.env.BOT_TOKEN);

const i18n = new TelegrafI18n({
  directory: path.resolve(__dirname, '../../data/locales'),
  defaultLanguage: 'ru',
  sessionName: 'session',
  useSession: true,
  templateData: {
    pluralize: TelegrafI18n.pluralize,
    uppercase: (value) => value.toUpperCase(),
  },
});

const session = new RedisSession({
  store: {
    host: process.env.TELEGRAM_SESSION_HOST || '127.0.0.1',
    port: process.env.TELEGRAM_SESSION_PORT || 6379,
  },
});

const adminIds = [246542665, 2205222443];

bot.use(session);
bot.use(i18n.middleware());
bot.use(stage.middleware());
bot.use(Composer.acl(adminIds, adminBot));
// Простая защита от ддоса
bot.use(async (_ctx, next) => {
  await delay(1000);
  return next();
});

// Обычные пользователи
bot.use(regularBot);

bot.command('ping', async (ctx) => {
  await ctx.deleteMessage(ctx.message.message_id);
  await ctx.reply('pong');
});

bot.on('callback_query', async (ctx, next) => {
  if (!ctx.session.__scenes.current) {
    const data = ctx.update.callback_query.data;
    ctx.update.callback_query.message.reply_markup.inline_keyboard.forEach(
      async (keyboard) => {
        for await (const button of keyboard) {
          if (button.callback_data === data) {
            await ctx.answerCbQuery(ctx.i18n.t(button.text)).catch(() => {});
          }
        }
      },
    );
  }
  return next();
});

bot.start(async (ctx, next) => {
  ctx.session.state = {};
  ctx.session.state.lot = {};
  await getUser(ctx.from.id)
    .then((res) => {
      ctx.state.user = res;
      next();
    })
    .catch(() => {});
  switch (ctx.startPayload.split('_')[0]) {
    case 'family':
      ctx.scene.enter('family_scene');
      break;
    case 'sellEU':
      if (!ctx.state.user.verify) {
        ctx.scene.enter('verify_scene');
        break;
      }
      await getData
        .json(
          `https://eshopdb.ivanxpru.repl.co/api/v1.0/games/eu/?query=${
            ctx.startPayload.split('_')[1]
          }&field=fs_id`,
        )
        .then((res) => {
          ctx.state.game = res.games[0];
          ctx.state.game.title = res.games[0].title_eu;
          ctx.scene.enter('sell_scene');
        })
        .catch((err) => {
          ctx.reply(ctx.i18n.t('sell_scene_txt3'));
          logger.log('error', err);
        });
      break;
    case 'buyEU':
      if (!ctx.state.user.verify) {
        ctx.scene.enter('verify_scene');
        break;
      }
      await getData
        .json(
          `https://eshopdb.ivanxpru.repl.co/api/v1.0/games/eu/?query=${
            ctx.startPayload.split('_')[1]
          }&field=fs_id`,
        )
        .then((res) => {
          ctx.state.game = res.games[0];
          ctx.state.game.title = res.games[0].title_eu;
          ctx.scene.enter('buy_scene');
        })
        .catch((err) => {
          ctx.reply(ctx.i18n.t('buy_scene_txt3'));
          logger.log('error', err);
        });
      break;
    case 'view':
      ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
      ctx.scene.enter('buy_scene_st1');
      break;
    default:
      ctx.reply('startPayload undefined.');
  }
});

exports.getChat = (user_id) =>
  new Promise((resolve, reject) => {
    bot.telegram
      .getChat(user_id)
      .then((chat) => {
        resolve(chat);
      })
      .catch((err) => {
        reject(err);
      });
  });

module.exports = bot;
