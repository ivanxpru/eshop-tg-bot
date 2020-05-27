const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const delay = require('delay');
const getLot = require('../getLot');

const buyScene = new Scene('buy_scene');
const buySceneSt1 = new Scene('buy_scene_st1');
const buySceneSt2 = new Scene('buy_scene_st2');

buyScene.enter(async (ctx) => {
  let options;
  ctx.session.state = {};
  ctx.session.state.message = {};
  ctx.session.state.lot = {};
  ctx.session.state.lot.nsuid = ctx.state.game.nsuid;
  ctx.session.state.lot.title = ctx.state.game.title_ru;
  ctx.session.state.lot.boxart_wide = ctx.state.game.boxart_wide;
  let lots;
  try {
    lots = await getLot.getByNsuid(ctx.session.state.lot.nsuid);
  } catch {
    lots = null;
  }
  let message = '';
  if (lots) {
    message = ctx.i18n.t('buy_scene_st0_1', { title: ctx.session.state.lot.title });
  } else {
    message = ctx.i18n.t('buy_scene_st0_0', { title: ctx.session.state.lot.title });
  }
  options = {
    caption: message,
    parse_mode: 'Markdown',
  };
  await ctx.replyWithPhoto(ctx.session.state.lot.boxart_wide, options)
    .catch((err) => {
      console.error(err);
    });
  if (lots) {
    for await (const result of lots) {
      const user = await ctx.telegram.getChatMember(-1001232524950, result.user_id);
      message = '';
      message += `*${result.title}*\n`;
      message += `${result.subtitle}\n\n`;
      message += `${ctx.i18n.t('buy_scene_txt0')}: \`${result.price} ${ctx.i18n.t('buy_scene_txt1')}\`\n`;
      message += `${ctx.i18n.t('buy_scene_txt2')}: \`@${user.user.username}\``;
      const keyboard = Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('buy_scene_btn0'), `view_${result._id}`),
      ]);
      options = {
        caption: message,
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify(Extra.markup(keyboard).reply_markup),
      };
      await ctx.replyWithPhoto(result.photo, options)
        .catch((err) => {
          console.error(err);
        });
      await delay(1000);
    }
  } else {
    ctx.scene.leave();
  }
})
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    if (ctx.update.callback_query.data.split('_')[0] === 'view') {
      ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
      ctx.scene.enter('buy_scene_st1');
    }
    return next();
  })
  .on('messsage', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id);
    return next();
  });

buySceneSt1.enter(async (ctx, next) => {
  let result = {};
  try {
    result = await getLot.getByLotId(ctx.session.state.lot._id);
  } catch {
    result = null;
  }
  if (result) {
    const user = await ctx.telegram.getChatMember(-1001232524950, result.user_id);
    let message = '';
    message += `*${result.title}*\n`;
    message += `${result.subtitle}\n\n`;
    message += `${result.description}\n\n`;
    message += `${ctx.i18n.t('buy_scene_txt0')}: \`${result.price}  ${ctx.i18n.t('buy_scene_txt1')}\`\n\n`;
    message += `${ctx.i18n.t('buy_scene_txt2')}: \`@${user.user.username}\`\n\n`;
    message += `\`${result._id}\``;

    const keyboard = Markup.inlineKeyboard([
      Markup.urlButton(ctx.i18n.t('buy_scene_btn1'), `https://t.me/${user.user.username}`),
      Markup.callbackButton(ctx.i18n.t('buy_scene_btn2'), `lots_${result.user_id}`),
    ]);
    const options = {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify(Extra.markup(keyboard).reply_markup),
    };
    await ctx.replyWithPhoto(result.photo, options)
      .catch(async (err) => {
        console.error(err);
      });
  } else {
    // обработчик ошибки
  }
  return next();
})
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    if (ctx.update.callback_query.data.split('_')[0] === 'lots') {
      ctx.session.state.lot.user_id = ctx.update.callback_query.data.split('_')[1];
      ctx.scene.enter('buy_scene_st2');
      return next();
    }
  })
  .on('messsage', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id);
    return next();
  });

buySceneSt2.enter(async (ctx) => {
  let lots;
  let options;
  try {
    lots = await getLot.getByUserId(Number.parseInt(ctx.session.state.lot.user_id, 10), 'active');
  } catch {
    lots = null;
  }
  let message = '';
  const user = await ctx.telegram.getChatMember(-1001232524950, Number.parseInt(ctx.session.state.lot.user_id, 10));
  if (lots) {
    message = ctx.i18n.t('buy_scene_st1_1', { user: user.user.username });
  } else {
    message = ctx.i18n.t('buy_scene_st1_0', { user: user.user.username });
  }

  await ctx.replyWithMarkdown(message)
    .catch((err) => {
      console.error(err);
    });
  if (lots) {
    for await (const result of lots) {
      message = '';
      message += `*${result.title}*\n`;
      message += `${result.subtitle}\n\n`;
      message += `${ctx.i18n.t('buy_scene_txt0')}: \`${result.price} ${ctx.i18n.t('buy_scene_txt1')}\`\n`;
      message += `${ctx.i18n.t('buy_scene_txt2')}: \`@${user.user.username}\``;
      const keyboard = Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('buy_scene_btn0'), `view_${result._id}`),
      ]);
      options = {
        caption: message,
        parse_mode: 'Markdown',
        reply_markup: JSON.stringify(Extra.markup(keyboard).reply_markup),
      };
      await ctx.replyWithPhoto(result.photo, options)
        .catch((err) => {
          console.error(err);
        });
      await delay(1000);
    }
  } else {
    ctx.scene.leave();
  }
})
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    if (ctx.update.callback_query.data.split('_')[0] === 'view') {
      ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
      ctx.scene.enter('buy_scene_st1');
    }
    return next();
  })
  .on('messsage', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id);
    return next();
  });

module.exports = [buyScene, buySceneSt1, buySceneSt2];
