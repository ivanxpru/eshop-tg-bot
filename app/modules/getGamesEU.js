require('dotenv').config();
const SocksAgent = require('socks5-https-client/lib/Agent');
const Telegram = require('telegraf/telegram');
const { promisify } = require('util');
const delay = require('delay');
const redis = require('redis');
const getData = require('./getData');
const getDB = require('./getDB');
const getGameEU = require('./getGameEU');
const logger = require('./logger');

let telegram;
if (process.env.SOCKS_HOST && process.env.SOCKS_PORT) {
  const socksAgent = new SocksAgent({
    socksHost: process.env.SOCKS_HOST,
    socksPort: process.env.SOCKS_PORT,
  });
  telegram = new Telegram(process.env.BOT_TOKEN, {
    agent: socksAgent,
  });
} else {
  telegram = new Telegram(process.env.BOT_TOKEN, {});
}

const channel = process.env.CHANNEL_PRICES_EU;
const url_games_eu = process.env.URL_GAMES_EU;
const games_eu = process.env.GAMES_EU;

const redis_client = redis.createClient();
const redis_client_set = promisify(redis_client.set).bind(redis_client);
const redis_client_get = promisify(redis_client.get).bind(redis_client);

const getGamesEU = async (discount_b) => {
  await redis_client_set('getAllGames', 'true');
  let data = await getData.json(url_games_eu);
  data = data.response.docs;
  data = data.filter((docs) => docs.nsuid_txt);
  if (discount_b) {
    data = data.filter((docs) => docs.price_has_discount_b);
  }
  for await (const doc of data) {
    if (!doc.date_from) {
      data.push(data.shift());
    }
  }
  const games = [];
  for await (const doc of data) {
    await redis_client_get(doc.fs_id).then((reply) => {
      if (!reply || (discount_b && reply - Date.now() <= 0)) {
        games.push(doc);
      }
    });
  }
  for await (const game of games) {
    let result;
    await getGameEU(game, discount_b)
      .then((res) => {
        result = res;
      })
      .catch((err) => {
        logger.log('error', err);
      });
    if (result) {
      const options = {
        caption: result.post.message,
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify({
          inline_keyboard: result.post.keyboard,
        }),
      };
      await getDB
        .findEU(result.game.fs_id, games_eu)
        .then(async (res) => {
          await telegram
            .sendPhoto(channel, res.file_id, options)
            .then(async (res_sendPhoto) => {
              console.log(res.file_id);
              console.log(
                res_sendPhoto.photo[res_sendPhoto.photo.length - 1].file_id,
              );
              if (discount_b) {
                await redis_client_set(
                  result.game.fs_id,
                  result.post.discount_end_date,
                );
              } else {
                await redis_client_set(result.game.fs_id, 0);
              }
              await delay(1000 * 60 * 2);
            })
            .catch((err) => {
              logger.log('error', `sendPhoto: ${err}`);
            });
        })
        .catch(async () => {
          await telegram
            .sendPhoto(channel, result.post.image, options)
            .then(async (res_sendPhoto) => {
              result.game.file_id =
                res_sendPhoto.photo[res_sendPhoto.photo.length - 1].file_id;
              if (discount_b) {
                await redis_client_set(
                  result.game.fs_id,
                  result.post.discount_end_date,
                );
              } else {
                await redis_client_set(result.game.fs_id, 0);
              }
              await getDB.addEU(result.game, games_eu).catch((err) => {
                logger.log('error', err);
              });
              await delay(1000 * 60 * 2);
            })
            .catch((err) => {
              logger.log('error', `sendPhoto: ${err}`);
            });
        });
    }
  }
  redis_client.del('getAllGames');
};

module.exports = getGamesEU;
