export class ChannelFearActor extends Actor {
  prepareDerivedData() {
    this._prepareCharacterData();
    this._prepareNpcData();
  }

  _prepareCharacterData() {
    if ('character' !== this.type) {
      return;
    }

    const system = this.system;

    // Ensure health and resource are between allowed boundaries
    system.attributes.health = this._validateBoundaries(system.attributes.health, 0, CONFIG.CF.maxHealth);
    system.attributes.resource = this._validateBoundaries(system.attributes.resource, 0, CONFIG.CF.maxResource);

    // Ensure abilities are between allowed boundaries
    for (let ability of Object.entries(system.abilities)) {
      ability = this._validateBoundaries(ability, 0, CONFIG.CF.maxAbility);
    }
  }

  _prepareNpcData() {
    if ('npc' !== this.type) {
      return;
    }

    const system = this.system;

    // Ensure health is between allowed boundaries
    system.attributes.health = this._validateBoundaries(system.attributes.health, 0, CONFIG.CF.maxHealth);

    if (system.abilities) {
      const abilitiesPoints = CONFIG.CF.npcAbilitiesPoints[system.level];

      for (const k of Object.keys(system.abilities)) {
        system.abilities[k] = abilitiesPoints;
      }
    }
  }

  _validateBoundaries(value, min, max) {
    if (value < min) {
      return min;
    }

    if (max && value > max) {
      return max;
    }

    return value;
  }

  getRollData() {
    const data = foundry.utils.deepClone(super.getRollData());

    this._getCharacterRollData(data);

    return data;
  }

  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = v;
      }
    }

    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = v;
      }
    }
  }
}
