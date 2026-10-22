/**
 * This or that, couple edition: themed sets of ten two-way picks, played
 * quick-fire. Each of you picks for yourself; the score is how many you
 * matched. Written for Us Two. Set and item order are permanent once a set
 * ships (stored picks are positions), so add a new set rather than editing one.
 */

export interface ThisOrThatSet {
  id: string;
  title: string;
  items: readonly (readonly [string, string])[];
}

export const PICKS_PER_SET = 10;

export const THIS_OR_THAT_SETS: readonly ThisOrThatSet[] = [
  {
    id: 'date-night',
    title: 'Date night',
    items: [
      ['Dinner out', 'Cook at home'],
      ['Movie', 'Long talk'],
      ['Dress up', 'Comfy clothes'],
      ['Plan it', 'Wing it'],
      ['Cocktails', 'Milkshakes'],
      ['Rooftop', 'Hole in the wall'],
      ['Dancing', 'Bowling'],
      ['Early night', 'Out till late'],
      ['Phones away', 'Photos of everything'],
      ['Dessert first', 'No dessert'],
    ],
  },
  {
    id: 'food',
    title: 'Food',
    items: [
      ['Pizza', 'Tacos'],
      ['Sweet', 'Savoury'],
      ['Coffee', 'Tea'],
      ['Breakfast', 'Dinner'],
      ['Spicy', 'Mild'],
      ['Takeaway', 'Home cooked'],
      ['Chips', 'Chocolate'],
      ['Sushi', 'Burgers'],
      ['Share plates', 'Own plate, hands off'],
      ['Pineapple on pizza', 'No pineapple, ever'],
    ],
  },
  {
    id: 'home',
    title: 'Home life',
    items: [
      ['Early riser', 'Sleep in'],
      ['Tidy now', 'Tidy later'],
      ['Windows open', 'Heater on'],
      ['Big bed', 'Cosy bed'],
      ['Shower at night', 'Shower in the morning'],
      ['Cat', 'Dog'],
      ['Plants everywhere', 'No plants to kill'],
      ['Quiet house', 'Music on'],
      ['Big TV', 'No TV'],
      ['Hosting friends', 'Just us'],
    ],
  },
  {
    id: 'travel',
    title: 'Travel',
    items: [
      ['Beach', 'Mountains'],
      ['Road trip', 'Fly'],
      ['Hotel', 'Tent'],
      ['Packed itinerary', 'No plans'],
      ['Window seat', 'Aisle seat'],
      ['City break', 'Middle of nowhere'],
      ['Pack light', 'Pack everything'],
      ['Street food', 'Fancy restaurants'],
      ['Museums', 'Markets'],
      ['Somewhere hot', 'Somewhere snowy'],
    ],
  },
  {
    id: 'us',
    title: 'Us',
    items: [
      ['Big gestures', 'Little things'],
      ['Texts', 'Calls'],
      ['Surprise gifts', 'Gifts we pick together'],
      ['Talk it out now', 'Sleep on it'],
      ['Holding hands', 'Arm around you'],
      ['Same hobbies', 'Own hobbies'],
      ['Matching outfits', 'Never'],
      ['Love letters', 'Voice notes'],
      ['Anniversary trip', 'Anniversary dinner'],
      ['Forehead kiss', 'Bear hug'],
    ],
  },
  {
    id: 'weekend',
    title: 'Weekend',
    items: [
      ['Sleep in', 'Sunrise walk'],
      ['Brunch', 'Picnic'],
      ['Gym', 'Couch'],
      ['Friends', 'Just us two'],
      ['Errands done', 'Errands ignored'],
      ['Beach day', 'Movie marathon'],
      ['Farmers market', 'Shopping centre'],
      ['New place', 'Our usual'],
      ['Board games', 'Video games'],
      ['Sunday reset', 'Sunday scaries'],
    ],
  },
];

export function thisOrThatSetById(id: string): ThisOrThatSet | undefined {
  return THIS_OR_THAT_SETS.find((set) => set.id === id);
}

/** How many of the ten the two of you picked the same. */
export function matchCount(a: readonly number[], b: readonly number[]): number {
  return a.reduce((count, choice, i) => count + (choice === b[i] ? 1 : 0), 0);
}

/** The headline for a score, in plain words. */
export function matchVerdict(matched: number, total: number = PICKS_PER_SET): string {
  const share = matched / total;
  if (share === 1) return 'Same brain.';
  if (share >= 0.8) return 'Practically twins.';
  if (share >= 0.6) return 'Mostly in sync.';
  if (share >= 0.4) return 'Opposites, a little.';
  return 'Opposites attract.';
}
