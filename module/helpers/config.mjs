export const CF = {};

CF.abilities = {
  'act': 'CF.AbilityAct',
  'kno': 'CF.AbilityKno',
  'bea': 'CF.AbilityBea',
  'for': 'CF.AbilityFor',
  'per': 'CF.AbilityPer',
  'imp': 'CF.AbilityImp',
  'knh': 'CF.AbilityKnh',
  'fig': 'CF.AbilityFig',
  'sel': 'CF.AbilitySel',
  'aim': 'CF.AbilityAim',
};

export function getTranslatedAbilities(i18n) {
  const abilities = {};

  for (const [key, value] of Object.entries(CF.abilities)) {
    abilities[key] = i18n.localize(value);
  }

  return abilities;
}
