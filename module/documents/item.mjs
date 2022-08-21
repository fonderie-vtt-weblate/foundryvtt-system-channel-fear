import * as Dice from '../dice.mjs';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ChannelFearItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  prepareDerivedData() {
    const itemData = this.data;

    this._prepareSpecialtiesData(itemData);
  }

  _prepareSpecialtiesData(itemData) {
    this._prepareSpecialtyData(itemData);
    this._prepareWeaponData(itemData);
  }

  _prepareSpecialtyData(itemData) {
    if ('specialty' !== itemData.type) return;

    const data = itemData.data;

    // Ensure specialty reroll is between allowed boundaries
    if (data.reroll < 1) {
      data.reroll = 1;
    } else if (data.reroll > 3) {
      data.reroll = 3;
    }
  }

  _prepareWeaponData(itemData) {
    if ('weapon' !== itemData.type) return;

    const data = itemData.data;

    // Ensure weapon reroll is between allowed boundaries
    if (data.reroll < 0) {
      data.reroll = 0;
    } else if (data.reroll > 3) {
      data.reroll = 3;
    }

    // Ensure weapons lower thant category 4 can not have more than 1 reroll
    if (4 > data.category) {
      data.reroll = Math.min(data.reroll, 1);
    }
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;

    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @private
   */
  async roll() {
    const item = this.data;

    if ('specialty' === item.type) {
      return this._rollSpecialty(item);
    }

    if ('weapon' === item.type) {
      return this._rollWeapon(item);
    }

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const flavor = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor,
        content: item.data.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker,
        rollMode,
        flavor,
      });
      return roll;
    }
  }

  async _rollSpecialty(specialty) {
    await Dice.specialtyCheck(specialty);
  }

  async _rollWeapon(weapon) {
    await Dice.weaponCheck(weapon);
  }
}
