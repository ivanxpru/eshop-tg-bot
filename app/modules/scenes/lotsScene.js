const Scene = require('telegraf/scenes/base');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const logger = require('../logger');
const getLot = require('../getLot');

const lotsScene = new Scene('lots_scene');
const lotsSceneSt1 = new Scene('lots_scene_st1');
const lotsSceneSt2 = new Scene('lots_scene_st2');
const lotsSceneSt3 = new Scene('lots_scene_st3');
const lotsSceneSt4 = new Scene('lots_scene_st4');
const lotsSceneSt5 = new Scene('lots_scene_st5');
const lotsSceneSt6 = new Scene('lots_scene_st6');

lotsScene.enter(async (ctx) => {
  ctx.state.counter = ctx.state.counter || 0;
  ctx.session.state = {};
  ctx.session.state.lot = {};
  let lots;
  await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st0_0'))
    .then((res) => {
      ctx.session.state.message = res;
    })
    .catch((err) => {
      logger.log('error', err);
    });
  try {
    lots = await getLot.getByUserId(ctx.from.id);
  } catch {
    lots = null;
  }
  if (lots.length) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.callbackButton(ctx.i18n.t('lots_scene_btn4'), 'all')],
      [
        Markup.callbackButton(ctx.i18n.t('lots_scene_btn5'), 'active'),
        Markup.callbackButton(ctx.i18n.t('lots_scene_btn6'), 'archive'),
      ],
      [
        Markup.callbackButton(ctx.i18n.t('lots_scene_btn7'), 'sold'),
        Markup.callbackButton(ctx.i18n.t('lots_scene_btn8'), 'banned'),
      ],
    ]);
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.state.message.message_id);
    ctx.state.message = await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st0_1', { lenght: lots.length }), Extra.markup(keyboard));
  } else {
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st0_2'));
    ctx.scene.leave();
  }
})
  .action('all', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene_st1');
    return next();
  })
  .action('active', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene_st2');
    return next();
  })
  .action('archive', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene_st3');
    return next();
  })
  .action('sold', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene_st4');
    return next();
  })
  .action('banned', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene_st5');
    return next();
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

lotsSceneSt1.enter(async (ctx) => {
  const lots = await getLot.getByUserId(ctx.from.id);
  const callbackButtons = [];
  lots.forEach((async (lot) => {
    const btnText = `${lot.title} [${lot.price} ${ctx.i18n.t('lots_scene_txt1')}] `;
    const btnAction = `view_${lot._id}`;
    callbackButtons.push([Markup.callbackButton(btnText, btnAction)]);
  }));
  callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
  const keyboard = Markup.inlineKeyboard(callbackButtons);
  await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st1_0'), Extra.markup(keyboard));
})
  .action('back', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene');
    return next();
  })
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.session.scene = ctx.session.__scenes.current;
    ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
    if (ctx.session.state.lot._id) {
      ctx.scene.enter('lots_scene_st6');
    }
    return next();
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });


lotsSceneSt2.enter(async (ctx) => {
  let lots;
  const callbackButtons = [];
  try {
    lots = await getLot.getByUserId(ctx.from.id, 'active');
  } catch {
    lots = [];
  }
  if (lots.length) {
    lots.forEach(async (lot) => {
      const btnText = `${lot.title} [${lot.price} ${ctx.i18n.t('lots_scene_txt1')}] `;
      const btnAction = `view_${lot._id}`;
      callbackButtons.push([Markup.callbackButton(btnText, btnAction)]);
    });
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st2_0'), Extra.markup(keyboard));
  } else {
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st2_1'), Extra.markup(keyboard));
  }
})
  .action('back', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene');
    return next();
  })
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.session.scene = ctx.session.__scenes.current;
    ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
    if (ctx.session.state.lot._id) {
      ctx.scene.enter('lots_scene_st6');
    }
    return next();
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

lotsSceneSt3.enter(async (ctx, next) => {
  let lots;
  const callbackButtons = [];
  try {
    lots = await getLot.getByUserId(ctx.from.id, 'archive');
  } catch {
    lots = [];
  }
  if (lots.length) {
    lots.forEach(async (lot) => {
      const btnText = `${lot.title} [${lot.price} ${ctx.i18n.t('lots_scene_txt1')}] `;
      const btnAction = `view_${lot._id}`;
      callbackButtons.push([Markup.callbackButton(btnText, btnAction)]);
    });
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st3_0'), Extra.markup(keyboard));
  } else {
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st3_1'), Extra.markup(keyboard));
    return next();
  }
})
  .action('back', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene');
    return next();
  })
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.session.scene = ctx.session.__scenes.current;
    ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
    if (ctx.session.state.lot._id) {
      ctx.scene.enter('lots_scene_st6');
      return next();
    }
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

lotsSceneSt4.enter(async (ctx) => {
  let lots;
  const callbackButtons = [];
  try {
    lots = await getLot.getByUserId(ctx.from.id, 'sold');
  } catch {
    lots = [];
  }
  if (lots.length) {
    lots.forEach((lot) => {
      const btnText = `${lot.title} [${lot.price} ${ctx.i18n.t('lots_scene_txt1')}] `;
      const btnAction = `view_${lot._id}`;
      callbackButtons.push([Markup.callbackButton(btnText, btnAction)]);
    });
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st4_0'), Extra.markup(keyboard));
  } else {
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st4_1'), Extra.markup(keyboard));
  }
})
  .action('back', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene');
    return next;
  })
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.session.scene = ctx.session.__scenes.current;
    ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
    if (ctx.session.state.lot._id) {
      ctx.scene.enter('lots_scene_st6');
    }
    return next();
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

lotsSceneSt5.enter(async (ctx) => {
  let lots;
  const callbackButtons = [];
  try {
    lots = await getLot.getByUserId(ctx.from.id, 'banned');
  } catch {
    lots = [];
  }
  if (lots.length) {
    lots.forEach(async (lot) => {
      const btnText = `${lot.title} [${lot.price} ${ctx.i18n.t('lots_scene_txt1')}] `;
      const btnAction = `view_${lot._id}`;
      callbackButtons.push([Markup.callbackButton(btnText, btnAction)]);
    });
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st5_0'), Extra.markup(keyboard));
  } else {
    callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_st5_1'), Extra.markup(keyboard));
  }
})
  .action('back', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter('lots_scene');
    return next();
  })
  .on('callback_query', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.session.scene = ctx.session.__scenes.current;
    ctx.session.state.lot._id = ctx.update.callback_query.data.split('_')[1];
    if (ctx.session.state.lot._id) {
      ctx.scene.enter('lots_scene_st6');
      return next();
    }
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

lotsSceneSt6.enter(async (ctx) => {
  let result;
  const callbackButtons = [];
  try {
    result = await getLot.getByLotId(ctx.session.state.lot._id);
  } catch {
    result = null;
  }
  if (result) {
    switch (result.status) {
      case 'active':
        callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn2'), 'toArchive')]);
        callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn3'), 'toSold')]);
        callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
        break;
      case 'archive':
        callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn9'), 'toActive')]);
        callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
        break;
      case 'sold':
        callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
        break;
      case 'banned':
        callbackButtons.push([Markup.callbackButton(ctx.i18n.t('lots_scene_btn10'), 'back')]);
        break;
      default:
        // default
        break;
    }
    const keyboard = Markup.inlineKeyboard(callbackButtons);
    let message = '';
    message += `*${result.title}*\n`;
    message += `${result.subtitle}\n\n`;
    message += `${result.description}\n\n`;
    message += `${ctx.i18n.t('lots_scene_txt0')} ${result.price} ${ctx.i18n.t('lots_scene_txt1')}\n\n`;
    message += `${ctx.i18n.t('lots_scene_txt2')}: \`${result.status}\``;
    const options = {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: JSON.stringify(Extra.markup(keyboard).reply_markup),
    };
    await ctx.replyWithPhoto(result.photo, options)
      .catch(async (err) => {
        await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_msg0'));
        console.error(err);
      });
  } else {
    await ctx.replyWithMarkdown(ctx.i18n.t('lots_scene_msg0'));
  }
})
  .action('toArchive', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    await getLot.changeStatus(ctx.session.state.lot._id, 'archive');
    ctx.scene.reenter();
    return next();
  })
  .action('toActive', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    await getLot.changeStatus(ctx.session.state.lot._id, 'active');
    ctx.scene.reenter();
    return next();
  })
  .action('toSold', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    await getLot.changeStatus(ctx.session.state.lot._id, 'sold');
    ctx.scene.reenter();
    return next();
  })
  .action('back', async (ctx, next) => {
    await ctx.telegram.deleteMessage(ctx.chat.id, ctx.update.callback_query.message.message_id)
      .catch(() => {});
    ctx.scene.enter(ctx.session.scene);
    return next();
  })
  .on('message', async (ctx, next) => {
    await ctx.deleteMessage(ctx.message.message_id)
      .catch(() => {});
    return next();
  });

module.exports = [lotsScene, lotsSceneSt1, lotsSceneSt2, lotsSceneSt3, lotsSceneSt4, lotsSceneSt5, lotsSceneSt6];
