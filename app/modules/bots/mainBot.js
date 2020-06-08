require('dotenv').config();
const delay = require('delay');
const path = require('path');
const Telegraf = require('telegraf');
const Stage = require('telegraf/stage');
const Composer = require('telegraf/composer');
const TelegrafI18n = require('telegraf-i18n');
const SocksAgent = require('socks5-https-client/lib/Agent');
const session = require('telegraf/session');
const RedisSession = require('telegraf-session-redis');
const logger = require('../logger');
const adminBot = require('./adminBot');
const regularBot = require('./regularBot');
const getData = require('../getData');
const getUser = require('../getUser');

let bot;

if (process.env.SOCKS_HOST && process.env.SOCKS_PORT) {
  const socksAgent = new SocksAgent({
    socksHost: process.env.SOCKS_HOST,
    socksPort: process.env.SOCKS_PORT,
  });
  bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: {
      agent: socksAgent,
    },
  });
} else {
  bot = new Telegraf(process.env.BOT_TOKEN);
}

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

const session1 = new RedisSession({
  store: {
    host: process.env.TELEGRAM_SESSION_HOST || '127.0.0.1',
    port: process.env.TELEGRAM_SESSION_PORT || 6379,
  },
});

const adminIds = [246542665, 2205222443];

// Сценарии
const familyScene = require('../scenes/familyScene');
const [buyScene, buySceneSt1, buySceneSt2] = require('../scenes/buyScene');
const [
  sellScene,
  sellSceneSt1,
  sellSceneSt2,
  sellSceneSt3,
  sellSceneSt4,
  sellSceneSt5,
] = require('../scenes/sellScene');
const [
  lotsScene,
  lotsSceneSt1,
  lotsSceneSt2,
  lotsSceneSt3,
  lotsSceneSt4,
  lotsSceneSt5,
  lotsSceneSt6,
] = require('../scenes/lotsScene');
const verifyScene = require('../scenes/verifyScene');

const stage = new Stage();

stage.action('cancel', async (ctx) => {
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  ctx.session = {};
  ctx.scene.leave();
});

stage.start(async (ctx, next) => {
  ctx.session = {};
  ctx.scene.leave();
  return next();
});

stage.register(familyScene);
stage.register(buyScene);
stage.register(buySceneSt1);
stage.register(buySceneSt2);
stage.register(sellScene);
stage.register(sellSceneSt1);
stage.register(sellSceneSt2);
stage.register(sellSceneSt3);
stage.register(sellSceneSt4);
stage.register(sellSceneSt5);
stage.register(lotsScene);
stage.register(lotsSceneSt1);
stage.register(lotsSceneSt2);
stage.register(lotsSceneSt3);
stage.register(lotsSceneSt4);
stage.register(lotsSceneSt5);
stage.register(lotsSceneSt6);
stage.register(verifyScene);

bot.use(session());
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
  await ctx.reply('pong').then((ctx_reply) => {
    setTimeout(async () => {
      await ctx.deleteMessage(ctx_reply.message_id);
    }, 5000);
  });
});

bot.on('callback_query', async (ctx, next) => {
  if (!ctx.session.__scenes.current) {
    // удаляет сообщения вне сцен
    await ctx
      .answerCbQuery(ctx.i18n.t('Сообщение устарело'), true)
      .catch(() => {});
    await ctx.telegram
      .deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
  } else {
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
    })
    .catch((err) => {
      console.error(err);
    });
  switch (ctx.startPayload.split('_')[0]) {
    case 'family':
      ctx.scene.enter('family_scene');
      break;
    case 'sell':
      await getData
        .json(
          `https://eshopdb.ivanxpru.repl.co/api/v1.0/games/full/?query=${
            ctx.startPayload.split('_')[1]
          }&field=nsuid`,
        )
        .then((res) => {
          ctx.state.game = res.games[0];
        })
        .catch((err) => {
          logger.log('error', err);
        });
      if (ctx.state.user.verify) {
        next();
        ctx.scene.enter('sell_scene');
      } else {
        next();
        ctx.scene.enter('verify_scene');
      }
      break;
    case 'buy':
      await getData
        .json(
          `https://eshopdb.ivanxpru.repl.co/api/v1.0/games/full/?query=${
            ctx.startPayload.split('_')[1]
          }&field=nsuid`,
        )
        .then((res) => {
          ctx.state.game = res.games[0];
        })
        .catch((err) => {
          logger.log('error', err);
        });
      if (ctx.state.user.verify) {
        next();
        ctx.scene.enter('buy_scene');
      } else {
        next();
        ctx.scene.enter('verify_scene');
      }
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
