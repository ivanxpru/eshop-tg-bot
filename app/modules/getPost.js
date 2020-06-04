const redis = require('redis');
const getPrices = require('./getPrices');

const redis_client = redis.createClient();

const botname = process.env.BOT_USERNAME;

const physical_platfrorms = [
  'Nintendo Entertainment System',
  'Commodore 64',
  'Game Boy',
  'Game Boy Color',
  'Game Boy Advance',
  'Nintendo GameCube',
  'SEGA MEGA DRIVE',
  'SEGA Game Gear',
  'Super Nintendo',
  'Nintendo 64',
];

const getPost = (data, discount_b) =>
  new Promise((resolve, reject) => {
    redis_client.get(data.nsuid_txt[0], async (_err, reply) => {
      if (!reply || reply - Date.now() < 0) {
        const post = {};
        let prices;
        let physical_version = false;
        let nx = false;
        let system = '';
        let hashtags = '';
        let image;
        const keyboard = [];
        if (Number.isInteger(Number.parseInt(data.nsuid_txt[0], 10))) {
          post.nsuid = data.nsuid_txt;
          if (data.wishlist_email_banner460w_image_url_s) {
            image = `https:${data.wishlist_email_banner460w_image_url_s}`;
          } else {
            image =
              'https://upload.wikimedia.org/wikipedia/commons/9/95/Nintendo_Logo_2017.png';
          }
          image = image.replace(/_/g, '_');
          data.system_names_txt.forEach((platform) => {
            if (platform === 'Nintendo Switch') {
              nx = true;
            }
            system += `#${platform.replace(/ /g, '_')} `;
            if (physical_platfrorms.includes(platform)) {
              physical_version = true;
            }
          });
          let title = `[${data.title}](https://nintendo.ru${data.url})\n${system}`;
          title = title.replace(/_/g, '\\_');
          const description = data.excerpt;
          if (data.game_categories_txt) {
            data.game_categories_txt.forEach((category) => {
              hashtags += `#${category} `;
            });
            hashtags += '\n';
          }
          if (data.language_availability) {
            data.language_availability[0].split(',').forEach((language) => {
              hashtags += `#${language} `;
            });
          }
          hashtags = hashtags.replace(/_/g, '\\_');
          await getPrices(data.nsuid_txt[0], discount_b)
            .then((res) => {
              prices = res;
            })
            .catch(() => {});
          if (!prices) {
            return reject(new Error('no get prices'));
          }
          if (data.physical_version_b || physical_version) {
            const buttons = [];
            let button = {};
            button.text = 'Купить б/у';
            button.url = `https://t.me/${botname}?start=buy_${data.nsuid_txt[0]}`;
            buttons.push(button);
            button = {};
            button.text = 'Продать б/у';
            button.url = `https://t.me/${botname}?start=sell_${data.nsuid_txt[0]}`;
            buttons.push(button);
            keyboard.push(buttons);
          }
          /*
          if (data.near_field_comm_b) {
            const buttons = [];
            const button = {};
            button.text = 'Совместимые amiibo';
            button.url = `https://t.me/${botname}?start=amiibo_${data.fs_id}`;
            buttons.push(button);
            keyboard.push(buttons);
          }
          */
          if ((data.cloud_saves_b && nx) || (data.internet && nx)) {
            const buttons = [];
            const button = {};
            button.text = 'Nintendo Switch Online (350 р./год)';
            button.url = `https://t.me/${botname}?start=family_subscribe`;
            buttons.push(button);
            keyboard.push(buttons);
          }
          if (prices) {
            post.message = `${title}\n\n${description}\n${hashtags}\n\n${prices.prices}`;
          } else {
            post.message = `${title}\n\n${description}\n${hashtags}\n\nSOLD OUT`;
          }
          post.image = image;
          if (keyboard) {
            post.keyboard = keyboard;
          }
          if (discount_b && prices.discount_end_date) {
            post.discount_end_date = prices.discount_end_date;
          }
          resolve(post);
        } else {
          console.log(data.title, data.nsuid_txt[0]);
          reject(new Error(`Not valid nsuid: ${data.nsuid_txt[0]}`));
        }
      } else {
        reject(new Error('Game has posted before'));
      }
    });
  });

module.exports = getPost;
