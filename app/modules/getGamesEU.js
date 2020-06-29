require('dotenv').config();
const delay = require('delay');
const redis = require('redis');
const bot = require('./bots/mainBot');
const getData = require('./getData');
const getDB = require('./getDB');
const getGameEU = require('./getGameEU');
const logger = require('./logger');

const channel = process.env.CHANNEL_PRICES_EU;
const url_games_eu = process.env.URL_GAMES_EU;
const games_eu = process.env.GAMES_EU;

const redis_client = redis.createClient();

const getGamesEU = async (discount_b) => {
  redis_client.set('getAllGames', 'true');
  let data;
  await getData
    .json(url_games_eu)
    .then((res) => {
      data = res;
    })
    .catch((err) => {
      logger.log('error', err);
    });
  if (data) {
    data = data.response.docs;
    data = data.filter((docs) => docs.nsuid_txt);
    if (discount_b) {
      data = data.filter((docs) => docs.price_has_discount_b);
    }
    for await (const doc of data) {
      if (!doc.date_from) {
        const index = data
          .map((item) => {
            return item.fs_id;
          })
          .indexOf(doc.fs_id);
        data.push(data[index]);
        data.splice(index, 1);
      }
    }
    const fs_ids = [];
    for await (const doc of data) {
      fs_ids.push(Number.parseInt(doc.fs_id, 10));
    }
    let docs;
    await getDB
      .findEU(fs_ids, games_eu)
      .then((res) => {
        docs = res;
      })
      .catch((err) => {
        logger.log('error', err);
      });
    if (docs) {
      for await (const doc of docs) {
        const index = data
          .map((item) => {
            return Number.parseInt(item.fs_id, 10);
          })
          .indexOf(doc.fs_id);
        if (
          index >= 0 &&
          discount_b &&
          Date.parse(doc.discount_end_date_eu) - Date.now() > 0
        ) {
          data.splice(index, 1);
        }
      }
    }
    for await (const game of data) {
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
            await bot.telegram
              .sendPhoto(channel, res.file_id, options)
              .then(async () => {
                if (discount_b) {
                  await getDB.updateEU(
                    result.game.fs_id,
                    {
                      discount_end_date_eu: result.game.discount_end_date_eu,
                    },
                    games_eu,
                  );
                } else {
                  await getDB.updateEU(
                    result.game.fs_id,
                    { discount_end_date_eu: Date.now() },
                    games_eu,
                  );
                }
                await delay(1000 * 60 * 2);
              })
              .catch((err) => {
                logger.log('error', `sendPhoto: ${err} ${res.file_id}`);
              });
          })
          .catch(async () => {
            await bot.telegram
              .sendPhoto(channel, result.post.image, options)
              .then(async (res_sendPhoto) => {
                result.game.file_id =
                  res_sendPhoto.photo[res_sendPhoto.photo.length - 1].file_id;
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
  }
  redis_client.del('getAllGames');
};

module.exports = getGamesEU;
