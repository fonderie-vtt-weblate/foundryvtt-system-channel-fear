import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';

export class ChannelFearActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['channelfear', 'sheet', 'actor'],
      template: 'systems/channel-fear/templates/actor/actor-sheet.hbs',
      width: 870,
      height: 936,
    });
  }

  /** @override */
  get template() {
    return `systems/channel-fear/templates/actor/actor-${this.actor.data.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  contextMenuItems = [{
    name: game.i18n.localize('CF.Global.Edit'),
    icon: '<i class="fas fa-edit"></i>',
    callback: element => {
      const item = this.actor.items.get(element[0].dataset.itemId);

      item.sheet.render(true);
    },
  }, {
    name: game.i18n.localize('CF.Global.Delete'),
    icon: '<i class="fas fa-trash"></i>',
    callback: element => {
      this.actor.deleteEmbeddedDocuments('Item', [element[0].dataset.itemId]);
    },
  }];

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.data.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if ('character' === actorData.type) {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if ('npc' === actorData.type) {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  _prepareCharacterData(context) {
    context.abilitiesList = CONFIG.CF.abilities;
  }

  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const specialties = [];
    const weapons = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if ('item' === i.type) {
        gear.push(i);
      } else if ('specialty' === i.type) {
        specialties.push(i);
      } else if ('weapon' === i.type) {
        weapons.push(i);
      }
    }

    context.gear = gear;
    context.specialties = specialties;
    context.weapons = weapons;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    new ContextMenu(html, '.item', this.contextMenuItems);

    html.find('.item-create').click(this._onItemCreate.bind(this));

    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.actor));

    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;
    const itemData = {
      name: name,
      type: type,
      data: data,
    };
    delete itemData.data['type'];

    await Item.create(itemData, { parent: this.actor });
  }

  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType === 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.actionValue) {
      new Dialog({
        title: '__Difficulté',
        content: `
<p>__Choisissez la difficulté du jet</p>
<p>
  <select id="roll-difficulty">
    <option value="1">Relativement facile - 1 réussite</option>
    <option value="2">Moyenne - 2 réussites</option>
    <option value="3">Difficile - 3 réussites</option>
    <option value="4">Très difficile - 4 réussites</option>
  </select>
</p>
`,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice"></i>',
            label: '__Lancer les dés',
            callback: async html => {
              const difficulty = parseInt(html.find('#roll-difficulty').val(), 10);
              const roll = new Roll(`${dataset.actionValue}d6x6cs>3`, this.actor.getRollData());
              const rollResult = await roll.roll();

              console.log(rollResult.total, difficulty, rollResult.total === difficulty, rollResult.total > difficulty);

              await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: dataset.label ?? '',
                rollMode: game.settings.get('core', 'rollMode'),
              });
            },
          },
          close: {
            icon: '<i class="fas fa-times"></i>',
            label: '__Annuler',
          },
        },
        default: 'close',
      }).render(true);
    }
  }
}
