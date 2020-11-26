require('dotenv').config();
const delay = require('delay');
const bot = require('./bots/mainBot');
const getData = require('./getData');
const getDB = require('./getDB');
const getGameEU = require('./getGameEU');
const logger = require('./logger');

const url_games_eu = process.env.URL_GAMES_EU;
const games_eu = process.env.GAMES_EU;

const getGamesEU = async (discount_b) => {
  let channel;
  if (discount_b) {
    channel = process.env.CHANNEL_DISCOUNTS_EU;
  } else {
    channel = process.env.CHANNEL_PRICES_EU;
  }
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
    /*
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
    */
    data.sort((a, b) => (a.date_from < b.date_from || !b.date_from ? -1 : 1));
    const fs_ids = [];

    if (!discount_b) {
      for await (const doc of data) {
        fs_ids.push(Number.parseInt(doc.fs_id, 10));
      }
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
      } else if (index >= 0) {
        data.splice(index, 1);
      }
    }

    for await (const game of data) {
      console.log(game.title, channel, discount_b);
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
                await delay(
                  Number.parseInt(process.env.DELAY_POST, 10) * 60 * 1000,
                );
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
                if (!discount_b) {
                  await getDB.addEU(result.game, games_eu).catch((err) => {
                    logger.log('error', `getDB.addEU ${err}`);
                  });
                }
                await delay(
                  Number.parseInt(process.env.DELAY_POST, 10) * 60 * 1000,
                );
              })
              .catch((err) => {
                logger.log('error', `sendPhoto: ${err}`);
              });
          });
      }
    }
  }
};

module.exports = getGamesEU;
