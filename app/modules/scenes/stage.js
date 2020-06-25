const Stage = require('telegraf/stage');

// Сценарии
const familyScene = require('./familyScene');
const [buyScene, buySceneSt1, buySceneSt2] = require('./buyScene');
const [
  sellScene,
  sellSceneSt1,
  sellSceneSt2,
  sellSceneSt3,
  sellSceneSt4,
  sellSceneSt5,
] = require('./sellScene');
const [
  lotsScene,
  lotsSceneSt1,
  lotsSceneSt2,
  lotsSceneSt3,
  lotsSceneSt4,
  lotsSceneSt5,
  lotsSceneSt6,
] = require('./lotsScene');
const verifyScene = require('./verifyScene');

const stage = new Stage();

stage.register(familyScene);
stage.register(buyScene);
stage.register(buySceneSt1);
stage.register(buySceneSt2);
stage.register(sellScene);
stage.register(sellSceneSt1);
stage.register(sellSceneSt2);
stage.register(sellSceneSt3);
stage.register(sellSceneSt4);
stage.register(sellSceneSt5);
stage.register(lotsScene);
stage.register(lotsSceneSt1);
stage.register(lotsSceneSt2);
stage.register(lotsSceneSt3);
stage.register(lotsSceneSt4);
stage.register(lotsSceneSt5);
stage.register(lotsSceneSt6);
stage.register(verifyScene);

stage.action('cancel', async (ctx) => {
  await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
  ctx.session = {};
  ctx.scene.leave();
});

stage.start(async (ctx, next) => {
  ctx.session = {};
  ctx.scene.leave();
  return next();
});

module.exports = stage;
