require('dotenv').config();
const { promisify } = require('util');
const delay = require('delay');
const redis = require('redis');
const getData = require('./getData');
const getGame = require('./getGame');
const doPost = require('./doPost');
const logger = require('./logger');

const redis_client = redis.createClient();
const redis_client_set = promisify(redis_client.set).bind(redis_client);
const redis_client_get = promisify(redis_client.get).bind(redis_client);

const getAllgames = async (discount_b) => {
  await redis_client_set('getAllGames', 'true');
  const url =
    'https://searching.nintendo-europe.com/ru/select?q=*&rows=9999&start=0&fq=type:GAME,DLC&sort=date_from%20asc&wt=json';
  let data = await getData.json(url);
  data = data.response.docs;
  data = data.filter((docs) => docs.nsuid_txt);
  if (discount_b) {
    data = data.filter((docs) => docs.price_has_discount_b);
  }
  const games = [];
  for await (const doc of data) {
    if (doc.nsuid_txt[0]) {
      await redis_client_get(doc.nsuid_txt[0]).then((reply) => {
        if (!reply || (discount_b && reply - Date.now() <= 0)) {
          games.push(doc);
        }
      });
    }
  }
  for await (const game of games) {
    let post;
    await getGame(game, discount_b)
      .then((res) => {
        post = res;
      })
      .catch(() => {});
    if (post) {
      await doPost(post, discount_b)
        .then(async () => {
          if (discount_b) {
            await redis_client_set(post.nsuid[0], post.discount_end_date);
          } else {
            await redis_client_set(post.nsuid[0], 0);
          }
          await delay(1000 * 60 * 5);
        })
        .catch(() => {
          logger.log(
            'error',
            '\x1b[31m',
            'doPost',
            game.title,
            game.nsuid_txt[0],
            '\x1b[0m',
          );
        });
    }
  }
  redis_client.del('getAllGames');
};

module.exports = getAllgames;
