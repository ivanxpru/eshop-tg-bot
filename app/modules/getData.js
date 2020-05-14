const https = require('https');

const getData = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    if (res.statusCode === 200) {
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data, 'utf8'));
        } catch (e) {
          reject(e.message, data);
        }
      });
    } else {
      reject(res.statusCode);
    }
  }).on('error', (e) => {
    reject(e.message);
  });
});

module.exports = getData;
