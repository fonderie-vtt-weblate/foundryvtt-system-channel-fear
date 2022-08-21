export const CF = {};

CF.maxHealth = 6;
CF.maxResource = 6;
CF.maxAbility = 6;
CF.specialtyMaxReroll = 3;
CF.weaponMaxReroll = 3;

CF.allMightHitReroll = {
  4: 1,
  5: 2,
  6: 3,
};

CF.abilities = {
  'act': 'CF.Abilities.Act',
  'kno': 'CF.Abilities.Kno',
  'bea': 'CF.Abilities.Bea',
  'for': 'CF.Abilities.For',
  'per': 'CF.Abilities.Per',
  'imp': 'CF.Abilities.Imp',
  'knh': 'CF.Abilities.Knh',
  'fig': 'CF.Abilities.Fig',
  'sel': 'CF.Abilities.Sel',
  'aim': 'CF.Abilities.Aim',
};

CF.weaponsAbilities = {
  'fig': 'CF.Abilities.Fig',
  'aim': 'CF.Abilities.Aim',
};

CF.weaponsCategories = {
  1: 'CF.Weapons.Categories.BareHands',
  2: 'CF.Weapons.Categories.VeryLight',
  3: 'CF.Weapons.Categories.Light',
  4: 'CF.Weapons.Categories.Medium',
  5: 'CF.Weapons.Categories.Heavy',
};

CF.npcLevels = {
  'weak': 'CF.NpcSheet.Level.Values.weak',
  'medium': 'CF.NpcSheet.Level.Values.medium',
  'strong': 'CF.NpcSheet.Level.Values.strong',
  'unbeatable': 'CF.NpcSheet.Level.Values.unbeatable',
};

CF.npcAbilitiesPoints = {
  'weak': 2,
  'medium': 3,
  'strong': 4,
  'unbeatable': 99,
};
