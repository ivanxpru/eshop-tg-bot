require('dotenv').config();

const delay = require('delay');
const redis = require('redis');
const getData = require('./getData');
const getPost = require('./getPost');
const doPost = require('./doPost');
const logger = require('./logger');

const redis_client = redis.createClient();

const getAllgames = async (discount_b) => {
  redis_client.set('getAllGames', 'true');
  const url =
    'https://searching.nintendo-europe.com/ru/select?q=*&fq=type%3AGAME%20AND%20*%3A*&sort=date_from%20asc&start=0&rows=9999&wt=json';
  let games = await getData(url);
  games = games.response.docs;
  games = games.filter((docs) => docs.nsuid_txt);
  if (discount_b) {
    games = games.filter((docs) => docs.price_has_discount_b);
  }
  for await (const game of games) {
    let post;
    await getPost(game, discount_b)
      .then((res) => {
        post = res;
      })
      .catch(() => {});
    if (post) {
      await doPost(post, discount_b)
        .then(async () => {
          await delay(1000 * 60 * 1);
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
