const getData = require('./getData');
const regions = require('../data/regions.json');

const botname = process.env.BOT_USERNAME;
const url_cbr = 'https://www.cbr-xml-daily.ru/daily_json.js';
const platfrorms = [
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
let cbr;
getData(url_cbr)
  .then((data) => { cbr = data; })
  .catch((e) => console.error(e));

const getPost = async (data) => {
  const response = {};
  const keyboard = [];
  let system = '';
  let physical_version;
  let platform = '';
  data.system.forEach(async (el) => {
    if (platfrorms.includes(el)) {
      physical_version = true;
    }
    platform = el.replace(/ /g, '_');
    system += `#${platform} `;
  });
  let title = `[${data.title_ru}](https://nintendo.ru${data.url})\n ${system}`;
  title = title.replace(/_/g, '\\_');
  const { description } = data;
  let hashtags = '';
  if (data.categories) {
    data.categories.forEach((category) => {
      hashtags += `#${category} `;
    });
    hashtags += '\n';
  }
  if (data.languages) {
    data.languages.forEach((lang) => {
      hashtags += `#${lang} `;
    });
  }
  let prices = '';
  let prices_eu = '';
  if (data.nsuid) {
    const url_ru = `https://api.ec.nintendo.com/v1/price?country=RU&lang=en&ids=${data.nsuid}`;
    await getData(url_ru)
      .then((res) => {
        if (res.prices && res.prices[0].regular_price) {
          prices += `🇷🇺 ${res.prices[0].regular_price.raw_value}₽ \n`;
        }
      })
      .catch((e) => {
        console.log(url_ru, e);
      });
    await Object.keys(regions.EU).forEach((region, index) => {
      setTimeout(async () => {
        const url_eu = `https://api.ec.nintendo.com/v1/price?country=${region}&lang=en&ids=${data.nsuid}`;
        await getData(url_eu)
          .then((res) => {
            if (res.prices && res.prices[0].regular_price) {
              prices_eu = Math.round((cbr.Valute.EUR.Value / cbr.Valute.EUR.Nominal) * res.prices[0].regular_price.raw_value);
              prices += `🇪🇺 ${prices_eu}₽\n`;
            }
          });
      }, index * 10000);
    });
    Object.keys(regions.NONEU).forEach((region, index) => {
      let price_noneu;
      setTimeout(async () => {
        const url_noneu = `https://api.ec.nintendo.com/v1/price?country=${region}&lang=en&ids=${data.nsuid}`;
        await getData(url_noneu)
          .then((res) => {
            if (res.prices && res.prices[0].regular_price) {
              const { currency } = regions.NONEU[region];
              price_noneu = Math.round((cbr.Valute[currency].Value / cbr.Valute[currency].Nominal) * res.prices[0].regular_price.raw_value);
              if (price_noneu) {
                price_noneu = `${regions.NONEU[region].flag} ${price_noneu}₽\n`;
                prices += `${price_noneu}\n`;
              }
            }
          });
      }, index * 10000);
    });
  }
  if (data.physical_version || physical_version) {
    const buttons = [];
    let button = {};
    button.text = 'Купить б/у';
    button.url = `https://t.me/${botname}?start=buy_${data.nsuid}`;
    buttons.push(button);
    button = {};
    button.text = 'Продать б/у';
    button.url = `https://t.me/${botname}?start=sell_${data.nsuid}`;
    buttons.push(button);
    keyboard.push(buttons);
  }
  if (data.cloud_saves || data.subscription) {
    const buttons = [];
    const button = {};
    button.text = 'Nintendo Switch Online (350 р./год)';
    button.url = `https://t.me/${botname}?start=family_subscribe`;
    buttons.push(button);
    keyboard.push(buttons);
  }
  response.message = `${title}\n\n${description}\n${hashtags}\n\n${prices}\n`;
  response.keyboard = keyboard;
  response.image = data.boxart_wide;
  return response;
};

module.exports = getPost;
