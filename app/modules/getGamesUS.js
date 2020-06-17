require('dotenv').config();
const { promisify } = require('util');
const delay = require('delay');
const redis = require('redis');
const bot = require('./bots/mainBot');
const getData = require('./getData');
const getDB = require('./getDB');
const getGameUS = require('./getGameUS');
const logger = require('./logger');

const channel = process.env.CHANNEL_PRICES_US;
const games_us = process.env.GAMES_US;

const redis_client = redis.createClient();
const redis_client_set = promisify(redis_client.set).bind(redis_client);
const redis_client_get = promisify(redis_client.get).bind(redis_client);

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
  await redis_client_set('getAllGames', 'true');
  for await (const index of indexes) {
    for await (const param of params) {
      if (discount_b) {
        param.facetFilters.push(['generalFilters:Deals']);
      }
      let data;
      await getData
        .algoliasearch(index, '', param)
        .then((res) => {
          data = res.reverse();
        })
        .catch((err) => {
          logger.error('error', err);
        });
      const games = [];
      for await (const hit of data) {
        await redis_client_get(hit.objectID).then((reply) => {
          if (!reply || (discount_b && reply - Date.now() <= 0)) {
            games.push(hit);
          }
        });
      }
      for await (const game of games) {
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
                    await redis_client_set(
                      result.game.objectID,
                      result.post.discount_end_date,
                    );
                  } else {
                    await redis_client_set(result.game.objectID, 0);
                  }
                  await delay(1000 * 60 * 2);
                })
                .catch((err) => {
                  logger.log('error', `sendPhoto: ${err}`);
                });
            })
            .catch(async () => {
              await bot.telegram
                .sendPhoto(channel, result.post.image, options)
                .then(async (res_sendPhoto) => {
                  result.game.file_id =
                    res_sendPhoto.photo[res_sendPhoto.photo.length - 1].file_id;
                  if (discount_b) {
                    await redis_client_set(
                      result.game.objectID,
                      result.post.discount_end_date,
                    );
                  } else {
                    await redis_client_set(result.game.objectID, 0);
                  }
                  await getDB.addUS(result.game, games_us).catch((err) => {
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
  }
  redis_client.del('getAllGames');
};

module.exports = getGamesUS;
