require('dotenv').config();
const https = require('https');
const algoliasearch = require('algoliasearch');

const algoliasearch__client = algoliasearch(
  process.env.ALGOLIASEARCH_ID,
  process.env.ALGOLIASEARCH_KEY,
);

exports.json = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        if (res.statusCode === 200) {
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data, 'utf8'));
            } catch (e) {
              reject(e.message, data);
            }
          });
        } else {
          reject(new Error(`getData ${url} ${res.statusCode}`));
        }
      })
      .on('error', (_e) => {
        reject();
      });
  });

exports.jsonp = (url, cb) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        if (res.statusCode === 200) {
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              data = data.slice(cb.length + 1, data.length - 2);
              resolve(JSON.parse(data, 'utf8'));
            } catch (e) {
              reject(e.message, data);
            }
          });
        } else {
          reject(new Error(`getData ${url} ${res.statusCode}`));
        }
      })
      .on('error', (_e) => {
        reject();
      });
  });

exports.algoliasearch = (index, query, param) =>
  new Promise((resolve, reject) => {
    const algoliasearch__index = algoliasearch__client.initIndex(index);
    (async () => {
      await algoliasearch__index
        .search(query, param)
        .then(({ hits }) => {
          return resolve(hits);
        })
        .catch((err) => {
          return reject(err);
        });
    })();
  });
