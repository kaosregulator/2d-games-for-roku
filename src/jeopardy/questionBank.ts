import { CATEGORIES_PART_1 } from './categoriesPart1';
import { CATEGORIES_PART_2 } from './categoriesPart2';
import type { FinalJeopardyClue, JeopardyCategoryTemplate } from './types';

/**
 * Complete 28-Category 1990s Nostalgia Question Bank (140 clues total!)
 * Each full game uses 7 Round 1 categories ($200–$1,000) + 7 Double Jeopardy! categories ($400–$2,000).
 */
export const ALL_JEOPARDY_CATEGORIES: JeopardyCategoryTemplate[] = [
  ...CATEGORIES_PART_1,
  ...CATEGORIES_PART_2,
];

/** Curated Final Jeopardy! 1990s Nostalgia Clues */
export const FINAL_JEOPARDY_CLUES: FinalJeopardyClue[] = [
  {
    id: 'final_1',
    category: '1990s POP CULTURE MILESTONES',
    prompt:
      'Premiering on September 22, 1994, this NBC sitcom originally had the working title "Insomnia Cafe" before six New Yorkers made Central Perk famous.',
    correctResponse: 'What is Friends?',
    acceptedKeywords: ['friends'],
    choices: ['What is Friends?', 'What is Seinfeld?', 'What is Frasier?', 'What is Living Single?'],
    media: { source: 'wiki', id: 'Friends', caption: 'NBC\'s Friends (1994)', showOnClue: true },
  },
  {
    id: 'final_2',
    category: '90s VIDEO GAME LEGENDS',
    prompt:
      'Released in 1996 alongside the Nintendo 64, this revolutionary 3D platformer let players leap inside paintings throughout Princess Peach\'s Castle.',
    correctResponse: 'What is Super Mario 64?',
    acceptedKeywords: ['super mario 64', 'mario 64'],
    choices: [
      'What is Super Mario 64?',
      'What is Banjo-Kazooie?',
      'What is The Legend of Zelda: Ocarina of Time?',
      'What is Spyro the Dragon?',
    ],
    media: { source: 'wiki', id: 'Super_Mario_64', caption: 'Super Mario 64 (1996)', showOnClue: true },
    video: {
      archiveId: 'Nintendo_64_1997_Nintendo_AU',
      file: 'Nintendo_64_1997_Nintendo_AU.mp4',
      caption: 'Internet Archive: 1997 Nintendo 64 TV Commercial',
      timing: 'on_reveal',
    },
  },
  {
    id: 'final_3',
    category: '90s ANIMATED CINEMA',
    prompt:
      'Released in June 1994 with music by Elton John and Hans Zimmer, it became the highest-grossing traditionally animated feature film of all time.',
    correctResponse: 'What is The Lion King?',
    acceptedKeywords: ['lion king', 'the lion king'],
    choices: [
      'What is The Lion King?',
      'What is Aladdin?',
      'What is Beauty and the Beast?',
      'What is Mulan?',
    ],
    media: { source: 'wiki', id: 'The_Lion_King', caption: 'Disney\'s The Lion King (1994)', showOnClue: true },
  },
  {
    id: 'final_4',
    category: '90s INTERNET PIONEERS',
    prompt:
      'Created in 1995 by Jerry Yang and David Filo as "Jerry and David\'s Guide to the World Wide Web," its purple yodel became the sound of early web surfing.',
    correctResponse: 'What is Yahoo!?',
    acceptedKeywords: ['yahoo'],
    choices: ['What is Yahoo!?', 'What is AltaVista?', 'What is Lycos?', 'What is Netscape?'],
    media: { source: 'wiki', id: 'Yahoo!', caption: 'Yahoo! Early Web Portal (1995)', showOnClue: true },
  },
  {
    id: 'final_5',
    category: '90s BLOCKBUSTER CINEMA',
    prompt:
      'Steven Spielberg\'s 1993 dinosaur thriller broke box-office records using groundbreaking CGI alongside Stan Winston\'s full-size animatronic T. rex.',
    correctResponse: 'What is Jurassic Park?',
    acceptedKeywords: ['jurassic park'],
    choices: [
      'What is Jurassic Park?',
      'What is Independence Day?',
      'What is Terminator 2?',
      'What is Twister?',
    ],
    media: { source: 'wiki', id: 'Jurassic_Park_(film)', caption: 'Jurassic Park (1993)', showOnClue: true },
  },
  {
    id: 'final_6',
    category: '90s TELEVISION HISTORY',
    prompt:
      'Airing its series finale to 76 million viewers in May 1998, this NBC comedy famously billed itself as "a show about nothing."',
    correctResponse: 'What is Seinfeld?',
    acceptedKeywords: ['seinfeld'],
    choices: ['What is Seinfeld?', 'What is Cheers?', 'What is Home Improvement?', 'What is Mad About You?'],
    media: { source: 'wiki', id: 'Seinfeld', caption: 'Seinfeld (1989–1998)', showOnClue: true },
  },
];
