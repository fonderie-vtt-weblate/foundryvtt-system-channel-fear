import * as Dice from '../dice.mjs';

export class ChannelFearItem extends Item {
  prepareData() {
    super.prepareData();
  }

  prepareDerivedData() {
    const itemData = this.data;

    this._prepareSpecialtyData(itemData);
    this._prepareWeaponData(itemData);
  }

  _prepareSpecialtyData(itemData) {
    if ('specialty' !== itemData.type) {
      return;
    }

    const data = itemData.data;

    // Ensure specialty reroll is between allowed boundaries
    if (data.reroll < 1) {
      data.reroll = 1;
    } else if (data.reroll > 3) {
      data.reroll = 3;
    }
  }

  _prepareWeaponData(itemData) {
    if ('weapon' !== itemData.type) {
      return;
    }

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

  getRollData() {
    if (!this.actor) {
      return null;
    }

    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  async roll() {
    const item = this.data;

    if ('specialty' === item.type) {
      return await Dice.specialtyCheck(item);
    }

    if ('weapon' === item.type) {
      return await Dice.weaponCheck(item);
    }
  }
}
