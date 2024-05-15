export function registerHandlebarsHelper() {
  Handlebars.registerHelper('cf_image', fileName => `systems/channel-fear/images/${fileName}`);

  Handlebars.registerHelper('markSpecialtyActive', (askedLevel, currentLevel) => currentLevel >= askedLevel);

  Handlebars.registerHelper('displayProfileImage', () => !game.settings.get('channel-fear', 'hideProfileImage'));
}
