export async function abilityCheck({ ability, label, actor, currentActorResource }) {
  let { difficulty, resources } = await _getAbilityCheckOptions('CF.Rolls.AbilityCheck.Title', currentActorResource);

  // Ensure to not use more resources than necessary
  resources = Math.min(difficulty, resources);

  // Used resources = difficulty level -> no roll
  if (resources === difficulty) {
    await _rollNoRoll(actor, difficulty, label);

    return { difficulty, resources };
  }

  const rollResult = await _getRollResult(ability, resources);
  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/ability-roll-card.hbs', {
    title: game.i18n.format('CF.Rolls.AbilityCheck.Card.Title', { name: label }),
    difficulty,
    total: rollResult.total,
    success: rollResult.total >= difficulty,
    failure: rollResult.total < difficulty,
    formula: rollResult.formula,
    tooltip: await rollResult.getTooltip(),
  });

  await _createChatMessage(actor, rollResult, chatContent, CONST.CHAT_MESSAGE_TYPES.ROLL);

  return { difficulty, resources, rollResult };
}

export async function specialtyCheck({ ability, label, actor, currentActorResource, reroll }) {
  let { difficulty, resources } = await _getAbilityCheckOptions('CF.Rolls.SpecialtyCheck.Title', currentActorResource);

  // Ensure to not use more resources than necessary
  resources = Math.min(difficulty, resources);

  // Used resources = difficulty level -> no roll
  if (resources === difficulty) {
    await _rollNoRoll(actor, difficulty, label);

    return { difficulty, resources };
  }

  const { rollResult } = await _doSpecialtyCheck({
    difficulty,
    dice: ability,
    bonus: resources,
    label,
    actor,
    reroll,
  });

  return { difficulty, resources, rollResult };
}

export async function reroll({ difficulty, bonus, usable, available, label, actor }) {
  await _doSpecialtyCheck({
    difficulty,
    dice: usable,
    bonus,
    label,
    actor,
    reroll: available - usable,
  });
}

async function _doSpecialtyCheck({ difficulty, dice, bonus, label, actor, reroll }) {
  const rollResult = await _getRollResult(dice, bonus);
  const canReroll = rollResult.total < difficulty && reroll >= (difficulty - rollResult.total);
  const isSuccess = rollResult.total >= difficulty;
  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/specialty-roll-card.hbs', {
    title: game.i18n.format('CF.Rolls.SpecialtyCheck.Card.Title', { name: label }),
    difficulty,
    reroll: {
      can: canReroll,
      available: reroll,
      usable: Math.min(reroll, difficulty - rollResult.total),
    },
    total: rollResult.total,
    success: isSuccess,
    failure: !isSuccess && (0 === rollResult.total || !canReroll),
    formula: rollResult.formula,
    tooltip: await rollResult.getTooltip(),
    actorId: actor.id,
  });

  await _createChatMessage(actor, rollResult, chatContent, CONST.CHAT_MESSAGE_TYPES.ROLL);

  return { difficulty, bonus, rollResult };
}

function _getRollResult(dice, bonus) {
  let formula = `${dice}d6x6cs>3`;
  if (0 < bonus) {
    formula = `${bonus} + ${formula}`;
  }

  return new Roll(formula).roll({ async: true });
}

async function _rollNoRoll(actor, difficulty, label) {
  const chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/ability-roll-card.hbs', {
    ability: label,
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

async function _getAbilityCheckOptions(title, currentActorResource) {
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
