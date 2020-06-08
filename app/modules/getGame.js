const getPrices = require('./getPrices');

const botname = process.env.BOT_USERNAME;

const system_types = [
  'nes_cartridge',
  'snes_cartridge',
  'nintendo64_cartridge',
  'gamecube_disc',
  'wii_disc',
  'wiiu_disc',
  'nds_cartridge',
  '3ds_cartridge',
  'newnintendo3ds_gamecard',
  'nintendoswitch_gamecard',
  'commodore64',
  'gameboy_cartridge',
  'gameboycolor_cartridge',
  'gameboyadvance_cartridge',
  'sega_gamegear',
  'sega_megadrive',
  'turbografx',
];

const getGame = (data, discount_b) =>
  new Promise((resolve, reject) => {
    (async () => {
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
        } else if (data.image_url) {
          image = `https:${data.image_url}`;
        } else {
          image =
            'https://upload.wikimedia.org/wikipedia/commons/9/95/Nintendo_Logo_2017.png';
        }
        image = image.replace(/_/g, '_');
        if (data.system_type) {
          data.system_type.forEach((platform) => {
            if (system_types.includes(platform)) {
              physical_version = true;
            }
          });
        }
        if (data.system_names_txt) {
          data.system_names_txt.forEach((platform) => {
            if (platform === 'Nintendo Switch') {
              nx = true;
            }
            system += `#${platform.replace(/ /g, '_')} `;
          });
        } else if (data.required_system_txt) {
          data.required_system_txt.forEach((platform) => {
            system += `#${platform.replace(/ /g, '_')} `;
          });
        }
        let title = `[${data.title}](https://nintendo.ru${data.url})\n${system}`;
        title = title.replace(/_/g, '\\_');
        let description = data.excerpt;
        description = description.replace(/^DLC/g, '#DLC');
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
    })();
  });

module.exports = getGame;
