// Import document classes.
import { ChannelFearActor } from './documents/actor.mjs';
import { ChannelFearItem } from './documents/item.mjs';
// Import sheet classes.
import { ChannelFearActorSheet } from './sheets/actor-sheet.mjs';
import { ChannelFearItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { CF } from './helpers/config.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.channelfear = {
    ChannelFearActor,
    ChannelFearItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.CF = CF;

  // Define custom Document classes
  CONFIG.Actor.documentClass = ChannelFearActor;
  CONFIG.Item.documentClass = ChannelFearItem;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('channelfear', ChannelFearActorSheet, { makeDefault: true });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('channelfear', ChannelFearItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */
Handlebars.registerHelper('concat', (...values) => {
  values.pop(); // Last element is specific to Handlebars

  return new Handlebars.SafeString(values.map(v => 'function' === typeof v.toString ? v : '').join(''));
});

Handlebars.registerHelper('image', fileName => `systems/channel-fear/images/${fileName}`);

Handlebars.registerHelper('markSpecialtyActive', (askedLevel, currentLevel) => currentLevel >= askedLevel);

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  if (data.type !== 'Item') return;
  if (!('data' in data)) return ui.notifications.warn('You can only create macro buttons for owned Items');
  const item = data.data;

  // Create the macro command
  const command = `game.channelfear.rollItemMacro("${item.name}");`;
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
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}
