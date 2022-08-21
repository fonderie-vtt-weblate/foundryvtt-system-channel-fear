export class ChannelFearActor extends Actor {
  prepareDerivedData() {
    const actorData = this.data;

    this._prepareCharacterData(actorData);
  }

  _prepareCharacterData(actorData) {
    if ('character' !== actorData.type) {
      return;
    }

    const data = actorData.data;

    // Ensure health and resource are between allowed boundaries
    data.attributes.health = this._validateBoundaries(data.attributes.health, 0, CONFIG.CF.maxHealth);
    data.attributes.resource = this._validateBoundaries(data.attributes.resource, 0, CONFIG.CF.maxResource);

    // Ensure abilities are between allowed boundaries
    for (let ability of Object.entries(data.abilities)) {
      ability = this._validateBoundaries(ability, 0, CONFIG.CF.maxAbility);
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
    const data = super.getRollData();

    this._getCharacterRollData(data);

    return data;
  }

  _getCharacterRollData(data) {
    if (this.data.type !== 'character') return;

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
