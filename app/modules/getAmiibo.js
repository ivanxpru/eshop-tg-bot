const delay = require('delay');
const bot = require('./bots/mainBot');
const getData = require('./getData');
const getDB = require('./getDB');
const logger = require('./logger');

const channel = process.env.CHANNEL_AMIIBO;
const amiibo_eu = process.env.AMIIBO_EU;

const getAmiibo = (data) =>
  new Promise((resolve, _reject) => {
    const post = {};
    post.image = `https:${data.figure_image_url_s}`;
    const title = `[${data.title}](https://nintendo.ru${data.url})`;
    const pretty_date = `Дата выпуска: \`${data.pretty_date_s}\``;
    let collection = `#${data.figure_collection_value_t}`;
    collection = collection.replace(/_/g, '\\_');
    const description = data.excerpt;
    let hachtags = '';
    data.game_series_txt.forEach((tag) => {
      hachtags += `#${tag} `;
    });
    hachtags = hachtags.replace(/_/g, '\\_');
    post.message = `${title}\n${collection}\n${pretty_date}\n\n${description}\n${hachtags}`;
    post.figure = data;
    /*
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
    */
    resolve(post);
  });

exports.getAllAmiibo = async () => {
  const url =
    'https://searching.nintendo-europe.com/ru/select?q=*&rows=9999&start=0&fq=type:FIGURE&sort=date_from asc, figure_number_s  asc&wt=json';
  let data;
  await getData
    .json(url)
    .then((res) => {
      data = res;
    })
    .catch(() => {
      return logger.log('error', 'no getAllAmiibo');
    });
  if (data) {
    data = data.response.docs;
    data.sort((a, b) => (a.date_from < b.date_from || !b.date_from ? -1 : 1));
    const fs_ids = [];

    for await (const doc of data) {
      if (doc.fs_id) {
        fs_ids.push(Number.parseInt(doc.fs_id, 10));
      }
    }

    let docs;

    await getDB
      .findAmiiboEU(fs_ids, amiibo_eu)
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
      if (index >= 0) {
        data.splice(index, 1);
      }
    }
    for await (const figure of data) {
      let result;
      await getAmiibo(figure)
        .then((res) => {
          result = res;
        })
        .catch(() => {
          logger.log('error', 'no get Amiibo');
        });
      if (result) {
        const options = {
          caption: result.message,
          parse_mode: 'Markdown',
        };
        await bot.telegram
          .sendPhoto(channel, result.image, options)
          .then(async (res_sendPhoto) => {
            result.figure.fs_id = Number.parseInt(result.figure.fs_id, 10);
            result.figure.description = result.figure.excerpt;
            delete result.figure.excerpt;
            if (result.figure.date_from) {
              result.figure.date_release_eu = new Date(
                Date.parse(result.figure.date_from),
              );
              delete result.figure.date_from;
            }
            result.figure.file_id =
              res_sendPhoto.photo[res_sendPhoto.photo.length - 1].file_id;
            await getDB.addAmiiboEU(result.figure, amiibo_eu);
          });
        await delay(Number.parseInt(process.env.DELAY_POST, 10) * 60 * 1000);
      }
    }
  }
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
