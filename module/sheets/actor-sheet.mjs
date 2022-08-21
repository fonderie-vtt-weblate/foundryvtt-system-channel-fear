import * as Dice from '../dice.mjs';

export class ChannelFearActorSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['channelfear', 'sheet', 'actor'],
      template: 'systems/channel-fear/templates/actor/actor-sheet.hbs',
      width: 870,
      height: 936,
    });
  }

  get template() {
    return `systems/channel-fear/templates/actor/actor-${this.actor.data.type}-sheet.hbs`;
  }

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

  getData(options) {
    const context = super.getData(options);
    const actorData = this.actor.data.toObject(false);

    context.data = actorData.data;
    context.flags = actorData.flags;
    context.isNpc = false;
    context.abilitiesList = CONFIG.CF.abilities;
    context.rollData = context.actor.getRollData();

    this._prepareItems(context);

    if ('npc' === actorData.type) {
      context.isNpc = true;
      context.levelsList = CONFIG.CF.npcLevels;
    }

    return context;
  }

  _prepareItems(context) {
    const gear = [];
    const specialties = [];
    const weapons = [];

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

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    new ContextMenu(html, '.item', this.contextMenuItems);

    html.find('.item-create').on('click', this._onItemCreate.bind(this));

    html.find('.item-edit').on('click', ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('item'));
      item.sheet.render(true);
    });

    html.find('.item-delete').on('click', ev => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('item'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    if (this.actor.isOwner) {
      html.find('.rollable').on('click', this._onRoll.bind(this));

      const handler = ev => this._onDragStart(ev);

      html.find('li.item').each((i, li) => {
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

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.ability) {
      await Dice.abilityCheck({
        ability: dataset.ability,
        label: dataset.label,
        actor: this.actor,
      });
    }

    if (dataset.itemId) {
      const item = this.actor.items.get(dataset.itemId);

      if (item) {
        await item.roll();
      }
    }
  }
}
