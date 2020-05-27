const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');

const verifyScene = new Scene('verify_scene');

verifyScene.enter(async (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    Markup.urlButton(
      ctx.i18n.t('verify_scene_btn0'),
      'https://vk.me/the_continue_family',
    ),
  ]);
  await ctx.replyWithMarkdown(
    ctx.i18n.t('verify_scene_st0_0', { id: ctx.from.id }),
    Extra.markup(keyboard),
  );
  return ctx.scene.leave();
});

module.exports = verifyScene;
