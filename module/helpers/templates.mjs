export const preloadHandlebarsTemplates = function () {
  loadTemplates([
    // Actor partials
    'systems/channel-fear/templates/actor/parts/actor-abilities.hbs',
    'systems/channel-fear/templates/actor/parts/actor-bio.hbs',
    'systems/channel-fear/templates/actor/parts/actor-evolution.hbs',
    'systems/channel-fear/templates/actor/parts/actor-informations.hbs',
    'systems/channel-fear/templates/actor/parts/actor-informations-right-part.hbs',
    'systems/channel-fear/templates/actor/parts/actor-notes.hbs',
    'systems/channel-fear/templates/actor/parts/actor-resources.hbs',
    'systems/channel-fear/templates/actor/parts/actor-specialties.hbs',
    'systems/channel-fear/templates/actor/parts/actor-weapons.hbs',
    // Rolls partials
    'systems/channel-fear/templates/partials/roll/roll-card.hbs',
    'systems/channel-fear/templates/partials/roll/roll-dialog.hbs',
    // Item partials
    'systems/channel-fear/templates/item/parts/simple-header.hbs',
  ]);
};
