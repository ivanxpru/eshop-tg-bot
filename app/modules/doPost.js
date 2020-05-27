require('dotenv').config();
const redis = require('redis');

const redis_client = redis.createClient();
const bot = require('./bots/mainBot');

const channel = process.env.CHANNEL;

const doPost = (post, discount_b) =>
  new Promise((resolve, reject) => {
    const options = {
      caption: post.message,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify({
        inline_keyboard: post.keyboard,
      }),
    };
    if (discount_b && post.discount_end_date) {
      redis_client.get(post.nsuid[0], async (_err, reply) => {
        // Проверяем наличие ключа в базе
        if (!reply || reply - Date.now() <= 0) {
          // Если его нет, то добавляем и публикуем пост
          redis_client.set(post.nsuid[0], post.discount_end_date);
          await bot.telegram
            .sendPhoto(channel, post.image, options)
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(new Error(`sendPhoto ${err.response.description}`));
            });
        }
      });
    } else {
      redis_client.get(post.nsuid[0], async (_err, reply) => {
        // Проверяем наличие ключа в базе
        if (!reply) {
          // Если его нет, то добавляем и публикуем пост
          redis_client.set(post.nsuid[0], 0);
          await bot.telegram
            .sendPhoto(channel, post.image, options)
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(new Error(`sendPhoto ${err}`));
            });
        }
      });
    }
  });

module.exports = doPost;
