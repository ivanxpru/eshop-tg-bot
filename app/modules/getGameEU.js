const getPrices = require('./getPrices');
const logger = require('./logger');

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

const getData = (data) => {
  const game = {};
  game.fs_id = Number.parseInt(data.fs_id, 10);
  game.title_eu = data.title;
  game.categories = [];
  if (data.game_categories_txt) {
    for (const category of data.game_categories_txt) {
      game.categories.push(category);
    }
  }
  game.system_type = [];
  if (data.system_type) {
    for (const system of data.system_type) {
      system.split(',').forEach((item) => {
        if (item) {
          if (system_types.includes(item)) {
            game.physical_version = true;
          }
          game.system_type.push(item);
        } else {
          if (system_types.includes(system)) {
            game.physical_version = true;
          } else {
            game.physical_version = !!data.physical_version_b;
          }
          game.system_type.push(system);
        }
      });
    }
  }
  game.system_name = [];
  if (data.system_names_txt) {
    for (const system_name of data.system_names_txt) {
      game.system_name.push(system_name);
    }
  } else if (data.required_system_txt) {
    for (const system_name of data.required_system_txt) {
      game.system_name.push(system_name);
    }
  }
  game.publisher_eu = data.publisher;
  if (data.date_from) {
    game.date_release_eu = new Date(Date.parse(data.date_from));
  }
  game.description_eu = data.excerpt;
  game.url_eu = data.url;
  game.languages = [];
  if (data.language_availability) {
    data.language_availability[0].split(',').forEach((language) => {
      game.languages.push(language);
    });
  }
  game.nsuid_eu = Number.parseInt(data.nsuid_txt[0], 10);
  game.mode_tv = !!data.play_mode_tv_mode_b;
  game.mode_handheld = !!data.play_mode_handheld_mode_b;
  game.mode_tabletop = !!data.play_mode_tabletop_mode_b;
  game.hd_rumble = !!data.hd_rumble_b;
  game.ir_camera = !!data.ir_motion_camera_b;
  game.amiibo = !!data.near_field_comm_b;
  game.labo = !!data.labo_b;
  game.cloud_saves = !!data.cloud_saves_b;
  game.internet = !!data.internet;
  game.local_play = !!data.local_play;
  game.voice_chat = !!data.voice_chat_b;
  game.fts = Math.ceil(data.price_sorting_f) === 0;
  game.demo = !!data.demo_availability;
  game.dlc = !!data.dlc_shown_b;
  game.subscription = !!data.paid_subscription_required_b;
  if (data.wishlist_email_banner460w_image_url_s) {
    game.boxart_eu = `https:${data.wishlist_email_banner460w_image_url_s}`;
  } else if (data.image_url) {
    game.boxart_eu = `https:${data.image_url}`;
  } else {
    game.boxart_eu =
      'https://upload.wikimedia.org/wikipedia/commons/9/95/Nintendo_Logo_2017.png';
  }
  return game;
};

const getGameEU = (data, discount_b) =>
  new Promise((resolve, _reject) => {
    (async () => {
      const response = [];
      const game = getData(data);
      response.game = game;
      const post = {};
      let prices;
      let system = '';
      let hashtags = '';
      let image = game.boxart_eu;
      image = image.replace(/_/g, '_');
      const keyboard = [];
      for (const platform of game.system_name) {
        system += `#${platform.replace(/ /g, '_')} `;
      }
      system = system.replace(/_/g, '\\_');
      const title = `[${game.title_eu}](https://nintendo.ru${game.url_eu})\n${system}`;
      let description = game.description_eu;
      description = description.replace(/^DLC/g, '#DLC');
      for (const category of game.categories) {
        hashtags += `#${category} `;
      }
      for (const language of game.languages) {
        hashtags += `#${language} `;
      }
      if (game.amiibo) {
        hashtags += `#amiibo`;
      }
      hashtags = hashtags.replace(/_/g, '\\_');
      if (game.nsuid_eu) {
        await getPrices
          .EU(game.nsuid_eu, discount_b)
          .then((res) => {
            prices = res;
          })
          .catch((err) => {
            logger.log('error', err);
          });
      }
      if (!prices) {
        prices = false;
      }
      /*
      if (game.physical_version) {
        const buttons = [];
        let button = {};
        button.text = 'Купить б/у';
        button.url = `https://t.me/${botname}?start=buyEU_${data.fs_id}`;
        buttons.push(button);
        button = {};
        button.text = 'Продать б/у';
        button.url = `https://t.me/${botname}?start=sellEU_${data.fs_id}`;
        buttons.push(button);
        keyboard.push(buttons);
      }
      */
      /*
      const buttons = [];
      let button;
      button = Markup.callbackButton('👍', 'like');
      buttons.push(button);
      button = Markup.callbackButton('👎', 'unlike');
      buttons.push(button);
      keyboard.push(buttons);
      */
      /*
      if ((game.cloud_saves && nx) || (game.subscription && nx)) {
        const buttons = [];
        const button = {};
        button.text = 'Nintendo Switch Online (350 р./год)';
        button.url = `https://t.me/${botname}?start=family_subscribe`;
        buttons.push(button);
        keyboard.push(buttons);
      }
      */
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
        response.game.discount_end_date_eu = prices.discount_end_date;
      } else {
        response.game.discount_end_date_eu = new Date(Date.now());
      }
      response.post = post;
      return resolve(response);
    })();
  });

module.exports = getGameEU;
