/** One question a couple can be asked. Ids are permanent: never point an id at a different question. */
export type Question = OpenQuestion | PickQuestion;

export interface OpenQuestion {
  id: string;
  kind: 'open';
  prompt: string;
}

/** Each of you picks for yourself, then guesses what your partner picked. */
export interface PickQuestion {
  id: string;
  kind: 'pick';
  prompt: string;
  options: readonly string[];
}

export const OPEN_ANSWER_MAX_LENGTH = 500;

/** An option meaning "the person answering". Shown as "Me"; see `perspective.ts`. */
export const ME = '@me';
/** An option meaning "the person answering's partner". Shown as their name. */
export const PARTNER = '@partner';
