export function registerSettings() {
  game.settings.register('channel-fear', 'hideProfileImage', {
    name: 'CF.Settings.HideProfileImage.Title',
    hint: 'CF.Settings.HideProfileImage.Hint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
  });
}
