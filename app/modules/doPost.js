require('dotenv').config();

const bot = require('./bots/mainBot');

const channel = process.env.CHANNEL;

const doPost = (post) =>
  new Promise((resolve, reject) => {
    const options = {
      caption: post.message,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: post.keyboard,
      }),
    };
    (async () => {
      await bot.telegram
        .sendPhoto(channel, post.image, options)
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(new Error(`sendPhoto ${err}`));
        });
    })();
  });

module.exports = doPost;
