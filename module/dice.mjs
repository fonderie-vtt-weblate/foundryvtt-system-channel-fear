export async function abilityCheck({ ability, label, actor, currentActorResource }) {
  let { difficulty, resources } = await _getCheckOptions('CF.Rolls.AbilityCheck.Title', currentActorResource);

  await _doCheck({
    title: game.i18n.format('CF.Rolls.AbilityCheck.Card.Title', { name: label }),
    dice: ability,
    usedResources: resources,
    difficulty,
    actor,
  });
}

export async function specialtyCheck({ ability, label, actor, currentActorResource, reroll }) {
  let { difficulty, resources } = await _getCheckOptions('CF.Rolls.SpecialtyCheck.Title', currentActorResource);

  await _doCheck({
    title: game.i18n.format('CF.Rolls.SpecialtyCheck.Card.Title', { name: label }),
    dice: ability,
    usedResources: resources,
    actor,
    difficulty,
    reroll,
  });
}

export async function weaponCheck({ ability, label, actor, currentActorResource, reroll }) {
  let { difficulty, resources } = await _getCheckOptions('CF.Rolls.WeaponCheck.Title', currentActorResource);

  await _doCheck({
    title: game.i18n.format('CF.Rolls.WeaponCheck.Card.Title', { name: label }),
    dice: ability,
    usedResources: resources,
    actor,
    difficulty,
    reroll,
  });
}

export async function reroll({ difficulty, bonus, usable, available, label, actor }) {
  await _doCheck({
    dice: usable,
    reroll: available - usable,
    title: game.i18n.format('CF.Rolls.SpecialtyCheck.Card.Title', { name: label }),
    actor,
    bonus,
    difficulty,
  });
}

async function _doCheck({ actor, bonus, dice, difficulty, reroll, title, usedResources }) {
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
      usedResources,
    });

    await _handleRollResult({ actor, difficulty, usedResources });

    return;
  }

  const rollResult = await _getRollResult(dice, score);
  const isSuccess = rollResult.total >= difficulty;
  const isHardFailure = 1 < difficulty && 0 === rollResult.total;
  const canReroll = 1 < difficulty && !isHardFailure && rollResult.total < difficulty && 0 < reroll;
  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/roll-card.hbs', {
    reroll: {
      can: canReroll,
      available: reroll,
      usable: Math.min(reroll, difficulty - rollResult.total),
    },
    total: rollResult.total,
    success: isSuccess,
    failure: !isSuccess && (0 === rollResult.total || !canReroll),
    hardSuccess: 1 < difficulty && rollResult.total > difficulty,
    hardFailure: isHardFailure,
    formula: rollResult.formula,
    tooltip: await rollResult.getTooltip(),
    actorId: actor.id,
    difficulty,
    title,
  });

  await _createChatMessage(actor, rollResult, chatContent, CONST.CHAT_MESSAGE_TYPES.ROLL);
  await _handleRollResult({ actor, difficulty, rollResult, usedResources });
}

function _getRollResult(dice, bonus) {
  let formula = `${dice}d6x6cs>3`;
  if (0 < bonus) {
    formula = `${bonus} + ${formula}`;
  }

  return new Roll(formula).roll({ async: true });
}

async function _rollNoRoll({ title, actor, difficulty, usedResources }) {
  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/roll-card.hbs', {
    title,
    difficulty,
    total: difficulty,
    success: true,
    failure: false,
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

  const html = await renderTemplate('systems/channel-fear/templates/partials/roll/ability-roll-dialog.hbs', {
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

async function _handleRollResult({ actor, difficulty, rollResult, usedResources }) {
  let newResources = actor.data.data.resource;

  // Remove used resource points
  if (0 < usedResources) {
    newResources -= usedResources;
  }

  // Margin of success/failure if difficulty > 1
  if (1 < difficulty) {
    if (rollResult.total > difficulty) {
      // Success -> +1 resource point
      ++newResources;
    } else if (0 === rollResult.total) {
      // Failure -> -1 resource point
      --newResources;
    }
  }

  // Update if needed
  if (newResources !== actor.data.data.resource) {
    await actor.update({ 'data.attributes.resource': Math.min(newResources, CONFIG.CF.maxResource) });
  }
}
