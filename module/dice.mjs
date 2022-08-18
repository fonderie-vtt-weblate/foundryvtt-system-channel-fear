export async function abilityCheck({ ability, label, actor, currentActorResource }) {
  let { difficulty, resources } = await _getAbilityCheckOptions(currentActorResource);

  // Ensure to not use more resources than necessary
  resources = Math.min(difficulty, resources);

  // Used resources = difficulty level -> no roll
  if (resources === difficulty) {
    ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      sound: CONFIG.sounds.dice,
      content: await renderTemplate('systems/channel-fear/templates/partials/roll/ability-roll-success.hbs', {
        ability: label,
        difficulty,
      }),
    });

    return { resources };
  }

  let formula = `${ability}d6x6cs>3`;
  if (0 < resources) {
    formula = `${resources} + ${formula}`;
  }

  const roll = new Roll(formula, actor.getRollData());
  const rollResult = await roll.roll({ async: true });

  console.log(rollResult.total, difficulty, rollResult.total === difficulty, rollResult.total > difficulty);

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: label,
  });

  return { resources };
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
