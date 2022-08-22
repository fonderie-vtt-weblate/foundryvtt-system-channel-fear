export async function abilityCheck({ ability, label, actor }) {
  const { difficulty, resources } = await _getCheckOptions('CF.Rolls.AbilityCheck.Title', actor.data.data.resource);

  await _doCheck({
    dice: ability,
    title: game.i18n.format('CF.Rolls.AbilityCheck.Card.Title', { name: label }),
    usedResources: resources,
    actor,
    difficulty,
  });
}

export async function specialtyCheck(specialty) {
  const actor = specialty.document.actor;
  const { difficulty, resources } = await _getCheckOptions('CF.Rolls.SpecialtyCheck.Title', actor.data.data.resource);

  await _doCheck({
    dice: actor.data.data.abilities[specialty.data.ability],
    reroll: {
      available: specialty.data.reroll,
      label: specialty.name,
      type: 'specialty',
    },
    title: game.i18n.format('CF.Rolls.SpecialtyCheck.Card.Title', { name: specialty.name }),
    usedResources: resources,
    actor,
    difficulty,
  });
}

export async function weaponCheck(weapon) {
  const actor = weapon.document.actor;
  const { difficulty, resources } = await _getCheckOptions('CF.Rolls.WeaponCheck.Title', actor.data.data.resource);

  await _doCheck({
    dice: actor.data.data.abilities[weapon.data.ability],
    title: game.i18n.format('CF.Rolls.WeaponCheck.Card.Title', { name: weapon.name }),
    usedResources: resources,
    actor,
    difficulty,
    weapon,
  });
}

export async function reroll({ actor, available, bonus, difficulty, label, type, usable }) {
  const i18nKey = 'specialty' === type ? 'CF.Rolls.SpecialtyCheck.Card.Title' : 'CF.Rolls.Damages.Card.Title';

  await _doCheck({
    dice: usable,
    reroll: {
      available: available - usable,
      type: type,
      label,
    },
    title: game.i18n.format(i18nKey, { name: label }),
    actor,
    bonus,
    difficulty,
  });
}

export async function useWeapon({ actor, dice, label, reroll }) {
  const rollResult = await _getRollResult(dice);
  const usable = Math.min(reroll, _getNbFailure(rollResult));
  const canReroll = 0 < reroll && 0 < usable;
  const templateData = {
    actorId: actor.id,
    formula: rollResult.formula,
    reroll: {
      available: reroll,
      can: canReroll,
      type: 'weapon',
      label,
      usable,
    },
    title: game.i18n.format('CF.Rolls.Damages.Card.Title', { name: label }),
    tooltip: await rollResult.getTooltip(),
    total: rollResult.total,
  };

  if (!canReroll) {
    templateData.success = 0 < rollResult.total;
    templateData.failure = !templateData.success;
  }

  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/roll-card.hbs', templateData);

  await _createChatMessage(actor, rollResult, chatContent, CONST.CHAT_MESSAGE_TYPES.ROLL);
}

async function _doCheck({ actor, bonus, dice, difficulty, reroll, title, usedResources, weapon }) {
  if (usedResources) {
    // Ensure to not use more resources than necessary
    usedResources = Math.min(difficulty, usedResources);
  }

  const score = (usedResources || 0) + (bonus || 0);

  // Current score = difficulty level -> no roll
  if (score === difficulty) {
    await _rollNoRoll({
      actor,
      difficulty,
      title,
      weapon,
    });

    await _handleRollResult({ canReroll: false, actor, difficulty, usedResources });

    return;
  }

  const rollResult = await _getRollResult(dice, score);
  const usableRoll = reroll ? Math.min(reroll.available, _getNbFailure(rollResult)) : 0;
  let success = false;
  let failure = false;
  let hardSuccess = false;
  let hardFailure = false;
  let rerollData = { can: false };

  if (difficulty) {
    success = difficulty <= rollResult.total;
    hardSuccess = 1 < difficulty && difficulty < rollResult.total;
  }

  // Reroll available
  if (!success && 0 < usableRoll) {
    rerollData = {
      available: reroll.available,
      can: true,
      label: reroll.label,
      type: reroll.type,
      usable: usableRoll,
    };
  } else {
    failure = difficulty > rollResult.total;
    hardFailure = 1 < difficulty && 0 === rollResult.total;
  }

  if (reroll && !rerollData.can && 'weapon' === reroll.type) {
    success = 0 < rollResult.total;
    failure = !success;
  }

  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/roll-card.hbs', {
    actorId: actor.id,
    formula: rollResult.formula,
    reroll: rerollData,
    tooltip: await rollResult.getTooltip(),
    total: rollResult.total,
    difficulty,
    failure,
    hardFailure,
    hardSuccess,
    success,
    title,
    weapon,
  });

  await _createChatMessage(actor, rollResult, chatContent, CONST.CHAT_MESSAGE_TYPES.ROLL);
  await _handleRollResult({ actor, canReroll: rerollData.can, difficulty, rollResult, usedResources });
}

function _getRollResult(dice, bonus) {
  let formula = `${dice}d6x6cs>3`;
  if (0 < bonus) {
    formula = `${bonus} + ${formula}`;
  }

  return new Roll(formula).roll({ async: true });
}

async function _rollNoRoll({ title, actor, difficulty, weapon }) {
  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/roll-card.hbs', {
    actorId: actor.id,
    failure: false,
    success: true,
    total: difficulty,
    difficulty,
    title,
    weapon,
  });

  _createChatMessage(actor, null, chatContent, CONST.CHAT_MESSAGE_TYPES.OTHER);
}

function _createChatMessage(actor, rollResult, content, type) {
  return ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    roll: rollResult,
    content: content,
    sound: CONFIG.sounds.dice,
    type: type,
  });
}

async function _getCheckOptions(title, currentActorResource) {
  let resourceChoices;
  if (0 < currentActorResource) {
    resourceChoices = [...Array(currentActorResource + 1).keys()];
    resourceChoices = Object.assign({}, ...resourceChoices.map((e, i) => ({ [e]: resourceChoices[i] })));
  }

  const html = await renderTemplate('systems/channel-fear/templates/partials/roll/roll-dialog.hbs', {
    resourceChoices,
  });

  return new Promise(resolve => {
    new Dialog({
      title: game.i18n.localize(title),
      content: html,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice"></i>',
          label: game.i18n.localize('CF.Global.RollDice'),
          callback: html => resolve(_processAbilityCheckOptions(html[0].querySelector('form'))),
        },
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('CF.Global.Cancel'),
        },
      },
      default: 'close',
    }).render(true);
  });
}

function _processAbilityCheckOptions(form) {
  return {
    difficulty: parseInt(form.difficulty.value, 10),
    resources: parseInt(form.resources ? form.resources.value : '', 10),
  };
}

async function _handleRollResult({ actor, canReroll, difficulty, rollResult, usedResources }) {
  let newResources = actor.data.data.resource;

  // Remove used resource points
  if (0 < usedResources) {
    newResources -= usedResources;
  }

  // Margin of success/failure if difficulty > 1
  if (!canReroll && rollResult && 1 < difficulty) {
    if (rollResult.total > difficulty) {
      // Hard success -> +1 resource point
      ++newResources;
    } else if (0 === rollResult.total) {
      // Hard failure -> -1 resource point
      --newResources;
    }
  }

  // Update if needed
  if (newResources !== actor.data.data.resource) {
    await actor.update({ 'data.attributes.resource': Math.min(newResources, CONFIG.CF.maxResource) });
  }
}

function _getNbFailure(rollResult) {
  return rollResult.dice[0].results.reduce(
    (prev, result) => prev + (result.success ? 0 : 1),
    0,
  );
}
