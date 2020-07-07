require('dotenv').config();
const delay = require('delay');
const redis = require('redis');
const bot = require('./bots/mainBot');
const getData = require('./getData');
const sortData = require('./sortData');
const getDB = require('./getDB');
const getGameUS = require('./getGameUS');
const logger = require('./logger');

const channel = process.env.CHANNEL_PRICES_US;
const games_us = process.env.GAMES_US;

const redis_client = redis.createClient();

const indexes = [
  'noa_aem_game_en_us',
  'noa_aem_game_en_us_release_des',
  'noa_aem_game_en_us_title_asc',
  'noa_aem_game_en_us_title_des',
  'noa_aem_game_en_us_price_asc',
  'noa_aem_game_en_us_price_des',
];

const params = [
  {
    offset: 0,
    length: 1000,
    facetFilters: ['platform:Nintendo 3DS', 'availability:Available now'],
    attributesToRetrieve: ['*'],
  },
  {
    offset: 0,
    length: 1000,
    facetFilters: ['platform:Wii U', 'availability:Available now'],
    attributesToRetrieve: ['*'],
  },
  {
    offset: 0,
    length: 1000,
    facetFilters: ['platform:Nintendo Switch', 'availability:Available now'],
    attributesToRetrieve: ['*'],
  },
];

const getGamesUS = async (discount_b) => {
  redis_client.set('getAllGames', 'true');
  let data = [];
  for await (const index of indexes) {
    for await (const param of params) {
      if (discount_b) {
        param.facetFilters.push(['generalFilters:Deals']);
      }
      let result;
      await getData
        .algoliasearch(index, '', param)
        .then((res) => {
          result = res;
        })
        .catch((err) => {
          logger.error('error', err);
        });
      if (result) {
        const objectIDs = data.map((item) => {
          return item.objectID;
        });
        for (const el of result) {
          if (objectIDs.indexOf(el.objectID) === -1) {
            data.push(el);
          }
        }
      }
      await delay(1000);
    }
  }
  const objectIDs = data.map((item) => {
    return item.objectID;
  });
  let docs;
  await getDB
    .findUS(objectIDs, games_us)
    .then((res) => {
      docs = res;
    })
    .catch((err) => {
      logger.log('error', err);
    });
  if (docs) {
    const idx = data.map((item) => {
      return item.objectID;
    });
    for await (const doc of docs) {
      if (idx.indexOf(doc.objectID) !== -1)
        if (
          discount_b &&
          Date.parse(doc.discount_end_date_eu) - Date.now() > 0
        ) {
          data.splice(idx.indexOf(doc.objectID), 1);
        }
      if (!discount_b) {
        data.splice(idx.indexOf(doc.objectID), 1);
      }
    }
  }
  data = sortData(data, 'releaseDateMask');
  for await (const game of data) {
    let result;
    await getGameUS(game, discount_b)
      .then((res) => {
        result = res;
      })
      .catch((err) => {
        logger.log('error', err);
      });
    await getGameUS(game, discount_b)
      .then((res) => {
        result = res;
      })
      .catch(() => {
        logger.log('error', 'getGameUS');
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
        .findUS(result.game.objectID, games_us)
        .then(async (res) => {
          await bot.telegram
            .sendPhoto(channel, res.file_id, options)
            .then(async () => {
              if (discount_b) {
                await getDB.updateUS(
                  result.game.objectID,
                  {
                    discount_end_date_us: result.game.discount_end_date_us,
                  },
                  games_us,
                );
              } else {
                await getDB.updateUS(
                  result.game.objectID,
                  { discount_end_date_us: Date.now() },
                  games_us,
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
              await getDB.addUS(result.game, games_us).catch((err) => {
                logger.log('error', err);
              });
              await delay(1000 * 60 * 2);
            })
            .catch((err) => {
              logger.log('error', `sendPhoto: ${err} ${result.post.image}`);
            });
        });
    }
  }

  redis_client.del('getAllGames');
};

module.exports = getGamesUS;
