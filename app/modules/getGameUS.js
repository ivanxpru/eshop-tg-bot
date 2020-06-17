const Entities = require('html-entities').AllHtmlEntities;
const getPrices = require('./getPrices');
const logger = require('./logger');

const entities = new Entities();
const botname = process.env.BOT_USERNAME;

const virtualConsole = [
  'NES',
  'Super NES',
  'Game Boy',
  'Game Boy Color',
  'Nintendo 64',
  'Game Boy Advance',
];

const getData = (data) => {
  const game = {};
  game.objectID = data.objectID;
  game.title_us = data.title;
  game.categories = [];
  if (data.categories) {
    for (const category of data.categories) {
      game.categories.push(category.toLowerCase());
    }
  }
  game.system_name = [];
  if (data.virtualConsole !== 'na') {
    game.system_name.push(data.virtualConsole);
    if (virtualConsole.includes(data.virtualConsole)) {
      game.physical_version = true;
    }
  }
  if (data.platform) {
    game.system_name.push(data.platform);
  }
  for (const shop of data.filterShops) {
    if (shop === 'At retail') {
      game.physical_version = true;
    }
  }
  game.publisher_us = data.publishers[0];
  game.date_release_us = new Date(Date.parse(data.releaseDateMask));
  game.description_us = data.description;
  game.url_us = data.url;
  if (data.nsuid) {
    game.nsuid_us = Number.parseInt(data.nsuid, 10);
  }
  game.fts = !!data.freeToStart;
  for (const filter of data.generalFilters) {
    if (filter === 'Online Play via Nintendo Switch Online') {
      game.subscription = true;
    } else {
      game.subscription = false;
    }
    if (filter === 'Demo available') {
      game.demo = true;
    }
  }
  game.boxart_us = `https://www.nintendo.com${data.boxArt}`;
  return game;
};

const getGameUS = (data, discount_b) =>
  new Promise((resolve, _reject) => {
    (async () => {
      const response = [];
      const game = getData(data);
      response.game = game;
      const post = {};
      const keyboard = [];
      let system = '';
      let hashtags = '';
      let image = game.boxart_us;
      image = image.replace(/_/g, '_');
      for (const platform of game.system_name) {
        system += `#${platform.replace(/ /g, '_')} `;
      }
      system = system.replace(/_/g, '\\_');
      const title = `[${entities.decode(game.title_us)}](https://nintendo.com${
        game.url_us
      })\n${system}`;
      let description = entities.decode(game.description_us);
      description = description.replace(/\* /, '\n');
      description = description.replace(/\• /, '\n');
      description = description.replace(/\*/g, '\\*');
      if (description.split('\n').length) {
        description = description.split('\n')[0];
      }
      description = `${description.substr(0, 900)}...`;
      for await (let category of game.categories) {
        category = category.replace(/-/g, '\\_');
        category = category.replace(/ /g, '\\_');
        hashtags += `#${category} `;
      }
      if (game.fts) {
        hashtags += '#fts ';
      }
      if (game.demo) {
        hashtags += '#demo ';
      }
      let prices;
      if (game.nsuid_us) {
        await getPrices
          .USnsuid(game.nsuid_us, discount_b)
          .then((res) => {
            prices = res;
          })
          .catch((err) => {
            logger.log('error', err);
          });
      } else if (data.msrb) {
        await getPrices
          .USmsrp(data.msrb)
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
      if (game.physical_version) {
        const buttons = [];
        let button = {};
        button.text = 'Купить б/у';
        button.url = `https://t.me/${botname}?start=buyUS_${data.objectID}`;
        buttons.push(button);
        button = {};
        button.text = 'Продать б/у';
        button.url = `https://t.me/${botname}?start=sellUS_${data.objectID}`;
        buttons.push(button);
        keyboard.push(buttons);
      }
      if (game.subscription) {
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
        post.message = `${title}\n\n${description}\n${hashtags}`;
      }
      post.image = image;
      if (keyboard) {
        post.keyboard = keyboard;
      }
      if (discount_b && prices.discount_end_date) {
        post.discount_end_date = prices.discount_end_date;
      }
      response.post = post;
      return resolve(response);
    })();
  });

module.exports = getGameUS;
