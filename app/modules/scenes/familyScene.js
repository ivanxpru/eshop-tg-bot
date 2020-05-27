const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');

const familyScene = new Scene('family_scene');

familyScene.enter(async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    Markup.urlButton('Семейная подписка', 'https://vk.me/the_continue_family'),
  ]);
  const message = ctx.i18n.t('family_scene_st0_0');
  const options = {
    caption: message,
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify(Extra.markup(keyboard).reply_markup),
  };
  await ctx.replyWithPhoto('https://telegra.ph/file/de9069c729886c54e188f.jpg', options);
  ctx.session = {};
  ctx.scene.leave();
});

module.exports = familyScene;
