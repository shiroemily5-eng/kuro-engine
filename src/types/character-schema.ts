/**
 * Character Database Schema
 * For generated/uploaded characters
 */

export interface CharacterBasicInfo {
  name: string;
  species: string;
  height: string;
  weight: string;
  age: string;
  gender: string;
  orientation: string;
}

export interface CharacterPhysicalAppearance {
  build: string;
  hair: string;
  eyes: string;
  face: string;
  skin: string;
  chest: string;
  waist: string;
  hips: string;
  buttocks: string;
  arms: string;
  legs: string;
  hands: string;
  feet: string;
  genitalia: string;
  distinguishingFeatures: string;
}

export interface CharacterClothing {
  style: string;
}

export interface CharacterSkillsAbilities {
  specialSkillsAbilities: string;
  strengths: string;
  weaknesses: string;
}

export interface CharacterSpeech {
  voice: string;
  speechStyle: string;
  vocabulary: string;
  catchphrases: string;
  bodyLanguage: string;
}

export interface CharacterPersonalityTraits {
  positiveTraits: string;
  negativeTraits: string;
  neutralTraits: string;
  habitsQuirks: string;
  fears: string;
  morals: string;
  likes: string;
  dislikes: string;
  interestsHobbies: string;
}

export interface CharacterSexuality {
  overview: string;
  sexualExperience: string;
  romanticExperience: string;
  maritalStatus: string;
  attitudeTowardsChildren: string;
  preferences: string;
  endurance: string;
  contraception: string;
  fetishes: string;
  antiFetishes: string;
  boundaries: string;
}

export interface CharacterBackstory {
  backstory: string;
}

/**
 * Full character sheet for the database
 */
export interface CharacterSheet {
  id: string;
  basicInfo: CharacterBasicInfo;
  physicalAppearance: CharacterPhysicalAppearance;
  clothing: CharacterClothing;
  skillsAbilities: CharacterSkillsAbilities;
  speech: CharacterSpeech;
  personalityTraits: CharacterPersonalityTraits;
  sexuality: CharacterSexuality;
  backstory: CharacterBackstory;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: 'ai' | 'user' | 'import';
  source?: string;  // Original source if imported
  tags?: string[];
  version: number;
}

/**
 * Helper to create empty character sheet
 */
export function createEmptyCharacterSheet(name: string = ''): CharacterSheet {
  const emptySection = {
    overview: '', sexualExperience: '', romanticExperience: '', maritalStatus: '',
    attitudeTowardsChildren: '', preferences: '', endurance: '', contraception: '',
    fetishes: '', antiFetishes: '', boundaries: '',
  };
  
  return {
    id: crypto.randomUUID(),
    basicInfo: {
      name,
      species: '',
      height: '',
      weight: '',
      age: '',
      gender: '',
      orientation: '',
    },
    physicalAppearance: {
      build: '', hair: '', eyes: '', face: '', skin: '',
      chest: '', waist: '', hips: '', buttocks: '',
      arms: '', legs: '', hands: '', feet: '',
      genitalia: '', distinguishingFeatures: '',
    },
    clothing: { style: '' },
    skillsAbilities: {
      specialSkillsAbilities: '',
      strengths: '',
      weaknesses: '',
    },
    speech: {
      voice: '',
      speechStyle: '',
      vocabulary: '',
      catchphrases: '',
      bodyLanguage: '',
    },
    personalityTraits: {
      positiveTraits: '',
      negativeTraits: '',
      neutralTraits: '',
      habitsQuirks: '',
      fears: '',
      morals: '',
      likes: '',
      dislikes: '',
      interestsHobbies: '',
    },
    sexuality: emptySection,
    backstory: { backstory: '' },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'ai',
    version: 1,
  };
}

/**
 * Convert CharacterSheet to prompt-friendly format
 */
export function characterSheetToPrompt(sheet: CharacterSheet): string {
  const sections: string[] = [];
  
  sections.push(`<basic_info>
- Name: ${sheet.basicInfo.name}
- Species: ${sheet.basicInfo.species}
- Height: ${sheet.basicInfo.height}
- Weight: ${sheet.basicInfo.weight}
- Age: ${sheet.basicInfo.age}
- Gender: ${sheet.basicInfo.gender}
- Orientation: ${sheet.basicInfo.orientation}
</basic_info>`);

  sections.push(`<physical_appearance>
- Build: ${sheet.physicalAppearance.build}
- Hair: ${sheet.physicalAppearance.hair}
- Eyes: ${sheet.physicalAppearance.eyes}
- Face: ${sheet.physicalAppearance.face}
- Skin: ${sheet.physicalAppearance.skin}
- Chest: ${sheet.physicalAppearance.chest}
- Waist: ${sheet.physicalAppearance.waist}
- Hips: ${sheet.physicalAppearance.hips}
- Buttocks: ${sheet.physicalAppearance.buttocks}
- Arms: ${sheet.physicalAppearance.arms}
- Legs: ${sheet.physicalAppearance.legs}
- Hands: ${sheet.physicalAppearance.hands}
- Feet: ${sheet.physicalAppearance.feet}
- Genitalia: ${sheet.physicalAppearance.genitalia}
- Distinguishing Features: ${sheet.physicalAppearance.distinguishingFeatures}
</physical_appearance>`);

  sections.push(`<clothing>
- Style: ${sheet.clothing.style}
</clothing>`);

  sections.push(`<skills_abilities>
- Special Skills & Abilities: ${sheet.skillsAbilities.specialSkillsAbilities}
- Strengths: ${sheet.skillsAbilities.strengths}
- Weaknesses: ${sheet.skillsAbilities.weaknesses}
</skills_abilities>`);

  sections.push(`<speech>
- Voice: ${sheet.speech.voice}
- Speech Style: ${sheet.speech.speechStyle}
- Vocabulary: ${sheet.speech.vocabulary}
- Catchphrases: ${sheet.speech.catchphrases}
- Body Language: ${sheet.speech.bodyLanguage}
</speech>`);

  sections.push(`<personality_traits>
- Positive Traits: ${sheet.personalityTraits.positiveTraits}
- Negative Traits: ${sheet.personalityTraits.negativeTraits}
- Neutral Traits: ${sheet.personalityTraits.neutralTraits}
- Habits & Quirks: ${sheet.personalityTraits.habitsQuirks}
- Fears: ${sheet.personalityTraits.fears}
- Morals: ${sheet.personalityTraits.morals}
- Like: ${sheet.personalityTraits.likes}
- Dislike: ${sheet.personalityTraits.dislikes}
- Interests & Hobbies: ${sheet.personalityTraits.interestsHobbies}
</personality_traits>`);

  sections.push(`<sexuality>
- Overview: ${sheet.sexuality.overview}
- Sexual Experience: ${sheet.sexuality.sexualExperience}
- Romantic Experience: ${sheet.sexuality.romanticExperience}
- Marital status: ${sheet.sexuality.maritalStatus}
- Attitude towards children: ${sheet.sexuality.attitudeTowardsChildren}
- Preferences: ${sheet.sexuality.preferences}
- Endurance: ${sheet.sexuality.endurance}
- Contraception: ${sheet.sexuality.contraception}
- Fetishes: ${sheet.sexuality.fetishes}
- Anti-Fetishes: ${sheet.sexuality.antiFetishes}
- Boundaries: ${sheet.sexuality.boundaries}
</sexuality>`);

  sections.push(`<backstory>
- Backstory: ${sheet.backstory.backstory}
</backstory>`);

  return sections.join('\n\n');
}
