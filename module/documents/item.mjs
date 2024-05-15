import * as Dice from '../dice.mjs';

export class ChannelFearItem extends Item {
  prepareDerivedData() {
    this._prepareSpecialtyData();
    this._prepareWeaponData();
  }

  _prepareSpecialtyData() {
    if ('specialty' !== this.type) {
      return;
    }

    const system = this.system;

    // Ensure specialty reroll is between allowed boundaries
    if (system.reroll < 1) {
      system.reroll = 1;
    } else if (system.reroll > CONFIG.CF.specialtyMaxReroll) {
      system.reroll = CONFIG.CF.specialtyMaxReroll;
    }
  }

  _prepareWeaponData() {
    if ('weapon' !== this.type) {
      return;
    }

    const system = this.system;

    // Add force reroll
    if ('fig' === system.ability) {
      system.allMightHitReroll = system.reroll;

      if (this.actor && this.actor.system) {
        system.allMightHitReroll += (CONFIG.CF.allMightHitReroll[this.actor.system.abilities.for] || 0);
      }

      system.allMightHitReroll = Math.min(system.allMightHitReroll, CONFIG.CF.weaponMaxReroll);
    }

    // Ensure weapon reroll is between allowed boundaries
    if (system.reroll < 0) {
      system.reroll = 0;
    } else if (system.reroll > CONFIG.CF.weaponMaxReroll) {
      system.reroll = CONFIG.CF.weaponMaxReroll;
    }

    // Ensure weapons lower thant category 4 can not have more than 1 reroll
    if (4 > system.category) {
      system.reroll = Math.min(system.reroll, 1);
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
    if ('specialty' === this.type) {
      return await Dice.specialtyCheck(this);
    }

    if ('weapon' === this.type) {
      return await Dice.weaponCheck(this);
    }
  }
}
