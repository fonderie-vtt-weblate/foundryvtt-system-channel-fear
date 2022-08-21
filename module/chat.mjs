import * as Dice from './dice.mjs';

export function addChatListeners(html) {
  html.find('.reroll').on('click', _onReroll);
}

export function hideRerollButtons(html) {
  const rerollContainer = html[0].querySelector('.channelfear.dice-reroll');
  if (!rerollContainer) {
    return;
  }

  const actor = game.actors.get(rerollContainer.dataset.actorId);
  if (actor && !actor.isOwner) {
    rerollContainer.style.display = 'none';
  }
}

async function _onReroll(e) {
  e.preventDefault();

  const {
    difficulty,
    bonus,
    rerollUsable: usable,
    rerollAvailable: available,
    label,
    actorId,
  } = e.currentTarget.dataset;
  const actor = await game.actors.get(actorId);

  await Dice.reroll({ difficulty, bonus, usable, available, label, actor });
}
