require('dotenv').config();
const getData = require('./getData');
const getPost = require('./getPost');
const bot = require('./bot');

const channel = process.env.CHANNEL;
const url = 'https://eshopdb.ivanxpru.repl.co/api/v1.0/games/full';

const getAllgames = () => {
  console.log('getAllGames run');
  let games;
  getData(url)
    .then((res) => {
      games = res.games;
    })
    .then(() => {
      games.forEach((game, index) => {
        setTimeout(() => {
          getPost(game)
            .then((res) => {
              const options = {
                caption: res.message,
                parse_mode: 'Markdown',
                reply_markup: JSON.stringify({
                  inline_keyboard: res.keyboard
                })
              };
              bot.telegram.sendPhoto(channel, res.image, options)
                .catch((err) => {
                  console.error(err);
                });
            });
        }, index * 10000);
      });
    });
};

module.exports = getAllgames;
