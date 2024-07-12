import '../scss/channel-fear.scss';

import { ChannelFearActor } from './documents/actor.mjs';
import { ChannelFearItem } from './documents/item.mjs';
import { ChannelFearActorSheet } from './sheets/actor-sheet.mjs';
import { ChannelFearItemSheet } from './sheets/item-sheet.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { registerSettings } from './helpers/settings.mjs';
import { CF } from './helpers/config.mjs';
import * as Chat from './chat.mjs';
import { registerHandlebarsHelper } from './helpers/handlerbars-helpers.mjs';

Hooks.on('init', function () {
  console.log('Channel Fear | Initializing System');

  game.channelfear = {
    ChannelFearActor,
    ChannelFearItem,
    rollItemMacro,
  };

  CONFIG.CF = CF;

  CONFIG.Actor.documentClass = ChannelFearActor;
  CONFIG.Item.documentClass = ChannelFearItem;

  CONFIG.fontDefinitions['MuseoSlab'] = {
    editor: true,
    fonts: [{
      urls: ['systems/channel-fear/fonts/museoslab-300.otf'],
    }],
  };
  CONFIG.fontDefinitions['ChalkDuster'] = {
    editor: true,
    fonts: [{
      urls: ['systems/channel-fear/fonts/chalkduster.ttf'],
    }],
  };
  CONFIG.canvasTextStyle.fontFamily = 'MuseoSlab';
  CONFIG.defaultFontFamily = 'MuseoSlab';

  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('channelfear', ChannelFearActorSheet, { makeDefault: true });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('channelfear', ChannelFearItemSheet, { makeDefault: true });

  registerHandlebarsHelper();
  registerSettings();
  preloadHandlebarsTemplates();
});

Hooks.once('ready', async function () {
  if ('fr' !== game.i18n.lang && game?.babele) {
    game.babele.setSystemTranslationsDir('lang/packs/translations');
  }

  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.on('renderChatMessage', (app, html, data) => {
  Chat.addChatListeners(html);
  Chat.hideActionsButtons(html);
});

function createItemMacro(data, slot) {
  if (data.type !== 'Item') {
    return;
  }

  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(game.i18n.localize('CF.Warnings.MacroOnlyForOwnedItem'));
  }

  (async function () {
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.channelfear.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
      macro = await Macro.create({
        name: item.name,
        type: 'script',
        img: item.img,
        command: command,
        flags: { 'channelfear.itemMacro': true },
      });
    }

    await game.user.assignHotbarMacro(macro, slot);
  })();

  return false;
}

function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const name = item?.name ?? itemUuid;
      return ui.notifications.warn(game.i18n.format('CF.Warnings.MacroItemNotFound', { name }));
    }

    // Trigger the item roll
    item.roll();
  });
}
