const { promisify } = require('util');
const redis = require('redis');
const delay = require('delay');
const getData = require('./getData');
const logger = require('./logger');
const doPost = require('./doPost');

const botname = process.env.BOT_USERNAME;
const channel = process.env.CHANNEL_AMIIBO;

const redis_client = redis.createClient();
const redis_client_set = promisify(redis_client.set).bind(redis_client);
const redis_client_get = promisify(redis_client.get).bind(redis_client);
const redis_client_del = promisify(redis_client.del).bind(redis_client);

const getAmiibo = (figure) =>
  new Promise((resolve, _reject) => {
    const post = {};
    post.image = `https:${figure.figure_image_url_s}`;
    const title = `[${figure.title}](https://nintendo.ru${figure.url})`;
    let collection = `#${figure.figure_collection_value_t}`;
    collection = collection.replace(/_/g, '\\_');
    const description = figure.excerpt;
    let hachtags = '';
    figure.game_series_txt.forEach((tag) => {
      hachtags += `#${tag} `;
    });
    hachtags = hachtags.replace(/_/g, '\\_');
    post.message = `${title}\n${collection}\n\n${description}\n${hachtags}`;
    const keyboard = [];
    const buttons = [];
    let button = {};
    button.text = 'Купить б/у';
    button.url = `https://t.me/${botname}?start=buyamiibo_${figure.fs_id}`;
    buttons.push(button);
    button = {};
    button.text = 'Продать б/у';
    button.url = `https://t.me/${botname}?start=sellamiibo_${figure.fs_id}`;
    buttons.push(button);
    keyboard.push(buttons);
    post.keyboard = keyboard;
    resolve(post);
  });

exports.getAllAmiibo = async () => {
  await redis_client_set('getAllAmiibo', 'true');
  const url =
    'https://searching.nintendo-europe.com/ru/select?q=*&rows=9999&start=0&fq=type:FIGURE&sort=date_from asc&wt=json';
  let data;
  await getData
    .json(url)
    .then((res) => {
      data = res;
    })
    .catch(() => {
      return logger.log('error', 'no getAllAmiibo');
    });
  data = data.response.docs;
  const figures = [];
  for await (const doc of data) {
    if (doc.fs_id) {
      await redis_client_get(doc.fs_id).then((reply) => {
        if (!reply) {
          figures.push(doc);
        }
      });
    }
  }
  for await (const figure of figures) {
    let post;
    await getAmiibo(figure)
      .then((res) => {
        post = res;
      })
      .catch(() => {
        logger.log('error', 'no get Amiibo');
      });
    if (post) {
      await doPost(post, channel)
        .then(async () => {
          await redis_client_set(figure.fs_id, 0);
          await delay(1000 * 60 * 5);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  await redis_client_del('getAllAmiibo');
};

exports.getByGameId = (fs_id) =>
  new Promise((resolve, reject) => {
    (async () => {
      let amiibos;
      await getData
        .json(
          `https://searching.nintendo-europe.com/ru/select?fq=type%3AFIGURE%20AND%20((compatible_games_list_id_txt%3A%22${fs_id}%22))%20AND%20*%3A*&q=*&rows=500&sort=date_from%20asc&start=0&wt=json`,
        )
        .then((res) => {
          amiibos = res.response.docs;
          resolve(amiibos);
        })
        .catch((err) => {
          logger.log('error', err);
          reject(new Error('no amiibo'));
        });
    })();
  });
