import type { JeopardyCategoryTemplate } from './types';

/**
 * Categories 1–14 of the 28-Category 1990s Nostalgia Vault
 * (Episode 1: 7 Round 1 Categories + 7 Double Jeopardy! Categories)
 */
export const CATEGORIES_PART_1: JeopardyCategoryTemplate[] = [
  // 1. ROUND 1 — SATURDAY MORNING TOONS
  {
    id: 'sat_toons',
    title: 'SATURDAY MORNING TOONS',
    subtitle: 'Bowl of cereal required',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Tommy Pickles kept a trusty plastic screwdriver tucked in his diaper on this iconic Nickelodeon cartoon about adventurous toddlers.',
        correctResponse: 'What is Rugrats?',
        acceptedKeywords: ['rugrats'],
        choices: ['What is Rugrats?', 'What is Doug?', 'What is Rocket Power?', 'What is Recess?'],
        media: { source: 'wiki', id: 'Rugrats', caption: 'Rugrats (1991)', showOnClue: true },
        video: {
          archiveId: '2003-commercial-for-rugrats-go-wild',
          file: '2003 commercial for Rugrats Go Wild.ia.mp4',
          caption: 'Internet Archive: Rugrats TV Commercial',
          timing: 'before_clue',
          previewSec: 7,
        },
      },
      {
        tier: 2,
        prompt:
          'Helga Pataki secretly kept a shrine to the football-headed fourth grader who lived in a boarding house on this 1996 series.',
        correctResponse: 'What is Hey Arnold!?',
        acceptedKeywords: ['hey arnold', 'arnold'],
        choices: ['What is Hey Arnold!?', 'What is Recess?', 'What is Pepper Ann?', 'What is Doug?'],
        media: { source: 'wiki', id: 'Hey_Arnold!', caption: 'Hey Arnold! (1996)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Yakko, Wakko, and Dot lived inside the Warner Bros. water tower before escaping into zany musical sketches on this Steven Spielberg-produced show.',
        correctResponse: 'What is Animaniacs?',
        acceptedKeywords: ['animaniacs'],
        choices: ['What is Animaniacs?', 'What is Tiny Toon Adventures?', 'What is Freakazoid!?', 'What is Pinky and the Brain?'],
        media: { source: 'wiki', id: 'Animaniacs', caption: 'Animaniacs (1993)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Its unforgettable electric-guitar theme song blasted every Saturday morning on Fox Kids as Wolverine, Storm, and Cyclops battled Sentinels.',
        correctResponse: 'What is X-Men: The Animated Series?',
        acceptedKeywords: ['x-men', 'xmen', 'x men'],
        choices: [
          'What is X-Men: The Animated Series?',
          'What is Spider-Man: The Animated Series?',
          'What is Batman: The Animated Series?',
          'What is Gargoyles?',
        ],
        media: { source: 'wiki', id: 'X-Men:_The_Animated_Series', caption: 'X-Men on Fox Kids (1992)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Before heading to Bluffington with his dog Porkchop, this green sweater-vest wearing dreamer imagined himself as Quailman.',
        correctResponse: 'Who is Doug Funnie?',
        acceptedKeywords: ['doug', 'doug funnie'],
        choices: ['Who is Doug Funnie?', 'Who is Arnold Shortman?', 'Who is Chuckie Finster?', 'Who is T.J. Detweiler?'],
        media: { source: 'wiki', id: 'Doug_(TV_series)', caption: 'Doug (1991)', showOnClue: true },
      },
    ],
  },

  // 2. ROUND 1 — 90s COMMERCIAL JINGLES
  {
    id: 'commercial_jingles',
    title: '90s COMMERCIAL JINGLES',
    subtitle: 'Still stuck in your head',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'This iconic 1993 dairy ad campaign launched with a man unable to say "Aaron Burr" through a mouthful of peanut butter sandwich.',
        correctResponse: 'What is "Got Milk?"?',
        acceptedKeywords: ['got milk'],
        choices: ['What is "Got Milk?"?', 'What is "Where\'s the Beef?"?', 'What is "I\'m Lovin\' It"?', 'What is "Just Do It"?'],
        media: { source: 'wiki', id: 'Got_Milk%3F', caption: 'Got Milk? campaign (1993)', showOnClue: true },
        video: {
          archiveId: 'drarthur_got_milk',
          file: 'milk-ipod_512kb.mp4',
          caption: 'Internet Archive: Got Milk? Commercial Vault',
          timing: 'on_reveal',
        },
      },
      {
        tier: 2,
        prompt:
          'Ch-Ch-Ch-this terracotta clay planter sprouted bright green herb "hair" in thousands of holiday TV commercials throughout the 1990s.',
        correctResponse: 'What is a Chia Pet?',
        acceptedKeywords: ['chia pet', 'chia'],
        choices: ['What is a Chia Pet?', 'What is a Pet Rock?', 'What is a Sea-Monkey?', 'What is a Troll Doll?'],
        media: { source: 'wiki', id: 'Chia_Pet', caption: 'Classic terracotta Chia Pet', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Its dramatic rock-anthem commercial promised kids "You\'ll get caught up in the..." this steel-ball shooting tabletop arena game.',
        correctResponse: 'What is Crossfire?',
        acceptedKeywords: ['crossfire'],
        choices: ['What is Crossfire?', 'What is Mousetrap?', 'What is Hungry Hungry Hippos?', 'What is Beyblade?'],
        media: { source: 'wiki', id: 'Crossfire_(board_game)', caption: 'Milton Bradley Crossfire', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Cheesy European commercials with a cheerful pop jingle dubbed this chewy mint roll "The Freshmaker!" whenever someone solved an awkward mishap.',
        correctResponse: 'What is Mentos?',
        acceptedKeywords: ['mentos'],
        choices: ['What is Mentos?', 'What is Tic Tac?', 'What is Certs?', 'What is Altoids?'],
        media: { source: 'wiki', id: 'Mentos', caption: 'Mentos — The Freshmaker', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Kids heard "More fun than a pillow fight!" in commercials for these inflatable vinyl boxing gloves worn on each hand.',
        correctResponse: 'What are Sock\'em Boppers?',
        acceptedKeywords: ['sockem boppers', 'sock em boppers', 'socker boppers'],
        choices: ['What are Sock\'em Boppers?', 'What are Moon Shoes?', 'What are Hulk Hands?', 'What are Nerf Blasters?'],
        media: { source: 'wiki', id: 'Socker_Boppers', caption: '90s Inflatable Toy Craze', showOnClue: true },
      },
    ],
  },

  // 3. ROUND 1 — AFTER-SCHOOL SITCOMS
  {
    id: 'after_school_sitcoms',
    title: 'AFTER-SCHOOL SITCOMS',
    subtitle: 'Syndicated at 4 PM sharp',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'After "one little fight," Will\'s mom got scared and sent him to live with his Auntie and Uncle in this affluent Los Angeles neighborhood.',
        correctResponse: 'What is Bel-Air?',
        acceptedKeywords: ['bel-air', 'bel air', 'fresh prince'],
        choices: ['What is Bel-Air?', 'What is Beverly Hills?', 'What is Bayside?', 'What is Malibu?'],
        media: { source: 'wiki', id: 'The_Fresh_Prince_of_Bel-Air', caption: 'The Fresh Prince of Bel-Air (1990)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Zack Morris could literally freeze time with a "Time Out!" while carrying a brick-sized cell phone at Bayside High on this series.',
        correctResponse: 'What is Saved by the Bell?',
        acceptedKeywords: ['saved by the bell'],
        choices: ['What is Saved by the Bell?', 'What is Boy Meets World?', 'What is California Dreams?', 'What is Hang Time?'],
        media: { source: 'wiki', id: 'Saved_by_the_Bell', caption: 'Saved by the Bell', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Danny Tanner raised DJ, Stephanie, and Michelle alongside Uncle Jesse and Joey inside a famous Victorian house in this California city.',
        correctResponse: 'What is San Francisco?',
        acceptedKeywords: ['san francisco', 'full house'],
        choices: ['What is San Francisco?', 'What is Seattle?', 'What is Los Angeles?', 'What is Chicago?'],
        media: { source: 'wiki', id: 'Painted_ladies', caption: 'San Francisco Painted Ladies', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Cory Matthews, Shawn Hunter, and Topanga Lawrence learned life lessons from next-door neighbor and teacher Mr. Feeny on this show.',
        correctResponse: 'What is Boy Meets World?',
        acceptedKeywords: ['boy meets world'],
        choices: ['What is Boy Meets World?', 'What is The Wonder Years?', 'What is Even Stevens?', 'What is Smart Guy?'],
        media: { source: 'wiki', id: 'Boy_Meets_World', caption: 'Boy Meets World (1993)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          '"Did I do that?" became a household catchphrase thanks to suspender-wearing genius Steve Urkel on this Chicago family sitcom.',
        correctResponse: 'What is Family Matters?',
        acceptedKeywords: ['family matters'],
        choices: ['What is Family Matters?', 'What is Step by Step?', 'What is Perfect Strangers?', 'What is Sister, Sister?'],
        media: { source: 'wiki', id: 'Family_Matters', caption: 'Family Matters (1989–1998)', showOnClue: true },
      },
    ],
  },

  // 4. ROUND 1 — PLAYGROUND & RECESS
  {
    id: 'playground_recess',
    title: 'PLAYGROUND & RECESS',
    subtitle: 'Banned by the principal by Tuesday',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Kids stacked cardboard discs with cool graphics and smashed them with heavy plastic or metal "slammers" during this mid-90s recess craze.',
        correctResponse: 'What are Pogs?',
        acceptedKeywords: ['pogs', 'pog', 'milk caps'],
        choices: ['What are Pogs?', 'What are Marbles?', 'What are Crazy Bones?', 'What are Beyblades?'],
        media: { source: 'wiki', id: 'Milk_caps_(game)', caption: '1990s Milk Caps / Pogs & Slammers', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Beep! Kids begged their parents to feed and clean up after this egg-shaped keychain digital pet from Bandai while they were stuck in class.',
        correctResponse: 'What is a Tamagotchi?',
        acceptedKeywords: ['tamagotchi'],
        choices: ['What is a Tamagotchi?', 'What is a Giga Pet?', 'What is a Digivice?', 'What is a Furby?'],
        media: { source: 'wiki', id: 'Tamagotchi', caption: 'Original 1996 Bandai Tamagotchi', showOnClue: true },
        video: {
          archiveId: 'twitter-1339548400027623424',
          file: '1339548400027623424.mp4',
          caption: 'Internet Archive: 1997 Digital Pet Craze Clip',
          timing: 'with_clue',
        },
      },
      {
        tier: 3,
        prompt:
          'Featuring neon rainbow dolphins, unicorns, and spotted leopards, this brand ruled Trapper Keepers, folders, and sticker books everywhere.',
        correctResponse: 'What is Lisa Frank?',
        acceptedKeywords: ['lisa frank'],
        choices: ['What is Lisa Frank?', 'What is Sanrio?', 'What is Mead?', 'What is Crayola?'],
        media: { source: 'wiki', id: 'Trapper_Keeper', caption: '90s School Binder Essentials', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Its jingle sang "The very best thing of all, there\'s a counter on this ball!" as you hopped over a plastic hoop looped around one ankle.',
        correctResponse: 'What is a Skip-It?',
        acceptedKeywords: ['skip-it', 'skip it'],
        choices: ['What is a Skip-It?', 'What is a Pogo Ball?', 'What is a Bop It?', 'What is a Koosh Ball?'],
        media: { source: 'wiki', id: 'Skip-It', caption: 'Tiger Electronics Skip-It', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Made of soft colorful rubber filaments radiating from a squishy core, this 90s sensory ball was famously tossed around on Rosie O\'Donnell\'s show.',
        correctResponse: 'What is a Koosh Ball?',
        acceptedKeywords: ['koosh', 'koosh ball'],
        choices: ['What is a Koosh Ball?', 'What is a Nerf Ball?', 'What is a Hacky Sack?', 'What is a Stress Ball?'],
        media: { source: 'wiki', id: 'Koosh_ball', caption: 'Classic 90s Koosh Ball', showOnClue: true },
      },
    ],
  },

  // 5. ROUND 1 — 90s GAME CONSOLES
  {
    id: 'game_consoles',
    title: '90s GAME CONSOLES',
    subtitle: 'Channel 3 & RF switches',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Seen here, this chunky grey portable ran on four AA batteries and launched alongside the endlessly addictive puzzle hit Tetris.',
        correctResponse: 'What is the Game Boy?',
        acceptedKeywords: ['game boy', 'gameboy'],
        choices: ['What is the Game Boy?', 'What is the Game Gear?', 'What is the Atari Lynx?', 'What is the Virtual Boy?'],
        media: { source: 'wiki', id: 'Game_Boy', caption: 'Nintendo Game Boy (1989)', showOnClue: true },
        video: {
          archiveId: '1989-nintendo-game-boy-commercial',
          file: '1989 Nintendo GameBoy Commercial.ia.mp4',
          caption: 'Internet Archive: 1989 Nintendo Game Boy Commercial',
          timing: 'before_clue',
          previewSec: 8,
        },
      },
      {
        tier: 2,
        prompt:
          'Boasting "Blast Processing" in fierce 1990s TV commercials, this sleek black 16-bit Sega machine was home to Sonic the Hedgehog.',
        correctResponse: 'What is the Sega Genesis?',
        acceptedKeywords: ['sega genesis', 'genesis', 'mega drive'],
        choices: ['What is the Sega Genesis?', 'What is the Sega Saturn?', 'What is the Dreamcast?', 'What is the TurboGrafx-16?'],
        media: { source: 'wiki', id: 'Sega_Genesis', caption: 'Sega Genesis 16-bit console', showOnClue: true },
        video: {
          archiveId: 'kitn-ch-29-1990-genesis-does-what-nintendont',
          file: 'KITN Ch 29 - 1990 - Genesis Does What Nintendont.mp4',
          caption: 'Internet Archive: 1990 "Genesis Does What Nintendon\'t" Ad',
          timing: 'with_clue',
        },
      },
      {
        tier: 3,
        prompt:
          'Featuring purple switches in North America, this 16-bit powerhouse delivered Super Mario World, Donkey Kong Country, and Chrono Trigger.',
        correctResponse: 'What is the Super Nintendo (SNES)?',
        acceptedKeywords: ['super nintendo', 'snes', 'super nes'],
        choices: ['What is the Super Nintendo (SNES)?', 'What is the NES?', 'What is the Nintendo 64?', 'What is the GameCube?'],
        media: { source: 'wiki', id: 'Super_Nintendo_Entertainment_System', caption: 'Super Nintendo Entertainment System', showOnClue: true },
        video: {
          archiveId: 'youtube-BUftOMvGEY8',
          file: 'BUftOMvGEY8.mp4',
          caption: 'Internet Archive: 1990s Super Nintendo Commercial',
          timing: 'on_reveal',
        },
      },
      {
        tier: 4,
        prompt:
          'Its iconic three-pronged trident controller let four friends crowd onto one couch for GoldenEye 007 and Mario Kart.',
        correctResponse: 'What is the Nintendo 64?',
        acceptedKeywords: ['nintendo 64', 'n64'],
        choices: ['What is the Nintendo 64?', 'What is the PlayStation?', 'What is the Sega Dreamcast?', 'What is the GameCube?'],
        media: { source: 'wiki', id: 'Nintendo_64', caption: 'Nintendo 64 (1996)', showOnClue: true },
        video: {
          archiveId: 'Nintendo_64_1997_Nintendo_AU',
          file: 'Nintendo_64_1997_Nintendo_AU.mp4',
          caption: 'Internet Archive: 1997 Nintendo 64 TV Commercial',
          timing: 'on_reveal',
        },
      },
      {
        tier: 5,
        prompt:
          'Sony reshaped gaming in 1995 with this grey CD-ROM console whose black-bottomed discs introduced Crash Bandicoot and Final Fantasy VII.',
        correctResponse: 'What is the PlayStation?',
        acceptedKeywords: ['playstation', 'ps1', 'psx'],
        choices: ['What is the PlayStation?', 'What is the Sega CD?', 'What is the 3DO?', 'What is the Philips CD-i?'],
        media: { source: 'wiki', id: 'PlayStation_(console)', caption: 'Original Sony PlayStation (PS1)', showOnClue: true },
        video: {
          archiveId: '1st-playstation-1-commercial-1995-ai-upscale-4-k-ultra-hd',
          file: '1st Playstation 1 Commercial 1995 AI Upscale 4K Ultra HD.ia.mp4',
          caption: 'Internet Archive: 1995 First PlayStation TV Commercial',
          timing: 'on_reveal',
        },
      },
    ],
  },

  // 6. ROUND 1 — LUNCHBOX & SNACKS
  {
    id: 'lunchbox_snacks',
    title: 'LUNCHBOX & SNACKS',
    subtitle: 'Cafeteria trading currency',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Kids traded half their sandwich for this Betty Crocker duo of kangaroo-shaped cinnamon cookies paired with a tub of rainbow-sprinkle frosting.',
        correctResponse: 'What are Dunkaroos?',
        acceptedKeywords: ['dunkaroos', 'dunk-a-roos'],
        choices: ['What are Dunkaroos?', 'What are Teddy Grahams?', 'What are Koala Yummies?', 'What are Oreos?'],
        media: { source: 'wiki', id: 'Dunkaroos', caption: '90s Lunchbox Favorite: Dunkaroos', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Packaged in a bright yellow plastic tray with crackers, sliced meat, and cheese, you were cafeteria royalty if you brought the pizza version.',
        correctResponse: 'What are Lunchables?',
        acceptedKeywords: ['lunchables'],
        choices: ['What are Lunchables?', 'What are Bagel Bites?', 'What are Hot Pockets?', 'What are Kid Cuisine?'],
        media: { source: 'wiki', id: 'Lunchables', caption: 'Oscar Mayer Lunchables', showOnClue: true },
        video: {
          archiveId: 'VHS-028_293673-294572',
          file: '293673_Lunchables-Tacos-and-Nachos-School-Cafeteria-Commercial-A-and-E_2000-01-28.ia.mp4',
          caption: 'Internet Archive: Lunchables School Cafeteria Ad',
          timing: 'on_reveal',
        },
      },
      {
        tier: 3,
        prompt:
          'Its wild 1990s commercials turned kids\' heads into giant strawberries or watermelons the moment they bit into these liquid-filled fruit snacks.',
        correctResponse: 'What are Fruit Gushers?',
        acceptedKeywords: ['gushers', 'fruit gushers'],
        choices: ['What are Fruit Gushers?', 'What are Fruit Roll-Ups?', 'What are Fruit by the Foot?', 'What are Shark Bites?'],
        media: { source: 'wiki', id: 'Fruit_Gushers', caption: 'Fruit Gushers (1991)', showOnClue: true },
        video: {
          archiveId: 'fruit-gushers-1992-commercial',
          file: 'FRUIT GUSHERS - 1992 Commercial.mp4',
          caption: 'Internet Archive: 1992 Fruit Gushers TV Commercial',
          timing: 'before_clue',
          previewSec: 8,
        },
      },
      {
        tier: 4,
        prompt:
          'Released by Coca-Cola in 1997 in a neon-green can with bold screaming commercials, this citrus soda aimed straight at Mountain Dew.',
        correctResponse: 'What is Surge?',
        acceptedKeywords: ['surge'],
        choices: ['What is Surge?', 'What is Mello Yello?', 'What is Orbitz?', 'What is Jolt Cola?'],
        media: { source: 'wiki', id: 'Surge_(drink)', caption: 'Surge Citrus Soda (1997)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Launched during the 1993 Super Bowl to Van Halen\'s "Right Now," this short-lived clear cola promised caffeine-free clarity.',
        correctResponse: 'What is Crystal Pepsi?',
        acceptedKeywords: ['crystal pepsi'],
        choices: ['What is Crystal Pepsi?', 'What is Pepsi Blue?', 'What is Tab Clear?', 'What is Clearly Canadian?'],
        media: { source: 'wiki', id: 'Crystal_Pepsi', caption: 'Crystal Pepsi (1992–1993)', showOnClue: true },
      },
    ],
  },

  // 7. ROUND 1 — THINGS MOM SAID IN THE 90s
  {
    id: 'things_mom_said',
    title: 'THINGS MOM SAID IN THE 90s',
    subtitle: 'Household laws of the decade',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          '"Get off the internet, I need to make a phone call!" happened because 1990s home internet shared this household copper line.',
        correctResponse: 'What is a landline telephone?',
        acceptedKeywords: ['landline', 'phone line', 'telephone', 'dial-up'],
        choices: [
          'What is a landline telephone?',
          'What is a cable TV splitter?',
          'What is a pager network?',
          'What is a ham radio?',
        ],
        media: { source: 'wiki', id: 'Dial-up_Internet_access', caption: '1990s Dial-Up Modem Era', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Before returning your Friday night rental tape to the video store, every sticker reminded families to "Be Kind" and do this.',
        correctResponse: 'What is Rewind?',
        acceptedKeywords: ['rewind', 'be kind rewind'],
        choices: ['What is Rewind?', 'What is Fast Forward?', 'What is Track?', 'What is Eject?'],
        media: { source: 'wiki', id: 'VHS', caption: 'Classic VHS Videocassette', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'When a Nintendo game froze on a glitchy screen, every kid ignored the warning label on the back and tried this legendary lung-powered "fix."',
        correctResponse: 'What is blowing into the cartridge?',
        acceptedKeywords: ['blow', 'blowing', 'cartridge'],
        choices: [
          'What is blowing into the cartridge?',
          'What is freezing the console?',
          'What is shaking the TV?',
          'What is tapping the power brick?',
        ],
        media: { source: 'wiki', id: 'ROM_cartridge', caption: '90s Game Cartridge Contacts', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'To avoid getting "square eyes," parents strictly warned kids not to sit too close to the glowing glass screen of this heavy television type.',
        correctResponse: 'What is a CRT television?',
        acceptedKeywords: ['crt', 'cathode ray', 'tube tv', 'box tv'],
        choices: [
          'What is a CRT television?',
          'What is a Plasma screen?',
          'What is a LaserDisc monitor?',
          'What is an OLED panel?',
        ],
        media: { source: 'wiki', id: 'Cathode-ray_tube', caption: 'Classic 90s Tube Television', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          '"Wait until after 9 PM so the minutes are free!" became the golden rule once families got their first chunky Nokia or Motorola one of these.',
        correctResponse: 'What is a cell phone?',
        acceptedKeywords: ['cell phone', 'mobile phone', 'nokia', 'flip phone'],
        choices: [
          'What is a cell phone?',
          'What is a cordless phone?',
          'What is a two-way pager?',
          'What is a PalmPilot?',
        ],
        media: { source: 'wiki', id: 'Nokia_5110', caption: 'Classic late-90s Nokia handset', showOnClue: true },
      },
    ],
  },

  // ================= DOUBLE JEOPARDY! ($400–$2,000) — EPISODE 1 =================

  // 8. DOUBLE JEOPARDY — NICKELODEON & SNICK
  {
    id: 'nick_snick',
    title: 'NICKELODEON & SNICK',
    subtitle: 'Big Orange Couch Saturdays',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Premiering in 1994 with its iconic TLC theme song, this kids\' sketch comedy show launched Kenan Thompson, Kel Mitchell, and Amanda Bynes.',
        correctResponse: 'What is All That?',
        acceptedKeywords: ['all that'],
        choices: ['What is All That?', 'What is The Amanda Show?', 'What is Figure It Out?', 'What is Kablam!?'],
        media: { source: 'wiki', id: 'All_That', caption: 'Nickelodeon\'s All That (1994)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          '"Submitted for the approval of the Midnight Society," teens tossed dust into a campfire to tell spooky tales on this SNICK staple.',
        correctResponse: 'What is Are You Afraid of the Dark??',
        acceptedKeywords: ['are you afraid of the dark', 'midnight society'],
        choices: [
          'What is Are You Afraid of the Dark??',
          'What is Goosebumps?',
          'What is Eerie, Indiana?',
          'What is Tales from the Cryptkeeper?',
        ],
        media: { source: 'wiki', id: 'Are_You_Afraid_of_the_Dark%3F', caption: 'The Midnight Society on SNICK', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Teams like the Silver Snakes and Blue Barracudas struggled to assemble the Shrine of the Silver Monkey for talking stone head Olmec on this game show.',
        correctResponse: 'What is Legends of the Hidden Temple?',
        acceptedKeywords: ['legends of the hidden temple', 'hidden temple'],
        choices: [
          'What is Legends of the Hidden Temple?',
          'What is Nickelodeon Guts?',
          'What is Double Dare?',
          'What is Wild & Crazy Kids?',
        ],
        media: { source: 'wiki', id: 'Legends_of_the_Hidden_Temple', caption: 'Olmec & The Temple Run', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          '"Who loves orange soda? Kel loves orange soda!" was the signature line of this buddy sitcom set around Rigby\'s grocery store.',
        correctResponse: 'What is Kenan & Kel?',
        acceptedKeywords: ['kenan & kel', 'kenan and kel'],
        choices: ['What is Kenan & Kel?', 'What is Good Burger?', 'What is Drake & Josh?', 'What is Cousin Skeeter?'],
        media: { source: 'wiki', id: 'Kenan_%26_Kel', caption: 'Kenan & Kel (1996)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Before starring as Sabrina, Melissa Joan Hart broke the fourth wall while best friend Sam climbed a ladder into her bedroom on this show.',
        correctResponse: 'What is Clarissa Explains It All?',
        acceptedKeywords: ['clarissa explains it all', 'clarissa'],
        choices: [
          'What is Clarissa Explains It All?',
          'What is The Secret World of Alex Mack?',
          'What is Salute Your Shorts?',
          'What is The Adventures of Pete & Pete?',
        ],
        media: { source: 'wiki', id: 'Clarissa_Explains_It_All', caption: 'Clarissa Explains It All (1991)', showOnClue: true },
      },
    ],
  },

  // 9. DOUBLE JEOPARDY — 90s KID MOVIES
  {
    id: 'kid_movies_90s',
    title: '90s KID MOVIES',
    subtitle: 'Friday night VHS magic',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Michael Jordan teamed up with Bugs Bunny and the Looney Tunes to defeat the talent-stealing Monstars in this 1996 live-action/animated smash.',
        correctResponse: 'What is Space Jam?',
        acceptedKeywords: ['space jam'],
        choices: ['What is Space Jam?', 'What is Looney Tunes: Back in Action?', 'What is Air Bud?', 'What is Like Mike?'],
        media: { source: 'wiki', id: 'Space_Jam', caption: 'Space Jam (1996)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Making cinema history in 1995 as the first completely computer-animated feature film, it starred Woody the cowboy and space ranger Buzz Lightyear.',
        correctResponse: 'What is Toy Story?',
        acceptedKeywords: ['toy story'],
        choices: ['What is Toy Story?', 'What is A Bug\'s Life?', 'What is Small Soldiers?', 'What is Antz?'],
        media: { source: 'wiki', id: 'Toy_Story', caption: 'Pixar\'s Toy Story (1995)', showOnClue: true },
        video: {
          archiveId: 'disney-interactive-toy-story-1995-restored',
          file: 'Disney Interactive Toy Story (1995) (Restored).mp4',
          caption: 'Internet Archive: 1995 Toy Story Restored Promo',
          timing: 'with_clue',
        },
      },
      {
        tier: 3,
        prompt:
          '"You\'re killin\' me, Smalls!" echoed from every baseball diamond after kids watched a group of friends try to retrieve a Babe Ruth ball from "The Beast."',
        correctResponse: 'What is The Sandlot?',
        acceptedKeywords: ['sandlot', 'the sandlot'],
        choices: ['What is The Sandlot?', 'What is Rookie of the Year?', 'What is Angels in the Outfield?', 'What is The Mighty Ducks?'],
        media: { source: 'wiki', id: 'The_Sandlot', caption: 'The Sandlot (1993)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Eight-year-old Kevin McCallister defended his suburban Chicago house from the Wet Bandits with paint cans and Micro Machines in this 1990 classic.',
        correctResponse: 'What is Home Alone?',
        acceptedKeywords: ['home alone'],
        choices: ['What is Home Alone?', 'What is Richie Rich?', 'What is Dennis the Menace?', 'What is Problem Child?'],
        media: { source: 'wiki', id: 'Home_Alone', caption: 'Home Alone (1990)', showOnClue: true },
        video: {
          archiveId: 'home-alone_202109',
          file: 'Home Alone.ia.mp4',
          caption: 'Internet Archive: Home Alone (1990) Theatrical Trailer',
          timing: 'on_reveal',
        },
      },
      {
        tier: 5,
        prompt:
          'Robin Williams emerged from a mysterious jungle board game after 26 years—asking "What year is it?!"—in this 1995 adventure film.',
        correctResponse: 'What is Jumanji?',
        acceptedKeywords: ['jumanji'],
        choices: ['What is Jumanji?', 'What is Hook?', 'What is Zathura?', 'What is Flubber?'],
        media: { source: 'wiki', id: 'Jumanji', caption: 'Jumanji (1995)', showOnClue: true },
      },
    ],
  },

  // 10. DOUBLE JEOPARDY — SOUNDS OF THE 90s
  {
    id: 'sounds_of_90s',
    title: 'SOUNDS OF THE 90s',
    subtitle: 'You can hear these in your mind',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Recorded by voice actor Elwood Edwards in his living room in 1989, these three cheerful words greeted millions whenever an email arrived on AOL.',
        correctResponse: 'What is "You\'ve Got Mail!"?',
        acceptedKeywords: ['youve got mail', 'you\'ve got mail', 'got mail'],
        choices: [
          'What is "You\'ve Got Mail!"?',
          'What is "Welcome Online!"?',
          'What is "Goodbye!"?',
          'What is "Connection Ready!"?',
        ],
        media: { source: 'wiki', id: 'AOL', caption: 'America Online 1990s CDs & Mail', showOnClue: true },
        video: {
          archiveId: 'EarlyAOLCommercial1995',
          file: 'Early AOL Commercial (1995).mp4',
          caption: 'Internet Archive: 1995 Early AOL TV Commercial',
          timing: 'before_clue',
          previewSec: 8,
        },
      },
      {
        tier: 2,
        prompt:
          'Known officially as the "Deep Note," this rising, earth-shaking synth chord before VHS movies warned you that "The Audience Is Listening."',
        correctResponse: 'What is THX?',
        acceptedKeywords: ['thx', 'thx deep note'],
        choices: ['What is THX?', 'What is Dolby Digital?', 'What is IMAX?', 'What is DTS?'],
        media: { source: 'wiki', id: 'THX', caption: 'THX Sound System Logo', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Before a single polygon loaded, its shimmering, echoing synthesizer chord—often called the most nostalgic console boot sound ever—filled the living room.',
        correctResponse: 'What is the PlayStation startup sound?',
        acceptedKeywords: ['playstation', 'ps1', 'sony playstation'],
        choices: [
          'What is the PlayStation startup sound?',
          'What is the Sega Dreamcast swirl?',
          'What is the GameCube jingle?',
          'What is the Atari chime?',
        ],
        media: { source: 'wiki', id: 'PlayStation_(console)', caption: 'Sony PlayStation Boot Screen', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Beeeep—krrrrshhhh—boing-boing—kshhhhhh! This unmistakable handshake noise happened every time your PC connected at up to 56 kilobits per second.',
        correctResponse: 'What is a 56k dial-up modem?',
        acceptedKeywords: ['modem', 'dial-up', 'dial up', '56k'],
        choices: [
          'What is a 56k dial-up modem?',
          'What is a dot-matrix printer?',
          'What is a cassette rewinder?',
          'What is a fax toner?',
        ],
        media: { source: 'wiki', id: 'Modem', caption: 'External 56k Dial-Up Modem', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Composed by Brian Eno on a Mac, "The Microsoft Sound" greeted desktop users with six tranquil seconds of chime audio when booting this OS.',
        correctResponse: 'What is Windows 95?',
        acceptedKeywords: ['windows 95', 'win95'],
        choices: ['What is Windows 95?', 'What is Windows 3.1?', 'What is Mac OS 8?', 'What is Windows XP?'],
        media: { source: 'wiki', id: 'Windows_95', caption: 'Microsoft Windows 95', showOnClue: true },
        video: {
          archiveId: 'windows-95-commercial-collection',
          file: 'Connectivity (Italian).mp4',
          caption: 'Internet Archive: 1995 Windows 95 TV Commercial',
          timing: 'on_reveal',
        },
      },
    ],
  },

  // 11. DOUBLE JEOPARDY — BOYS, GIRLS & POP BANDS
  {
    id: 'pop_bands_90s',
    title: 'BOYS, GIRLS & POP BANDS',
    subtitle: 'CD binders & poster walls',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          '"Tell me why—ain\'t nothin\' but a heartache!" soared to the top of 1999 charts for this five-member Orlando boy band.',
        correctResponse: 'Who are the Backstreet Boys?',
        acceptedKeywords: ['backstreet boys', 'bsb'],
        choices: ['Who are the Backstreet Boys?', 'Who are *NSYNC?', 'Who are 98 Degrees?', 'Who are Boyz II Men?'],
        media: { source: 'wiki', id: 'Backstreet_Boys', caption: 'Backstreet Boys (Millennium era)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Scary, Sporty, Baby, Ginger, and Posh championed "Girl Power" around the globe with their 1996 smash debut "Wannabe."',
        correctResponse: 'Who are the Spice Girls?',
        acceptedKeywords: ['spice girls'],
        choices: ['Who are the Spice Girls?', 'Who are Destiny\'s Child?', 'Who are TLC?', 'Who are En Vogue?'],
        media: { source: 'wiki', id: 'Spice_Girls', caption: 'The Spice Girls (1996)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'T-Boz, Left Eye, and Chilli warned fans "Don\'t Go Chasing Waterfalls" and "No Scrubs" as this record-breaking Atlanta trio.',
        correctResponse: 'Who are TLC?',
        acceptedKeywords: ['tlc'],
        choices: ['Who are TLC?', 'Who are Salt-N-Pepa?', 'Who are SWV?', 'Who are Destiny\'s Child?'],
        media: { source: 'wiki', id: 'TLC_(group)', caption: 'TLC — CrazySexyCool era', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Justin Timberlake, JC Chasez, Joey, Lance, and Chris danced like marionettes and rocked frosted tips in this rival pop group.',
        correctResponse: 'Who are *NSYNC?',
        acceptedKeywords: ['nsync', '*nsync', 'n sync'],
        choices: ['Who are *NSYNC?', 'Who are New Kids on the Block?', 'Who are O-Town?', 'Who are Hanson?'],
        media: { source: 'wiki', id: 'NSYNC', caption: '*NSYNC (1998)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Three young brothers from Tulsa, Oklahoma made the whole world sing "MMMBop" in 1997 with their infectious pop-rock hit.',
        correctResponse: 'Who are Hanson?',
        acceptedKeywords: ['hanson'],
        choices: ['Who are Hanson?', 'Who are Silverchair?', 'Who are Blink-182?', 'Who are The Moffatts?'],
        media: { source: 'wiki', id: 'Hanson_(band)', caption: 'Hanson — Middle of Nowhere (1997)', showOnClue: true },
      },
    ],
  },

  // 12. DOUBLE JEOPARDY — BOOK FAIR & GOOSEBUMPS
  {
    id: 'book_fair_90s',
    title: 'BOOK FAIR & GOOSEBUMPS',
    subtitle: 'Scholastic flyers & bumpy covers',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          '"Reader beware... you\'re in for a scare!" introduced Slappy the Dummy and Monster Blood in this best-selling R.L. Stine series.',
        correctResponse: 'What is Goosebumps?',
        acceptedKeywords: ['goosebumps'],
        choices: ['What is Goosebumps?', 'What is Fear Street?', 'What is Bone Chillers?', 'What is Bailey School Kids?'],
        media: { source: 'wiki', id: 'Goosebumps', caption: 'R.L. Stine\'s Goosebumps (1992)', showOnClue: true },
        video: {
          archiveId: 'videoplayback-3_20260207',
          file: 'videoplayback-3.mp4',
          caption: 'Internet Archive: 90s Goosebumps Pizza Hut Commercial',
          timing: 'with_clue',
        },
      },
      {
        tier: 2,
        prompt:
          'Every glossy paperback cover in this K.A. Applegate sci-fi series showed a teenager mid-transformation into a hawk, tiger, or wolf.',
        correctResponse: 'What is Animorphs?',
        acceptedKeywords: ['animorphs'],
        choices: ['What is Animorphs?', 'What is Goosebumps?', 'What is Redwall?', 'What is Everworld?'],
        media: { source: 'wiki', id: 'Animorphs', caption: 'K.A. Applegate\'s Animorphs (1996)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Stephen Gammell\'s haunting black-and-white charcoal illustrations gave an entire generation nightmares in Alvin Schwartz\'s spooky anthology.',
        correctResponse: 'What is Scary Stories to Tell in the Dark?',
        acceptedKeywords: ['scary stories', 'scary stories to tell in the dark'],
        choices: [
          'What is Scary Stories to Tell in the Dark?',
          'What is In a Dark, Dark Room?',
          'What is Bunnicula?',
          'What is The Witches?',
        ],
        media: { source: 'wiki', id: 'Scary_Stories_to_Tell_in_the_Dark', caption: 'Scary Stories to Tell in the Dark', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Siblings Jack and Annie traveled to the age of dinosaurs and ancient Egypt inside a swirling wooden hideout in this Mary Pope Osborne series.',
        correctResponse: 'What is Magic Tree House?',
        acceptedKeywords: ['magic tree house', 'tree house'],
        choices: [
          'What is Magic Tree House?',
          'What is The Boxcar Children?',
          'What is A to Z Mysteries?',
          'What is The Magic School Bus?',
        ],
        media: { source: 'wiki', id: 'Magic_Tree_House', caption: 'Magic Tree House (1992)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Kids spent hours at the library table hunting crowded illustrated spreads for a bespectacled traveler in a red-and-white striped shirt.',
        correctResponse: 'What is Where\'s Waldo??',
        acceptedKeywords: ['wheres waldo', 'where\'s waldo', 'waldo', 'wally'],
        choices: ['What is Where\'s Waldo??', 'What is I Spy?', 'What is Richard Scarry\'s Busytown?', 'What is Tintin?'],
        media: { source: 'wiki', id: 'Where%27s_Wally%3F', caption: 'Where\'s Waldo? / Wally?', showOnClue: true },
      },
    ],
  },

  // 13. DOUBLE JEOPARDY — ARCADE & PC CLASSICS
  {
    id: 'arcade_pc_classics',
    title: 'ARCADE & PC CLASSICS',
    subtitle: 'Quarters on the bezel & DOS prompts',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Pictured from the Internet Archive, this school computer-lab legend taught kids to ford rivers and fear the dreaded message "You have died of dysentery."',
        correctResponse: 'What is The Oregon Trail?',
        acceptedKeywords: ['oregon trail'],
        choices: [
          'What is The Oregon Trail?',
          'What is Number Munchers?',
          'What is Where in the World Is Carmen Sandiego??',
          'What is SimCity 2000?',
        ],
        media: { source: 'archive', id: 'msdos_Oregon_Trail_The_1990', caption: 'Internet Archive: The Oregon Trail (1990)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          '"Hadouken!" and "Shoryuken!" echoed across mall arcades starting in 1991 thanks to Capcom\'s genre-defining fighting sequel.',
        correctResponse: 'What is Street Fighter II?',
        acceptedKeywords: ['street fighter', 'street fighter 2', 'street fighter ii'],
        choices: ['What is Street Fighter II?', 'What is Tekken?', 'What is Virtua Fighter?', 'What is Fatal Fury?'],
        media: { source: 'wiki', id: 'Street_Fighter_II', caption: 'Capcom Street Fighter II (1991)', showOnClue: true },
        video: {
          archiveId: 'DET-011_105239-106149',
          file: '105239_Street-Fighter-II-Handheld-Game-Commercial-ABC_WXYZ_7_1993-10-16.ia.mp4',
          caption: 'Internet Archive: 1993 Street Fighter II TV Commercial',
          timing: 'before_clue',
          previewSec: 8,
        },
      },
      {
        tier: 3,
        prompt:
          'id Software unleashed shareware mania in December 1993 with this fast-paced first-person shooter starring a lone Space Marine on Phobos.',
        correctResponse: 'What is Doom?',
        acceptedKeywords: ['doom'],
        choices: ['What is Doom?', 'What is Quake?', 'What is Duke Nukem 3D?', 'What is Wolfenstein 3D?'],
        media: { source: 'wiki', id: 'Doom_(1993_video_game)', caption: 'Doom (1993)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Scorpion\'s yell of "Get over here!" and Sub-Zero\'s freeze sparked Senate hearings—and the creation of the ESRB—for this 1992 arcade hit.',
        correctResponse: 'What is Mortal Kombat?',
        acceptedKeywords: ['mortal kombat'],
        choices: ['What is Mortal Kombat?', 'What is Killer Instinct?', 'What is Primal Rage?', 'What is Soulcalibur?'],
        media: { source: 'wiki', id: 'Mortal_Kombat', caption: 'Mortal Kombat (1992)', showOnClue: true },
        video: {
          archiveId: 'mortal-kombat-4-tv-commercial-4-for-play-station-ps-1-1998-720p',
          file: 'Mortal Kombat 4 TV Commercial 4 for PlayStation - PS1 - 1998 - (720p).ia.mp4',
          caption: 'Internet Archive: 1998 Mortal Kombat TV Commercial',
          timing: 'on_reveal',
        },
      },
      {
        tier: 5,
        prompt:
          'Before The Sims, this atmospheric 1993 CD-ROM puzzle adventure stranded players on a mysterious island of linking books and mechanical puzzles.',
        correctResponse: 'What is Myst?',
        acceptedKeywords: ['myst'],
        choices: ['What is Myst?', 'What is The 7th Guest?', 'What is Monkey Island?', 'What is RollerCoaster Tycoon?'],
        media: { source: 'wiki', id: 'Myst', caption: 'Cyan\'s Myst (1993 CD-ROM)', showOnClue: true },
      },
    ],
  },

  // 14. DOUBLE JEOPARDY — 90s TOY BOX LEGENDS
  {
    id: 'toy_box_legends',
    title: '90s TOY BOX LEGENDS',
    subtitle: 'Must-have holiday crazes',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Collectors kept plastic tag protectors on the red heart-shaped Ty swing tags of these understuffed plush animals convinced they\'d pay for college.',
        correctResponse: 'What are Beanie Babies?',
        acceptedKeywords: ['beanie babies', 'beanie baby'],
        choices: ['What are Beanie Babies?', 'What are Pound Puppies?', 'What are Care Bears?', 'What are Cabbage Patch Kids?'],
        media: { source: 'wiki', id: 'Beanie_Babies', caption: 'Ty Beanie Babies (1990s)', showOnClue: true },
        video: {
          archiveId: 'mc-donalds-teenie-beanie-babies-commercial-1997',
          file: "McDonald's - Teenie Beanie Babies Commercial 1997.ia.mp4",
          caption: 'Internet Archive: 1997 Teenie Beanie Babies Commercial',
          timing: 'before_clue',
          previewSec: 8,
        },
      },
      {
        tier: 2,
        prompt:
          'Invented by NASA aerospace engineer Lonnie Johnson, this pressurized water blaster dominated every 1990s backyard summer battle.',
        correctResponse: 'What is the Super Soaker?',
        acceptedKeywords: ['super soaker'],
        choices: ['What is the Super Soaker?', 'What is the Nerf Bow \'n\' Arrow?', 'What is the Slip \'N Slide?', 'What is the Water Weenie?'],
        media: { source: 'wiki', id: 'Super_Soaker', caption: 'Larami Super Soaker', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          '"Twist it! Pull it! Pass it!"—this frantic rhythmic Hasbro audio toy tested kids\' reflexes to an ever-faster drumbeat starting in 1996.',
        correctResponse: 'What is Bop It?',
        acceptedKeywords: ['bop it', 'bop-it'],
        choices: ['What is Bop It?', 'What is Simon?', 'What is Talkboy?', 'What is Yak Bak?'],
        media: { source: 'wiki', id: 'Bop_It', caption: 'Original Bop It (1996)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Speaking "Furbish" out of its faceted collector window box, this wide-eyed Tiger Electronics robotic owl-hamster caused holiday shopping frenzies in 1998.',
        correctResponse: 'What is a Furby?',
        acceptedKeywords: ['furby'],
        choices: ['What is a Furby?', 'What is a Tickle Me Elmo?', 'What is a Poo-Chi?', 'What is a Teddy Ruxpin?'],
        media: { source: 'wiki', id: 'Furby', caption: 'Original 1998–1999 Furby', showOnClue: true },
        video: {
          archiveId: 'mac-do-happy-furby-batman-nx-7-qei-vy-nzk',
          file: 'MacDo Happy Furby Batman [Nx7QeiVyNzk].ia.mp4',
          caption: 'Internet Archive: 1990s Furby TV Commercial',
          timing: 'with_clue',
        },
      },
      {
        tier: 5,
        prompt:
          'Five teen heroes shouted "It\'s Morphin Time!" and combined their Dinozords into this giant robot to battle Rita Repulsa\'s monsters.',
        correctResponse: 'What is the Megazord?',
        acceptedKeywords: ['megazord', 'power rangers', 'dino megazord'],
        choices: ['What is the Megazord?', 'What is Voltron?', 'What is Optimus Prime?', 'What is Gundams?'],
        media: { source: 'wiki', id: 'Mighty_Morphin_Power_Rangers', caption: 'Mighty Morphin Power Rangers (1993)', showOnClue: true },
        video: {
          archiveId: 'ford-commercial',
          file: 'Ford Commercial.mp4',
          caption: 'Internet Archive: 90s Power Rangers Commercial',
          timing: 'on_reveal',
        },
      },
    ],
  },
];
