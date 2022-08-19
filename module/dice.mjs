export async function abilityCheck({ ability, label, actor, currentActorResource }) {
  let { difficulty, resources } = await _getAbilityCheckOptions(currentActorResource);

  // Ensure to not use more resources than necessary
  resources = Math.min(difficulty, resources);

  let chatContent, rollResult, messageType;

  // Used resources = difficulty level -> no roll
  if (resources === difficulty) {
    messageType = CONST.CHAT_MESSAGE_TYPES.OTHER;
    chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/ability-roll-card.hbs', {
      ability: label,
      difficulty,
      total: difficulty,
    });
  } else {
    let formula = `${ability}d6x6cs>3`;
    if (0 < resources) {
      formula = `${resources} + ${formula}`;
    }

    const roll = new Roll(formula, actor.getRollData());
    rollResult = await roll.roll({ async: true });

    messageType = CONST.CHAT_MESSAGE_TYPES.ROLL;
    chatContent = await renderTemplate('systems/channel-fear/templates/partials/roll/ability-roll-card.hbs', {
      ability: label,
      difficulty,
      total: rollResult.total,
      formula: rollResult.formula,
      tooltip: await rollResult.getTooltip(),
    });
  }

  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    roll: rollResult,
    content: chatContent,
    sound: CONFIG.sounds.dice,
    type: messageType,
  });

  return { difficulty, resources, rollResult };
}

async function _getAbilityCheckOptions(currentActorResource) {
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
      title: game.i18n.localize('CF.Rolls.AbilityCheck.Title'),
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
