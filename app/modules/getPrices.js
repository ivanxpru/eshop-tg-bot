const delay = require('delay');
const getData = require('./getData');
const regions = require('../data/regions.json');

const url_cbr = 'https://www.cbr-xml-daily.ru/daily_json.js';
let cbr;

getData
  .json(url_cbr)
  .then((res) => {
    cbr = res;
  })
  .catch(async (err) => {
    console.error(err);
  });

setInterval(async () => {
  // Получаем курсы валют раз в сутки
  await getData
    .json(url_cbr)
    .then((res) => {
      cbr = res;
    })
    .catch((err) => {
      console.error(err);
    });
}, 1000 * 60 * 60 * 24);

const getPricesRU = (nsuid, discount_b) =>
  new Promise((resolve, reject) => {
    const url_ru = `https://api.ec.nintendo.com/v1/price?country=RU&lang=en&ids=${nsuid}`;
    const response = {};
    response.prices_ru = '';
    (async () => {
      await getData
        .json(url_ru)
        .then((res) => {
          if (res.prices && res.prices[0].regular_price) {
            if (discount_b && res.prices[0].discount_price) {
              const discount_end_date = new Date(
                Date.parse(res.prices[0].discount_price.end_datetime),
              );
              const day = discount_end_date.getDate(discount_end_date);
              const month = `0${discount_end_date.getMonth() + 1}`.slice(-2);
              const year = discount_end_date.getFullYear(discount_end_date);
              const price_discount_percentage_f =
                100 -
                (res.prices[0].discount_price.raw_value /
                  res.prices[0].regular_price.raw_value) *
                  100;
              response.discount = `Скидка: -${Math.round(
                price_discount_percentage_f,
              )}% [до: ${day}.${month}.${year}]`;
              response.prices_ru = `🇷🇺 ${res.prices[0].regular_price.raw_value}₽ → ${res.prices[0].discount_price.raw_value}₽ \n`;
              response.discount_end_date = discount_end_date;
            } else {
              response.prices_ru = `🇷🇺 ${res.prices[0].regular_price.raw_value}₽ \n`;
            }
          }
        })
        .catch(() => {
          reject(new Error('getPricesRU'));
        });
      if (response.prices_ru) {
        resolve(response);
      } else {
        reject(new Error('getPricesRU'));
      }
    })();
  });

const getPricesEU = (nsuid, discount) =>
  new Promise((resolve, reject) => {
    const response = {};
    response.prices_eu = '';
    (async () => {
      for await (const region of Object.keys(regions.EU)) {
        const url_eu = `https://api.ec.nintendo.com/v1/price?country=${region}&lang=en&ids=${nsuid}`;
        await getData
          .json(url_eu)
          .then((res) => {
            if (res.prices && res.prices[0].regular_price) {
              const currency_eu = cbr.Valute.EUR.Value / cbr.Valute.EUR.Nominal;
              const price_eu_regular = Math.round(
                currency_eu * res.prices[0].regular_price.raw_value,
              );
              if (discount && res.prices[0].discount_price) {
                const discount_end_date = new Date(
                  Date.parse(res.prices[0].discount_price.end_datetime),
                );
                const day = discount_end_date.getDate(discount_end_date);
                const month = `0${discount_end_date.getMonth() + 1}`.slice(-2);
                const year = discount_end_date.getFullYear(discount_end_date);
                const price_discount_percentage_f =
                  100 -
                  (res.prices[0].discount_price.raw_value /
                    res.prices[0].regular_price.raw_value) *
                    100;
                response.discount = `Скидка: -${Math.round(
                  price_discount_percentage_f,
                )}% [до: ${day}.${month}.${year}]`;
                response.discount_end_date = discount_end_date;
                const price_eu_discount = Math.round(
                  currency_eu * res.prices[0].discount_price.raw_value,
                );
                response.prices_eu = `🇪🇺 ${price_eu_regular}₽ → ${price_eu_discount}₽ \n`;
              } else {
                response.prices_eu = `🇪🇺 ${price_eu_regular}₽\n`;
              }
            }
          })
          .catch(() => {
            reject(new Error('getPricesEU'));
          });
        await delay(1000);
      }
      if (response.prices_eu) {
        resolve(response);
      } else {
        reject(new Error('getPricesEU'));
      }
    })();
  });

const getPricesNONEU = (nsuid, discount) =>
  new Promise((resolve, reject) => {
    const response = {};
    response.prices_noneu = '';
    (async () => {
      for await (const region of Object.keys(regions.NONEU)) {
        const url_noneu = `https://api.ec.nintendo.com/v1/price?country=${region}&lang=en&ids=${nsuid}`;
        await getData
          .json(url_noneu)
          .then((res) => {
            if (res.prices && res.prices[0].regular_price) {
              const { currency } = regions.NONEU[region];
              const currency_noneu =
                cbr.Valute[currency].Value / cbr.Valute[currency].Nominal;
              const price_noneu_regular = Math.round(
                currency_noneu * res.prices[0].regular_price.raw_value,
              );
              if (discount && res.prices[0].discount_price) {
                const discount_end_date = new Date(
                  Date.parse(res.prices[0].discount_price.end_datetime),
                );
                const day = discount_end_date.getDate(discount_end_date);
                const month = `0${discount_end_date.getMonth() + 1}`.slice(-2);
                const year = discount_end_date.getFullYear(discount_end_date);
                const price_discount_percentage_f =
                  100 -
                  (res.prices[0].discount_price.raw_value /
                    res.prices[0].regular_price.raw_value) *
                    100;
                response.discount = `Скидка: -${Math.round(
                  price_discount_percentage_f,
                )}% [до: ${day}.${month}.${year}]`;
                response.discount_end_date = discount_end_date;
                const price_eu_discount = Math.round(
                  currency_noneu * res.prices[0].discount_price.raw_value,
                );
                response.prices_noneu += `${regions.NONEU[region].flag} ${price_noneu_regular}₽ → ${price_eu_discount}₽ \n`;
              } else {
                response.prices_noneu += `${regions.NONEU[region].flag} ${price_noneu_regular}₽\n`;
              }
            }
          })
          .catch(() => {
            reject(new Error('getPricesNONEU'));
          });
        await delay(1000);
      }
      if (response.prices_noneu) {
        resolve(response);
      } else {
        reject(new Error('getPricesNONEU'));
      }
    })();
  });

const getPrices = (nsuid, discount_b) =>
  new Promise((resolve, reject) => {
    if (!cbr) {
      return reject(new Error('no get cbr'));
    }
    const response = {};
    let prices = '';
    let prices_ru;
    let prices_eu;
    let prices_noneu;
    let discount;
    let discount_end_date;
    (async () => {
      await getPricesRU(nsuid, discount_b)
        .then((res) => {
          prices_ru = res.prices_ru;
          if (discount_b && res.discount) {
            discount = res.discount;
            discount_end_date = res.discount_end_date;
          }
        })
        .catch(() => {
          prices_ru = false;
        });
      await delay(1000);
      await getPricesEU(nsuid, discount_b)
        .then((res) => {
          prices_eu = res.prices_eu;
          if (discount_b && res.discount) {
            discount = res.discount;
            discount_end_date = res.discount_end_date;
          }
        })
        .catch(() => {
          prices_eu = false;
        });
      await delay(1000);
      await getPricesNONEU(nsuid, discount_b)
        .then((res) => {
          prices_noneu = res.prices_noneu;
          if (discount_b && res.discount) {
            discount = res.discount;
            discount_end_date = res.discount_end_date;
          }
        })
        .catch(() => {
          prices_noneu = false;
        });
      await delay(1000);
      if (prices_ru) {
        prices += prices_ru;
      }
      if (prices_eu) {
        prices += prices_eu;
      }
      if (prices_noneu) {
        prices += prices_noneu;
      }
      if (prices) {
        response.prices = prices;
        if (discount) {
          response.discount_end_date = discount_end_date;
          response.prices += `\n\`${discount}\``;
        }
        resolve(response);
      } else {
        return reject(new Error('getPrices'));
      }
    })();
  });

module.exports = getPrices;
