const https = require('https');

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
