const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const logger = require('../logger');
const getLot = require('../getLot');

const sellScene = new Scene('sell_scene');
const sellSceneSt1 = new Scene('sell_scene_st1');
const sellSceneSt2 = new Scene('sell_scene_st2');
const sellSceneSt3 = new Scene('sell_scene_st3');
const sellSceneSt4 = new Scene('sell_scene_st4');
const sellSceneSt5 = new Scene('sell_scene_st5');

sellScene.enter(async (ctx, next) => {
  ctx.session.state = {};
  ctx.session.state.message = {};
  ctx.session.state.lot = {};
  ctx.session.state.lot.user_id = ctx.from.id;
  ctx.session.state.lot.status = 'active'; // active | archive | sold | banned
  ctx.session.state.lot.nsuid = ctx.state.game.nsuid;
  ctx.session.state.lot.title = ctx.state.game.title_ru;
  ctx.session.state.lot.boxart_wide = ctx.state.game.boxart_wide;
  const message = ctx.i18n.t('sell_scene_st0_0', { title: ctx.session.state.lot.title });
  const keyboard = Markup.inlineKeyboard([
    Markup.callbackButton(ctx.i18n.t('sell_scene_btn1'), 'next'),
    Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
  ]);
  const options = {
    caption: message,
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify(Extra.markup(keyboard).reply_markup),
  };
  ctx.session.state.message = await ctx.replyWithPhoto(ctx.session.state.lot.boxart_wide, options)
    .catch((err) => {
      logger.log('error', err);
    });
  return next();
})
  .action('next', (ctx) => {
    ctx.scene.enter('sell_scene_st1');
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

sellSceneSt1.enter(async (ctx, next) => {
  const buttons = [];
  if (!ctx.session.state.lot.subtitle) {
    buttons.push([Markup.callbackButton(ctx.i18n.t('sell_scene_btn2_0'), 'subtitle')]);
  } else {
    buttons.push([Markup.callbackButton(ctx.i18n.t('sell_scene_btn2_1'), 'subtitle')]);
  }
  if (!ctx.session.state.lot.description) {
    buttons.push([Markup.callbackButton(ctx.i18n.t('sell_scene_btn3_0'), 'description')]);
  } else {
    buttons.push([Markup.callbackButton(ctx.i18n.t('sell_scene_btn3_1'), 'description')]);
  }
  if (!ctx.session.state.lot.price) {
    buttons.push([Markup.callbackButton(ctx.i18n.t('sell_scene_btn4_0'), 'price')]);
  } else {
    buttons.push([Markup.callbackButton(ctx.i18n.t('sell_scene_btn4_1'), 'price')]);
  }
  if (ctx.session.state.lot.subtitle && ctx.session.state.lot.description && ctx.session.state.lot.price) {
    buttons.push([Markup.callbackButton(ctx.i18n.t('sell_scene_btn5'), 'post')]);
  }
  const keyboard = Markup.inlineKeyboard(buttons);
  let photo;
  if (!ctx.session.state.lot.photo) {
    photo = ctx.session.state.lot.boxart_wide;
  } else {
    photo = ctx.session.state.lot.photo;
  }
  let message = '';
  if (!ctx.session.state.lot.photo) {
    message += `${ctx.i18n.t('sell_scene_st1_0')}\n\n`;
  } else {
    message += `*${ctx.session.state.lot.title}*\n`;
  }
  if (ctx.session.state.lot.subtitle) {
    message += `${ctx.session.state.lot.subtitle}\n\n`;
  } else {
    message += `${ctx.i18n.t('sell_scene_st1_1')}\n\n`;
  }
  if (ctx.session.state.lot.description) {
    message += `${ctx.session.state.lot.description}\n\n`;
  } else {
    message += `${ctx.i18n.t('sell_scene_st1_2')}\n\n`;
  }
  if (ctx.session.state.lot.price) {
    message += `${ctx.i18n.t('sell_scene_txt0')}: \`${ctx.session.state.lot.price} ${ctx.i18n.t('sell_scene_txt1')}\``;
  } else {
    message += ctx.i18n.t('sell_scene_st1_3');
  }
  const media = {
    type: 'photo',
    media: photo,
    caption: message,
    parse_mode: 'Markdown',
  };
  await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
  return next();
})
  .action('subtitle', async (ctx, next) => { // sellSceneSt2
    ctx.scene.enter('sell_scene_st2');
    return next();
  })
  .action('description', async (ctx, next) => { // sellSceneSt3
    ctx.scene.enter('sell_scene_st3');
    return next();
  })
  .action('price', async (ctx, next) => { // sellSceneSt4
    ctx.scene.enter('sell_scene_st4');
    return next();
  })
  .action('post', async (ctx, next) => { // sellSceneSt5
    ctx.scene.enter('sell_scene_st5');
    return next();
  })
  .on('photo', async (ctx) => {
    ctx.session.state.lot.photo = ctx.message.photo[2].file_id;
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    ctx.scene.reenter();
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

sellSceneSt2.enter(async (ctx, next) => { // subtitle
  let photo;
  const keyboard = Markup.inlineKeyboard([
    Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
  ]);
  if (!ctx.session.state.lot.photo) {
    photo = ctx.session.state.lot.boxart_wide;
  } else {
    photo = ctx.session.state.lot.photo;
  }
  const media = {
    type: 'photo',
    media: photo,
    caption: ctx.i18n.t('sell_scene_st2_0'),
    parse_mode: 'Markdown',
  };
  await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
  return next();
})
  .on('text', async (ctx) => {
    let photo;
    if (ctx.message.text.length <= 155) {
      ctx.session.state.lot.subtitle = ctx.message.text;
      await ctx.deleteMessage(ctx.message.message_id);
      ctx.scene.enter('sell_scene_st1');
    } else {
      await ctx.deleteMessage(ctx.message.message_id);
      const keyboard = Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
      ]);
      if (!ctx.session.state.lot.photo) {
        photo = ctx.session.state.lot.boxart_wide;
      } else {
        photo = ctx.session.state.lot.photo;
      }
      const media = {
        type: 'photo',
        media: photo,
        caption: ctx.i18n.t('sell_scene_st2_1'),
        parse_mode: 'Markdown',
      };
      await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
    }
  })
  .on('message', async (ctx, next) => {
    let photo;
    const keyboard = Markup.inlineKeyboard([
      Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
    ]);
    await ctx.deleteMessage(ctx.message.message_id);
    if (!ctx.session.state.lot.photo) {
      photo = ctx.session.state.lot.boxart_wide;
    } else {
      photo = ctx.session.state.lot.photo;
    }
    const media = {
      type: 'photo',
      media: photo,
      caption: ctx.i18n.t('sell_scene_st2_2'),
      parse_mode: 'Markdown',
    };
    await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
    return next();
  });

sellSceneSt3.enter(async (ctx, next) => { // description
  let photo;
  const keyboard = Markup.inlineKeyboard([
    Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
  ]);
  if (!ctx.session.state.lot.photo) {
    photo = ctx.session.state.lot.boxart_wide;
  } else {
    photo = ctx.session.state.lot.photo;
  }
  const media = {
    type: 'photo',
    media: photo,
    caption: ctx.i18n.t('sell_scene_st3_0'),
    parse_mode: 'Markdown',
  };
  await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
  return next();
})
  .on('text', async (ctx) => {
    await ctx.deleteMessage(ctx.message.message_id);
    ctx.session.state.lot.description = ctx.message.text;
    ctx.scene.enter('sell_scene_st1');
  })
  .on('message', async (ctx, next) => {
    let photo;
    const keyboard = Markup.inlineKeyboard([
      Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
    ]);
    await ctx.deleteMessage(ctx.message.message_id);
    if (!ctx.session.state.lot.photo) {
      photo = ctx.session.state.lot.boxart_wide;
    } else {
      photo = ctx.session.state.lot.photo;
    }
    const media = {
      type: 'photo',
      media: photo,
      caption: ctx.i18n.t('sell_scene_st3_1'),
      parse_mode: 'Markdown',
    };
    await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
    return next();
  });

sellSceneSt4.enter(async (ctx, next) => { // price
  let photo;
  const keyboard = Markup.inlineKeyboard([
    Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
  ]);
  if (!ctx.session.state.lot.photo) {
    photo = ctx.session.state.lot.boxart_wide;
  } else {
    photo = ctx.session.state.lot.photo;
  }
  const media = {
    type: 'photo',
    media: photo,
    caption: ctx.i18n.t('sell_scene_st4_0'),
    parse_mode: 'Markdown',
  };
  await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
  return next();
})
  .on('text', async (ctx) => {
    let photo;
    const price = Number(ctx.message.text);
    const keyboard = Markup.inlineKeyboard([
      Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
    ]);
    if (!ctx.session.state.lot.photo) {
      photo = ctx.session.state.lot.boxart_wide;
    } else {
      photo = ctx.session.state.lot.photo;
    }
    if (Number(ctx.message.text) === price) {
      ctx.session.state.lot.price = price;
      await ctx.deleteMessage(ctx.message.message_id);
      ctx.scene.enter('sell_scene_st1');
    } else {
      const media = {
        type: 'photo',
        media: photo,
        caption: ctx.i18n.t('sell_scene_st4_1'),
        parse_mode: 'Markdown',
      };
      await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
    }
  })
  .on('message', async (ctx, next) => {
    let photo;
    const keyboard = Markup.inlineKeyboard([
      Markup.callbackButton(ctx.i18n.t('sell_scene_btn0'), 'cancel'),
    ]);
    await ctx.deleteMessage(ctx.message.message_id);
    if (!ctx.session.state.lot.photo) {
      photo = ctx.session.state.lot.boxart_wide;
    } else {
      photo = ctx.session.state.lot.photo;
    }
    const media = {
      type: 'photo',
      media: photo,
      caption: ctx.i18n.t('sell_scene_st4_2'),
      parse_mode: 'Markdown',
    };
    await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown().markup(keyboard));
    return next();
  });

sellSceneSt5.enter(async (ctx, next) => { // post
  const photo = ctx.session.state.lot.photo;
  const data = {};
  data.status = ctx.session.state.lot.status;
  data.user_id = ctx.session.state.lot.user_id;
  data.title = ctx.session.state.lot.title;
  data.subtitle = ctx.session.state.lot.subtitle;
  data.description = ctx.session.state.lot.description;
  data.photo = photo;
  data.nsuid = ctx.session.state.lot.nsuid;
  data.price = ctx.session.state.lot.price;
  let id;
  try {
    id = await getLot.add(data);
  } catch {
    console.log('Err!');
  }
  const keyboard = Markup.inlineKeyboard([
    Markup.urlButton(ctx.i18n.t('sell_scene_btn6'), `https://t.me/${ctx.chat.username}`),
  ]);
  let message = '';
  message += `*${ctx.session.state.lot.title}*\n`;
  message += `${ctx.session.state.lot.subtitle}\n\n`;
  message += `${ctx.session.state.lot.description}\n\n`;
  message += `${ctx.i18n.t('sell_scene_txt0')}: \`${ctx.session.state.lot.price} ${ctx.i18n.t('sell_scene_txt1')}\`\n\n`;
  message += `${ctx.i18n.t('sell_scene_txt2')}: [@${ctx.chat.username}](https://t.me/${ctx.chat.username})\n\n`;
  message += `\`${id}\``;
  const options = {
    caption: message,
    parse_mode: 'Markdown',
    reply_markup: JSON.stringify(Extra.markup(keyboard).reply_markup),
  };
  const media = {
    type: 'photo',
    media: photo,
    caption: message,
    parse_mode: 'Markdown',
  };
  await ctx.telegram.editMessageMedia(ctx.chat.id, ctx.session.state.message.message_id, undefined, media, Extra.markdown());
  await ctx.telegram.sendPhoto(-1001321269319, ctx.session.state.lot.photo, options)
    .catch((err) => {
      console.error(err);
    });
  await ctx.replyWithMarkdown(ctx.i18n.t('sell_scene_st5_0'));
  await ctx.replyWithMarkdown(ctx.i18n.t('sell_scene_st5_1'));
  ctx.session = {};
  ctx.scene.leave();
  return next();
});

module.exports = [sellScene, sellSceneSt1, sellSceneSt2, sellSceneSt3, sellSceneSt4, sellSceneSt5];
