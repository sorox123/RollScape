// Character types matching backend models

export type CharacterType = 'player' | 'npc' | 'ai_player'

export interface AbilityScores {
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

export interface Skill {
  name: string
  ability: keyof AbilityScores
  proficient: boolean
  expertise?: boolean
}

export interface SavingThrow {
  ability: keyof AbilityScores
  proficient: boolean
}

export interface Equipment {
  id: string
  name: string
  type: string
  quantity: number
  weight: number
  equipped?: boolean
  description?: string
  properties?: string[]
  damage?: string
  ac?: number
}

export interface Spell {
  id: string
  name: string
  level: number
  school: string
  castingTime: string
  range: string
  components: string[]
  duration: string
  description: string
  prepared?: boolean
  ritual?: boolean
  concentration?: boolean
}

export interface SpellSlots {
  [level: number]: {
    max: number
    current: number
  }
}

export interface Feature {
  name: string
  source: string  // Race, Class, Background, etc.
  description: string
}

export interface Character {
  id: string
  name: string
  user_id?: string
  campaign_id: string
  character_type: CharacterType
  is_active: boolean
  
  // Basic info
  race: string
  character_class: string
  subclass?: string
  level: number
  multiclass?: Array<{ class: string; level: number }>
  background: string
  alignment: string
  
  // Appearance
  age?: number
  height?: string
  weight?: string
  eyes?: string
  skin?: string
  hair?: string
  
  // Stats
  ability_scores: AbilityScores
  ability_score_improvements?: Record<string, any>
  proficiency_bonus: number
  skills: { [key: string]: Skill }
  saving_throws: { [key: string]: SavingThrow }
  passive_perception: number
  passive_investigation: number
  passive_insight: number
  
  // Combat
  max_hp: number
  current_hp: number
  temp_hp: number
  armor_class: number
  initiative_bonus: number
  speed: number
  
  // Hit dice (legacy and new)
  hit_dice?: {
    total: number
    current: number
    type: string  // e.g., "d8"
  }
  hit_dice_total?: number
  hit_dice_remaining?: number
  hit_die_type?: string
  
  // Death saves (legacy and new)
  death_saves?: {
    successes: number
    failures: number
  }
  death_save_successes?: number
  death_save_failures?: number
  
  // Features & abilities
  proficiencies: string[]
  languages: string[]
  features: Feature[]
  equipment: Equipment[]
  
  // Detailed equipment tracking
  weapons?: Array<{
    name: string
    damage: string
    damage_type: string
    properties?: string[]
    equipped?: boolean
  }>
  armor?: {
    name: string
    ac: number
    type: string
    equipped?: boolean
  }
  inventory?: Array<{
    name: string
    quantity: number
    weight?: number
    description?: string
  }>
  attunement_slots_used?: number
  
  // Currency
  currency?: {
    cp: number
    sp: number
    ep: number
    gp: number
    pp: number
  }
  
  // Spellcasting
  spells: Spell[]
  spell_slots?: SpellSlots
  spell_slots_used?: Record<number, number>
  spellcasting_ability?: 'INT' | 'WIS' | 'CHA'
  spell_save_dc?: number
  spell_attack_bonus?: number
  
  // Class resources (Ki, Rage, Sorcery Points, etc.)
  class_resources?: Record<string, {
    max: number
    current: number
    name: string
  }>
  
  // Status effects
  inspiration?: boolean
  exhaustion_level?: number
  conditions?: string[]
  
  // Description
  description?: string
  backstory?: string
  personality_traits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  
  // Visuals
  avatar_url?: string
  token_url?: string
  
  // AI-specific
  ai_personality?: string
  ai_behavior_prompt?: string
  
  // Progress
  experience_points: number
  
  // Notes
  dm_notes?: string
  player_notes?: string
  
  // Timestamps
  created_at: string
  updated_at?: string
}

export interface CharacterCreateData {
  name: string
  campaign_id: string
  character_type?: CharacterType
  race: string
  character_class: string
  level?: number
  background: string
  alignment: string
  ability_scores: AbilityScores
  max_hp?: number
  armor_class?: number
  speed?: number
  description?: string
  backstory?: string
  personality_traits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  dm_notes?: string
  avatar_url?: string
}

export interface CharacterUpdateData {
  name?: string
  level?: number
  current_hp?: number
  temp_hp?: number
  max_hp?: number
  armor_class?: number
  ability_scores?: AbilityScores
  skills?: { [key: string]: Skill }
  equipment?: Equipment[]
  spells?: Spell[]
  spell_slots?: SpellSlots
  experience_points?: number
  description?: string
  backstory?: string
  personality_traits?: string
  ideals?: string
  bonds?: string
  flaws?: string
  player_notes?: string
  avatar_url?: string
}

// Helper functions
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
}

export function getSkillModifier(
  character: Character,
  skillName: string
): number {
  const skill = character.skills[skillName]
  if (!skill) return 0
  
  const abilityScore = character.ability_scores[skill.ability]
  const abilityMod = calculateModifier(abilityScore)
  const profBonus = calculateProficiencyBonus(character.level)
  
  let modifier = abilityMod
  if (skill.proficient) {
    modifier += profBonus
  }
  if (skill.expertise) {
    modifier += profBonus // Double proficiency for expertise
  }
  
  return modifier
}

export function getSavingThrowModifier(
  character: Character,
  ability: keyof AbilityScores
): number {
  const abilityScore = character.ability_scores[ability]
  const abilityMod = calculateModifier(abilityScore)
  const profBonus = calculateProficiencyBonus(character.level)
  
  const savingThrow = character.saving_throws[ability]
  const isProficient = savingThrow?.proficient || false
  
  return abilityMod + (isProficient ? profBonus : 0)
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

// D&D 5e standard skills
export const STANDARD_SKILLS: { name: string; ability: keyof AbilityScores }[] = [
  { name: 'Acrobatics', ability: 'dex' },
  { name: 'Animal Handling', ability: 'wis' },
  { name: 'Arcana', ability: 'int' },
  { name: 'Athletics', ability: 'str' },
  { name: 'Deception', ability: 'cha' },
  { name: 'History', ability: 'int' },
  { name: 'Insight', ability: 'wis' },
  { name: 'Intimidation', ability: 'cha' },
  { name: 'Investigation', ability: 'int' },
  { name: 'Medicine', ability: 'wis' },
  { name: 'Nature', ability: 'int' },
  { name: 'Perception', ability: 'wis' },
  { name: 'Performance', ability: 'cha' },
  { name: 'Persuasion', ability: 'cha' },
  { name: 'Religion', ability: 'int' },
  { name: 'Sleight of Hand', ability: 'dex' },
  { name: 'Stealth', ability: 'dex' },
  { name: 'Survival', ability: 'wis' },
]

export const ABILITY_NAMES: { [key in keyof AbilityScores]: string } = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}
