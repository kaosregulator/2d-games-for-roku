import type { JeopardyCategoryTemplate } from './types';

/**
 * Categories 15–28 of the 28-Category 1990s Nostalgia Vault
 * (Episode 2: 7 Round 1 Categories + 7 Double Jeopardy! Categories)
 */
export const CATEGORIES_PART_2: JeopardyCategoryTemplate[] = [
  // 15. ROUND 1 — CARTOON NETWORK & TOONAMI
  {
    id: 'cn_toonami',
    title: 'CARTOON NETWORK & TOONAMI',
    subtitle: 'After-school animation headquarters',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          '"Omelette du fromage!" and "Dee Dee, get out of my laboratory!" were unforgettable lines from this boy genius\'s hidden bedroom lab.',
        correctResponse: 'What is Dexter\'s Laboratory?',
        acceptedKeywords: ['dexters laboratory', 'dexter\'s laboratory', 'dexter'],
        choices: [
          'What is Dexter\'s Laboratory?',
          'What is Johnny Test?',
          'What is Jimmy Neutron?',
          'What is Ed, Edd n Eddy?',
        ],
        media: { source: 'wiki', id: 'Dexter%27s_Laboratory', caption: 'Dexter\'s Laboratory (1996)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Sugar, spice, everything nice—and an accidental splash of Chemical X—created Blossom, Bubbles, and Buttercup to protect Townsville.',
        correctResponse: 'Who are The Powerpuff Girls?',
        acceptedKeywords: ['powerpuff girls', 'powerpuff'],
        choices: [
          'Who are The Powerpuff Girls?',
          'Who are Totally Spies?',
          'Who are Sailor Scouts?',
          'Who are The Rowdyruff Boys?',
        ],
        media: { source: 'wiki', id: 'The_Powerpuff_Girls', caption: 'The Powerpuff Girls (1998)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Kids sprinted off the school bus to catch Goku powering up for five straight episodes on Toonami in this legendary anime series.',
        correctResponse: 'What is Dragon Ball Z?',
        acceptedKeywords: ['dragon ball z', 'dbz', 'dragonball z'],
        choices: ['What is Dragon Ball Z?', 'What is Gundam Wing?', 'What is Sailor Moon?', 'What is Yu Yu Hakusho?'],
        media: { source: 'wiki', id: 'Dragon_Ball_Z', caption: 'Dragon Ball Z on Toonami', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          '"Whoa, mama!"—this sunglasses-wearing Elvis-voiced musclehead constantly got rejected while flexing his pompadour on Cartoon Network.',
        correctResponse: 'Who is Johnny Bravo?',
        acceptedKeywords: ['johnny bravo'],
        choices: ['Who is Johnny Bravo?', 'Who is Samurai Jack?', 'Who is Space Ghost?', 'Who is Cow & Chicken?'],
        media: { source: 'wiki', id: 'Johnny_Bravo', caption: 'Johnny Bravo (1997)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          '"The things I do for love!"—this terrified pink dog saved Muriel and grumpy Eustace from eerie monsters in the middle of Nowhere, Kansas.',
        correctResponse: 'Who is Courage the Cowardly Dog?',
        acceptedKeywords: ['courage', 'courage the cowardly dog'],
        choices: [
          'Who is Courage the Cowardly Dog?',
          'Who is Scooby-Doo?',
          'Who is Spunky?',
          'Who is Ren Hoek?',
        ],
        media: { source: 'wiki', id: 'Courage_the_Cowardly_Dog', caption: 'Courage the Cowardly Dog (1999)', showOnClue: true },
      },
    ],
  },

  // 16. ROUND 1 — TGIF FRIDAY NIGHTS
  {
    id: 'tgif_fridays',
    title: 'TGIF FRIDAY NIGHTS',
    subtitle: 'ABC\'s 8 PM family lineup',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'On her 16th birthday, she learned she had magical powers and lived with Aunts Hilda, Zelda, and a sarcastic talking black cat named Salem.',
        correctResponse: 'Who is Sabrina the Teenage Witch?',
        acceptedKeywords: ['sabrina', 'sabrina the teenage witch'],
        choices: [
          'Who is Sabrina the Teenage Witch?',
          'Who is Alex Mack?',
          'Who is Buffy Summers?',
          'Who is Blossom Russo?',
        ],
        media: { source: 'wiki', id: 'Sabrina_the_Teenage_Witch_(1996_TV_series)', caption: 'Sabrina the Teenage Witch (1996)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Baby Sinclair whacked his dad Earl with a frying pan shouting "Not the mama!" on this Jim Henson animatronic sitcom.',
        correctResponse: 'What is Dinosaurs?',
        acceptedKeywords: ['dinosaurs'],
        choices: ['What is Dinosaurs?', 'What is ALF?', 'What is Fraggle Rock?', 'What is Third Rock from the Sun?'],
        media: { source: 'wiki', id: 'Dinosaurs_(TV_series)', caption: 'ABC TGIF\'s Dinosaurs (1991)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Patrick Duffy and Suzanne Somers blended two giant families—plus nephew Cody living in a van in the driveway—with a roller-coaster intro.',
        correctResponse: 'What is Step by Step?',
        acceptedKeywords: ['step by step'],
        choices: ['What is Step by Step?', 'What is Full House?', 'What is Growing Pains?', 'What is Who\'s the Boss??'],
        media: { source: 'wiki', id: 'Step_by_Step_(TV_series)', caption: 'Step by Step (1991)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Twin sisters Tia and Tamera Mowry discovered each other at a Detroit department store in the premise of this beloved 1994 comedy.',
        correctResponse: 'What is Sister, Sister?',
        acceptedKeywords: ['sister sister', 'sister, sister'],
        choices: ['What is Sister, Sister?', 'What is Moesha?', 'What is Clueless?', 'What is Two of a Kind?'],
        media: { source: 'wiki', id: 'Sister,_Sister_(TV_series)', caption: 'Sister, Sister (1994)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Comedian Mark Curry played a former NBA player turned Oakland high-school teacher and coach on this swinging TGIF favorite.',
        correctResponse: 'What is Hangin\' with Mr. Cooper?',
        acceptedKeywords: ['hangin with mr cooper', 'mr cooper', 'mr. cooper'],
        choices: [
          'What is Hangin\' with Mr. Cooper?',
          'What is Martin?',
          'What is Living Single?',
          'What is Smart Guy?',
        ],
        media: { source: 'wiki', id: 'Hangin%27_with_Mr._Cooper', caption: 'Hangin\' with Mr. Cooper (1992)', showOnClue: true },
      },
    ],
  },

  // 17. ROUND 1 — 90s HIP-HOP & R&B
  {
    id: 'hiphop_rnb_90s',
    title: '90s HIP-HOP & R&B',
    subtitle: 'Golden age boombox anthems',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Known as 2Pac, he teamed up with Dr. Dre on the West Coast classic "California Love" and released the landmark 1996 album All Eyez on Me.',
        correctResponse: 'Who is Tupac Shakur?',
        acceptedKeywords: ['tupac', '2pac', 'tupac shakur'],
        choices: ['Who is Tupac Shakur?', 'Who is Ice Cube?', 'Who is Snoop Dogg?', 'Who is Nas?'],
        media: { source: 'wiki', id: 'Tupac_Shakur', caption: 'Tupac Shakur', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          '"It was all a dream, I used to read Word Up! magazine" opened the 1994 hit "Juicy" by this Brooklyn legend.',
        correctResponse: 'Who is The Notorious B.I.G.?',
        acceptedKeywords: ['notorious big', 'biggie', 'biggie smalls', 'notorious b.i.g'],
        choices: ['Who is The Notorious B.I.G.?', 'Who is Jay-Z?', 'Who is LL Cool J?', 'Who is Busta Rhymes?'],
        media: { source: 'wiki', id: 'The_Notorious_B.I.G.', caption: 'The Notorious B.I.G.', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'After fronting the Fugees, her 1998 solo masterpiece "The Miseducation of..." swept five Grammy Awards including Album of the Year.',
        correctResponse: 'Who is Lauryn Hill?',
        acceptedKeywords: ['lauryn hill'],
        choices: ['Who is Lauryn Hill?', 'Who is Erykah Badu?', 'Who is Mary J. Blige?', 'Who is Aaliyah?'],
        media: { source: 'wiki', id: 'Lauryn_Hill', caption: 'Lauryn Hill (1998)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Rocking an iconic inflated black patent-leather "trash bag" suit in Hype Williams\' 1997 video for "The Rain (Supa Dupa Fly)," she redefined music videos.',
        correctResponse: 'Who is Missy Elliott?',
        acceptedKeywords: ['missy elliott', 'missy'],
        choices: ['Who is Missy Elliott?', 'Who is Queen Latifah?', 'Who is Lil\' Kim?', 'Who is Eve?'],
        media: { source: 'wiki', id: 'Missy_Elliott', caption: 'Missy Elliott', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Nine emcees from Staten Island—including RZA, Method Man, and Ol\' Dirty Bastard—changed hip-hop forever with "C.R.E.A.M." in 1993.',
        correctResponse: 'Who is the Wu-Tang Clan?',
        acceptedKeywords: ['wu-tang', 'wu tang', 'wu-tang clan'],
        choices: ['Who is the Wu-Tang Clan?', 'Who is A Tribe Called Quest?', 'Who is OutKast?', 'Who is Bone Thugs-n-Harmony?'],
        media: { source: 'wiki', id: 'Wu-Tang_Clan', caption: 'Wu-Tang Clan (1993)', showOnClue: true },
      },
    ],
  },

  // 18. ROUND 1 — COMPUTER LAB 1995
  {
    id: 'computer_lab_95',
    title: 'COMPUTER LAB 1995',
    subtitle: 'Beige towers & ball mice',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Pictured here, this rigid 3.5-inch magnetic square held a whopping 1.44 megabytes and still serves as the universal "Save" icon today.',
        correctResponse: 'What is a Floppy Disk?',
        acceptedKeywords: ['floppy disk', 'floppy', 'diskette'],
        choices: ['What is a Floppy Disk?', 'What is a Zip Disk?', 'What is a MiniDisc?', 'What is a Flash Drive?'],
        media: { source: 'wiki', id: 'Floppy_disk', caption: '3.5-inch 1.44 MB Floppy Disk', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Before Wikipedia existed, students popped in this Microsoft CD-ROM encyclopedia—complete with the castle trivia game MindMaze—to write book reports.',
        correctResponse: 'What is Microsoft Encarta?',
        acceptedKeywords: ['encarta', 'microsoft encarta'],
        choices: ['What is Microsoft Encarta?', 'What is Britannica Online?', 'What is Ask Jeeves?', 'What is World Book?'],
        media: { source: 'wiki', id: 'Encarta', caption: 'Microsoft Encarta CD-ROM', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          '"Oh no!" cried the undo guy whenever you clicked him, and the dynamite stick exploded your whole colorful drawing in this beloved kids\' paint app.',
        correctResponse: 'What is Kid Pix?',
        acceptedKeywords: ['kid pix', 'kidpix'],
        choices: ['What is Kid Pix?', 'What is MS Paint?', 'What is Mario Paint?', 'What is HyperCard?'],
        media: { source: 'wiki', id: 'Kid_Pix', caption: 'Broderbund Kid Pix (1991)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Hands on home row! This famous software instructor taught millions of 1990s kids how to touch-type through windshield-wiper and shark races.',
        correctResponse: 'Who is Mavis Beacon?',
        acceptedKeywords: ['mavis beacon'],
        choices: ['Who is Mavis Beacon?', 'Who is Clippy?', 'Who is Carmen Sandiego?', 'Who is Reader Rabbit?'],
        media: { source: 'wiki', id: 'Mavis_Beacon_Teaches_Typing', caption: 'Mavis Beacon Teaches Typing', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          '"It looks like you\'re writing a letter!" popped up uninvited from this animated, googly-eyed Microsoft Office 97 assistant.',
        correctResponse: 'Who is Clippy?',
        acceptedKeywords: ['clippy', 'clipt', 'office assistant'],
        choices: ['Who is Clippy?', 'Who is BonziBuddy?', 'Who is Rover?', 'Who is Ask Jeeves?'],
        media: { source: 'wiki', id: 'Office_Assistant', caption: 'Microsoft Office 97 Assistant', showOnClue: true },
      },
    ],
  },

  // 19. ROUND 1 — DISNEY AFTERNOON
  {
    id: 'disney_afternoon',
    title: 'DISNEY AFTERNOON',
    subtitle: '3 PM cartoons on local TV',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          '"Life is like a hurricane here in Duckburg!"—Scrooge McDuck dove headfirst into a vault of gold coins with Huey, Dewey, and Louie on this hit.',
        correctResponse: 'What is DuckTales?',
        acceptedKeywords: ['ducktales', 'duck tales'],
        choices: ['What is DuckTales?', 'What is TaleSpin?', 'What is Goof Troop?', 'What is Bonkers?'],
        media: { source: 'wiki', id: 'DuckTales', caption: 'Disney\'s DuckTales', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          '"I am the terror that flaps in the night!" declared Drake Mallard—wearing a purple cape and fedora—as he defended St. Canard.',
        correctResponse: 'Who is Darkwing Duck?',
        acceptedKeywords: ['darkwing duck'],
        choices: ['Who is Darkwing Duck?', 'Who is Gizmoduck?', 'Who is Launchpad McQuack?', 'Who is Mighty Ducks?'],
        media: { source: 'wiki', id: 'Darkwing_Duck', caption: 'Darkwing Duck (1991)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Stone by day, warriors by night! Goliath and his Scottish clan awakened atop a Manhattan skyscraper in this surprisingly dark 1994 series.',
        correctResponse: 'What is Gargoyles?',
        acceptedKeywords: ['gargoyles'],
        choices: ['What is Gargoyles?', 'What is Mighty Max?', 'What is Street Sharks?', 'What is Exosquad?'],
        media: { source: 'wiki', id: 'Gargoyles_(TV_series)', caption: 'Disney\'s Gargoyles (1994)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Chip, Dale, Gadget, Monterey Jack, and Zipper solved miniature crimes for cases too small for the police on this upbeat 1989–1990s favorite.',
        correctResponse: 'What is Chip \'n Dale: Rescue Rangers?',
        acceptedKeywords: ['rescue rangers', 'chip n dale', 'chip and dale'],
        choices: [
          'What is Chip \'n Dale: Rescue Rangers?',
          'What is TaleSpin?',
          'What is Adventures of the Gummi Bears?',
          'What is Aladdin: The Series?',
        ],
        media: { source: 'wiki', id: 'Chip_%27n_Dale:_Rescue_Rangers', caption: 'Chip \'n Dale: Rescue Rangers', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Goofy and his skateboarding son Max lived next door to scheming used-car salesman Pete before road-tripping to a Powerline concert.',
        correctResponse: 'What is Goof Troop?',
        acceptedKeywords: ['goof troop', 'a goofy movie'],
        choices: ['What is Goof Troop?', 'What is Quack Pack?', 'What is Recess?', 'What is Pepper Ann?'],
        media: { source: 'wiki', id: 'Goof_Troop', caption: 'Goof Troop (1992)', showOnClue: true },
      },
    ],
  },

  // 20. ROUND 1 — 90s MALL & ARCADE HANGOUTS
  {
    id: 'mall_hangouts_90s',
    title: '90s MALL & ARCADE HANGOUTS',
    subtitle: 'Drop us off at the food court',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Walking its blue-and-yellow aisles on Friday night hoping the new release wasn\'t out of stock was a weekly ritual at this video rental giant.',
        correctResponse: 'What is Blockbuster Video?',
        acceptedKeywords: ['blockbuster', 'blockbuster video'],
        choices: ['What is Blockbuster Video?', 'What is Hollywood Video?', 'What is Suncoast?', 'What is Tower Records?'],
        media: { source: 'wiki', id: 'Blockbuster_LLC', caption: 'Blockbuster Video (Blue & Yellow)', showOnClue: true },
        video: {
          archiveId: 'blockbuster-video-commercial-1980s-b',
          file: "Blockbuster Video Commercial 1980's b.ia.mp4",
          caption: 'Internet Archive: Classic Blockbuster Video Commercial',
          timing: 'before_clue',
          previewSec: 8,
        },
      },
      {
        tier: 2,
        prompt:
          'Kids plugged headphones into listening booths to preview $17.99 compact discs inside this iconic mall music store chain.',
        correctResponse: 'What is Sam Goody?',
        acceptedKeywords: ['sam goody', 'fye', 'tower records'],
        choices: ['What is Sam Goody?', 'What is Circuit City?', 'What is Borders?', 'What is Kay-Bee Toys?'],
        media: { source: 'wiki', id: 'Sam_Goody', caption: 'Sam Goody Mall Music Store', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Where "a kid can be a kid"—you fed brass tokens into Skee-Ball machines to win 800 paper tickets just to afford one plastic spider ring.',
        correctResponse: 'What is Chuck E. Cheese?',
        acceptedKeywords: ['chuck e cheese', 'chuck e. cheese'],
        choices: ['What is Chuck E. Cheese?', 'What is Discovery Zone?', 'What is Dave & Buster\'s?', 'What is ShowBiz Pizza?'],
        media: { source: 'wiki', id: 'Chuck_E._Cheese', caption: 'Chuck E. Cheese Tokens & Arcade', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'If you needed AA batteries, an RF modulator for your Sega, or a new RC car, every 1990s mall had this electronics chain with red lettering.',
        correctResponse: 'What is RadioShack?',
        acceptedKeywords: ['radioshack', 'radio shack'],
        choices: ['What is RadioShack?', 'What is CompUSA?', 'What is Best Buy?', 'What is Circuit City?'],
        media: { source: 'wiki', id: 'RadioShack', caption: 'RadioShack Electronics', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Packed from floor to ceiling with action figures and buzzing robotic dogs by the entrance, this mall toy chain bore two bold red initials.',
        correctResponse: 'What is KB Toys?',
        acceptedKeywords: ['kb toys', 'kay-bee', 'kay bee'],
        choices: ['What is KB Toys?', 'What is Toys "R" Us?', 'What is FAO Schwarz?', 'What is Zany Brainy?'],
        media: { source: 'wiki', id: 'KB_Toys', caption: 'KB Toys Mall Entrance', showOnClue: true },
      },
    ],
  },

  // 21. ROUND 1 — 90s SPORTS HEROES
  {
    id: 'sports_heroes_90s',
    title: '90s SPORTS HEROES',
    subtitle: 'Wheatjes boxes & Starter jackets',
    preferredRound: 'jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Wearing #23 for the Chicago Bulls, he led two separate NBA three-peats in the 1990s and inspired the "Be Like Mike" Gatorade jingle.',
        correctResponse: 'Who is Michael Jordan?',
        acceptedKeywords: ['michael jordan', 'jordan'],
        choices: ['Who is Michael Jordan?', 'Who is Scottie Pippen?', 'Who is Shaquille O\'Neal?', 'Who is Kobe Bryant?'],
        media: { source: 'wiki', id: 'Michael_Jordan', caption: 'Michael Jordan (#23)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Famous for his backward cap and sweetest left-handed swing in baseball, "The Kid" starred for the Seattle Mariners and his own SNES & N64 games.',
        correctResponse: 'Who is Ken Griffey Jr.?',
        acceptedKeywords: ['ken griffey', 'griffey'],
        choices: ['Who is Ken Griffey Jr.?', 'Who is Derek Jeter?', 'Who is Cal Ripken Jr.?', 'Who is Sammy Sosa?'],
        media: { source: 'wiki', id: 'Ken_Griffey_Jr.', caption: 'Ken Griffey Jr.', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'After landing the first-ever 900 spin at the 1999 X Games, this skateboarding legend launched the biggest extreme-sports video game franchise ever.',
        correctResponse: 'Who is Tony Hawk?',
        acceptedKeywords: ['tony hawk'],
        choices: ['Who is Tony Hawk?', 'Who is Rodney Mullen?', 'Who is Mat Hoffman?', 'Who is Shaun White?'],
        media: { source: 'wiki', id: 'Tony_Hawk', caption: 'Tony Hawk (1999 X Games 900)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Wearing #9 for the U.S. Women\'s National Team, this soccer superstar helped spark nationwide soccer fever during the 1999 World Cup triumph.',
        correctResponse: 'Who is Mia Hamm?',
        acceptedKeywords: ['mia hamm'],
        choices: ['Who is Mia Hamm?', 'Who is Brandi Chastain?', 'Who is Abby Wambach?', 'Who is Kristine Lilly?'],
        media: { source: 'wiki', id: 'Mia_Hamm', caption: 'Mia Hamm (1999 World Cup)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'The 1992 U.S. Olympic men\'s basketball squad featuring Jordan, Magic Johnson, and Larry Bird in Barcelona earned this legendary nickname.',
        correctResponse: 'What is the Dream Team?',
        acceptedKeywords: ['dream team'],
        choices: ['What is the Dream Team?', 'What is the Fab Five?', 'What is the Redeem Team?', 'What is the Showtime Squad?'],
        media: { source: 'wiki', id: '1992_United_States_men%27s_Olympic_basketball_team', caption: '1992 Barcelona Dream Team', showOnClue: true },
      },
    ],
  },

  // ================= DOUBLE JEOPARDY! ($400–$2,000) — EPISODE 2 =================

  // 22. DOUBLE JEOPARDY — MTV & MUSIC VIDEOS
  {
    id: 'mtv_music_videos',
    title: 'MTV & MUSIC VIDEOS',
    subtitle: 'When music TV played music',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Hosted by Carson Daly overlooking Times Square in 1998, screaming fans held cardboard signs outside for this daily top-10 video countdown.',
        correctResponse: 'What is Total Request Live (TRL)?',
        acceptedKeywords: ['trl', 'total request live'],
        choices: [
          'What is Total Request Live (TRL)?',
          'What is 120 Minutes?',
          'What is Yo! MTV Raps?',
          'What is Headbangers Ball?',
        ],
        media: { source: 'wiki', id: 'Total_Request_Live', caption: 'MTV\'s TRL Times Square Studio', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Set inside a dimly lit high-school pep rally with anarchy-logo cheerleaders, this 1991 Nirvana video kicked off the grunge explosion.',
        correctResponse: 'What is "Smells Like Teen Spirit"?',
        acceptedKeywords: ['smells like teen spirit', 'teen spirit'],
        choices: [
          'What is "Smells Like Teen Spirit"?',
          'What is "Come as You Are"?',
          'What is "Black Hole Sun"?',
          'What is "Jeremy"?',
        ],
        media: { source: 'wiki', id: 'Nirvana_(band)', caption: 'Nirvana (1991)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Mike Judge\'s couch-potato metalhead duo critiqued music videos between laughs of "Heh-heh" on this irreverent 1993 MTV cartoon.',
        correctResponse: 'Who are Beavis and Butt-Head?',
        acceptedKeywords: ['beavis and butt-head', 'beavis and butthead', 'beavis'],
        choices: [
          'Who are Beavis and Butt-Head?',
          'Who are Ren & Stimpy?',
          'Who are Daria & Jane?',
          'Who are Bill & Ted?',
        ],
        media: { source: 'wiki', id: 'Beavis_and_Butt-Head', caption: 'Beavis and Butt-Head (1993)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'VH1 turned music videos into addictive trivia marathons by making little cartoon "bloop!" fact bubbles appear onscreen during this 1997 show.',
        correctResponse: 'What is Pop-Up Video?',
        acceptedKeywords: ['pop-up video', 'pop up video'],
        choices: ['What is Pop-Up Video?', 'What is Behind the Music?', 'What is Making the Video?', 'What is MTV Cribs?'],
        media: { source: 'wiki', id: 'Pop-Up_Video', caption: 'VH1 Pop-Up Video (1997)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Stripping away electric amps for acoustic guitars and candlelight, Nirvana, Eric Clapton, and Pearl Jam gave iconic performances on this MTV series.',
        correctResponse: 'What is MTV Unplugged?',
        acceptedKeywords: ['mtv unplugged', 'unplugged'],
        choices: ['What is MTV Unplugged?', 'What is MTV Spring Break?', 'What is Storytellers?', 'What is Live Aid?'],
        media: { source: 'wiki', id: 'MTV_Unplugged', caption: 'MTV Unplugged Acoustic Sessions', showOnClue: true },
      },
    ],
  },

  // 23. DOUBLE JEOPARDY — 90s SCI-FI & SCIENCE TV
  {
    id: 'scifi_science_90s',
    title: '90s SCI-FI & SCIENCE TV',
    subtitle: 'The truth is out there (and in class)',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          '"Inertia is a property of matter!"—hearing the TV cart roll into science class meant cheering along to this bow-tie-wearing educator.',
        correctResponse: 'Who is Bill Nye the Science Guy?',
        acceptedKeywords: ['bill nye', 'science guy'],
        choices: [
          'Who is Bill Nye the Science Guy?',
          'Who is Beakman?',
          'Who is Mr. Wizard?',
          'Who is Carl Sagan?',
        ],
        media: { source: 'wiki', id: 'Bill_Nye', caption: 'Bill Nye the Science Guy', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'FBI agents Fox Mulder and Dana Scully investigated UFOs and paranormal cases under the tagline "The Truth Is Out There" on this 1993 hit.',
        correctResponse: 'What is The X-Files?',
        acceptedKeywords: ['x-files', 'the x-files', 'x files'],
        choices: ['What is The X-Files?', 'What is Twin Peaks?', 'What is Sliders?', 'What is Roswell?'],
        media: { source: 'wiki', id: 'The_X-Files', caption: 'The X-Files (1993)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Sarah Michelle Gellar balanced Sunnydale High homework with staking vampires alongside Willow, Xander, and librarian Giles on this 1997 show.',
        correctResponse: 'What is Buffy the Vampire Slayer?',
        acceptedKeywords: ['buffy', 'buffy the vampire slayer'],
        choices: [
          'What is Buffy the Vampire Slayer?',
          'What is Charmed?',
          'What is Angel?',
          'What is Dawson\'s Creek?',
        ],
        media: { source: 'wiki', id: 'Buffy_the_Vampire_Slayer', caption: 'Buffy the Vampire Slayer (1997)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          '"Butterfly in the sky, I can go twice as high!"—LeVar Burton told kids "you don\'t have to take my word for it" on this beloved PBS show.',
        correctResponse: 'What is Reading Rainbow?',
        acceptedKeywords: ['reading rainbow'],
        choices: ['What is Reading Rainbow?', 'What is Wishbone?', 'What is Between the Lions?', 'What is Zoom?'],
        media: { source: 'wiki', id: 'Reading_Rainbow', caption: 'LeVar Burton\'s Reading Rainbow', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'A clever Jack Russell Terrier imagined himself as Robin Hood, Odysseus, and Sherlock Holmes to teach classic literature on this 1995 PBS series.',
        correctResponse: 'What is Wishbone?',
        acceptedKeywords: ['wishbone'],
        choices: ['What is Wishbone?', 'What is Clifford?', 'What is Arthur?', 'What is Zoboomafoo?'],
        media: { source: 'wiki', id: 'Wishbone_(TV_series)', caption: 'PBS\'s Wishbone (1995)', showOnClue: true },
      },
    ],
  },

  // 24. DOUBLE JEOPARDY — POKÉMANIA 1998
  {
    id: 'pokemania_98',
    title: 'POKÉMANIA 1998',
    subtitle: 'Link cables & shiny cardboard',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Refusing to stay inside its Poké Ball, this electric yellow mouse became Ash Ketchum\'s loyal partner and the mascot of a global phenomenon.',
        correctResponse: 'Who is Pikachu?',
        acceptedKeywords: ['pikachu'],
        choices: ['Who is Pikachu?', 'Who is Raichu?', 'Who is Eevee?', 'Who is Jigglypuff?'],
        media: { source: 'wiki', id: 'Pikachu', caption: 'Pikachu (#025)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Launched in North America in September 1998 for Game Boy, kids needed a Game Link Cable to trade exclusives between these two color editions.',
        correctResponse: 'What are Pokémon Red and Blue?',
        acceptedKeywords: ['red and blue', 'pokemon red', 'red & blue'],
        choices: [
          'What are Pokémon Red and Blue?',
          'What are Pokémon Gold and Silver?',
          'What are Pokémon Ruby and Sapphire?',
          'What are Pokémon FireRed and LeafGreen?',
        ],
        media: { source: 'wiki', id: 'Pok%C3%A9mon_Red,_Blue,_and_Yellow', caption: 'Pokémon Red & Blue (1998)', showOnClue: true },
        video: {
          archiveId: 'rare-first-pokemon-red-and-green-japanese-commercial-ever',
          file: 'RARE first Pokémon Red and Green Japanese commercial EVER HD-z4JeRKo3Rr4.mp4',
          caption: 'Internet Archive: First Pokémon Red & Green Commercial',
          timing: 'before_clue',
          previewSec: 8,
        },
      },
      {
        tier: 3,
        prompt:
          'Pulling the Base Set holographic card of this fire-breathing dragon—dealing a massive 100 Fire Spin damage—made you an instant schoolyard legend.',
        correctResponse: 'Who is Charizard?',
        acceptedKeywords: ['charizard'],
        choices: ['Who is Charizard?', 'Who is Blastoise?', 'Who is Venusaur?', 'Who is Mewtwo?'],
        media: { source: 'wiki', id: 'Charizard', caption: 'Base Set Holographic Charizard', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Professor Oak asked every 10-year-old trainer leaving Pallet Town to pick from Bulbasaur, Squirtle, or this flame-tailed lizard.',
        correctResponse: 'Who is Charmander?',
        acceptedKeywords: ['charmander'],
        choices: ['Who is Charmander?', 'Who is Cyndaquil?', 'Who is Vulpix?', 'Who is Growlithe?'],
        media: { source: 'wiki', id: 'Pok%C3%A9mon', caption: 'Pokémon Franchise (1996–1999)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Surfing along the eastern shore of Cinnabar Island triggered this famous garbled-pixel glitch Pokémon that duplicated your 6th bag item 128 times.',
        correctResponse: 'What is MissingNo.?',
        acceptedKeywords: ['missingno', 'missing no'],
        choices: ['What is MissingNo.?', 'What is Mew?', 'What is Porygon?', 'What is Ditto?'],
        media: { source: 'wiki', id: 'MissingNo.', caption: 'Infamous Cinnabar Island Glitch', showOnClue: true },
      },
    ],
  },

  // 25. DOUBLE JEOPARDY — 90s SKATE, BIKE & EXTREME
  {
    id: 'skate_extreme_90s',
    title: '90s SKATE, BIKE & EXTREME',
    subtitle: 'Sidewalks, ramps & baggy denim',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Replacing old four-corner roller skates with a single sleek line of urethane wheels, this brand name became the verb for 1990s inline skating.',
        correctResponse: 'What are Rollerblades?',
        acceptedKeywords: ['rollerblades', 'rollerblade', 'inline skates'],
        choices: ['What are Rollerblades?', 'What are Heelys?', 'What are Soap Shoes?', 'What are Moon Shoes?'],
        media: { source: 'wiki', id: 'Inline_skates', caption: '1990s Inline Rollerblades', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'First held in Rhode Island in 1995 by ESPN as the "Extreme Games," this annual showcase crowned champions in vert skating, BMX, and street luge.',
        correctResponse: 'What are the X Games?',
        acceptedKeywords: ['x games', 'x-games'],
        choices: ['What are the X Games?', 'What is the Dew Tour?', 'What is Gravity Games?', 'What is Warped Tour?'],
        media: { source: 'wiki', id: 'X_Games', caption: 'ESPN X Games (1995)', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Kids flipped these miniature plastic fingerboards across cafeteria tables and textbooks using tiny screwdrivers and grip tape.',
        correctResponse: 'What are Tech Decks?',
        acceptedKeywords: ['tech deck', 'tech decks', 'fingerboard'],
        choices: ['What are Tech Decks?', 'What are Hot Wheels?', 'What are Micro Machines?', 'What are Mighty Beanz?'],
        media: { source: 'wiki', id: 'Fingerboard_(skateboard)', caption: 'Miniature Fingerboard / Tech Deck', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'With leg openings wide enough to swallow your sneakers whole, these ultra-baggy skate jeans featured embroidered crowns and gigantic back pockets.',
        correctResponse: 'What are JNCO Jeans?',
        acceptedKeywords: ['jnco', 'jnco jeans'],
        choices: ['What are JNCO Jeans?', 'What are Girbaud Jeans?', 'What are Z. Cavariccis?', 'What are Starter Pants?'],
        media: { source: 'wiki', id: 'JNCO', caption: '1990s Wide-Leg Skate Denim', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Equipped with metal axle pegs so your friend could stand on the back, brands like Mongoose and GT ruled driveways with this stunt bicycle style.',
        correctResponse: 'What is a BMX bike?',
        acceptedKeywords: ['bmx', 'bmx bike'],
        choices: ['What is a BMX bike?', 'What is a Schwinn Sting-Ray?', 'What is a Fixie?', 'What is a Cruiser?'],
        media: { source: 'wiki', id: 'BMX_bike', caption: 'Classic 1990s BMX Stunt Bike', showOnClue: true },
      },
    ],
  },

  // 26. DOUBLE JEOPARDY — VHS & HOME ENTERTAINMENT
  {
    id: 'vhs_home_ent',
    title: 'VHS & HOME ENTERTAINMENT',
    subtitle: 'Anti-skip protection & mixtapes',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Holding it perfectly level on the school bus so your CD wouldn\'t stutter was an art form before Sony added 10-second Electronic Shock Protection to this player.',
        correctResponse: 'What is a Discman?',
        acceptedKeywords: ['discman', 'cd player', 'portable cd'],
        choices: ['What is a Discman?', 'What is a Walkman?', 'What is a MiniDisc?', 'What is a Zune?'],
        media: { source: 'wiki', id: 'Discman', caption: 'Sony Discman Portable CD Player', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'Kids waited by the radio with their finger hovering over Record + Play on this dual-deck portable stereo to tape their favorite song before the DJ talked.',
        correctResponse: 'What is a Boombox?',
        acceptedKeywords: ['boombox', 'ghetto blaster', 'cassette deck'],
        choices: ['What is a Boombox?', 'What is a Hi-Fi Turntable?', 'What is a Clock Radio?', 'What is a Talkboy?'],
        media: { source: 'wiki', id: 'Boombox', caption: 'Classic 90s Dual-Cassette Boombox', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'When a VHS tape got wavy static lines across the picture, you frantically tapped this two-button VCR control until the movie cleared up.',
        correctResponse: 'What is Tracking?',
        acceptedKeywords: ['tracking', 'vcr tracking'],
        choices: ['What is Tracking?', 'What is Degaussing?', 'What is Aspect Ratio?', 'What is Sharpness?'],
        media: { source: 'wiki', id: 'Videocassette_recorder', caption: '1990s VCR Front Panel', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Puffy white plastic clamshell cases with a small shiny emblem on the spine held Aladdin, Beauty and the Beast, and The Lion King in this Disney VHS line.',
        correctResponse: 'What is the Black Diamond / Masterpiece Collection?',
        acceptedKeywords: ['black diamond', 'masterpiece', 'disney classics', 'clamshell'],
        choices: [
          'What is the Black Diamond / Masterpiece Collection?',
          'What is the Criterion Collection?',
          'What is the Gold Label Vault?',
          'What is the LaserDisc Archive?',
        ],
        media: { source: 'wiki', id: 'Walt_Disney_Classics', caption: 'Disney Clamshell VHS Editions', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Before playlists went digital, you popped a tiny pencil into the sprockets of this magnetic ribbon cartridge whenever the player "ate" it.',
        correctResponse: 'What is a Cassette Tape?',
        acceptedKeywords: ['cassette', 'cassette tape', 'audio tape'],
        choices: ['What is a Cassette Tape?', 'What is an 8-Track?', 'What is a Betamax?', 'What is a MiniDV?'],
        media: { source: 'wiki', id: 'Cassette_tape', caption: 'Compact Audio Cassette', showOnClue: true },
      },
    ],
  },

  // 27. DOUBLE JEOPARDY — 90s PHRASES WE ALL SAID
  {
    id: 'phrases_90s',
    title: '90s PHRASES WE ALL SAID',
    subtitle: 'Playground slang dictionary',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Alicia Silverstone\'s Cher Horowitz delivered this two-word sarcastic brush-off in the 1995 teen comedy Clueless.',
        correctResponse: 'What is "As if!"?',
        acceptedKeywords: ['as if'],
        choices: ['What is "As if!"?', 'What is "Whatever!"?', 'What is "No duh!"?', 'What is "Eat my shorts!"?'],
        media: { source: 'wiki', id: 'Clueless', caption: 'Clueless (1995)', showOnClue: true },
      },
      {
        tier: 2,
        prompt:
          'You held your palm right up in front of someone\'s face while declaring this sassy dismissal—"...\'cause the face ain\'t listening!"',
        correctResponse: 'What is "Talk to the hand"?',
        acceptedKeywords: ['talk to the hand'],
        choices: [
          'What is "Talk to the hand"?',
          'What is "Take a chill pill"?',
          'What is "Not!"?',
          'What is "Get a clue"?',
        ],
        media: { source: 'wiki', id: 'Talk_to_the_hand', caption: 'Classic 1990s Slang Gesture', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Beloved ESPN SportsCenter anchor Stuart Scott popularized this jubilant celebratory exclamation during 1990s highlight reels.',
        correctResponse: 'What is "Booyah!"?',
        acceptedKeywords: ['booyah', 'boo-yah'],
        choices: ['What is "Booyah!"?', 'What is "Cowabunga!"?', 'What is "Bam!"?', 'What is "Woohoo!"?'],
        media: { source: 'wiki', id: 'Stuart_Scott', caption: 'ESPN SportsCenter\'s Stuart Scott', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'When someone thought they were super cool, 90s kids teased that they thought they were "all that" plus this crunchy side item.',
        correctResponse: 'What is "and a bag of chips"?',
        acceptedKeywords: ['bag of chips', 'all that and a bag of chips'],
        choices: [
          'What is "and a bag of chips"?',
          'What is "and a slice of pizza"?',
          'What is "and a juice box"?',
          'What is "and a cherry on top"?',
        ],
        media: { source: 'wiki', id: 'Potato_chip', caption: 'All That and a Bag of Chips', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Right after tricking a friend into believing something ridiculous—or faking a high-five—you yelled this one-word punchline.',
        correctResponse: 'What is "Psych!"?',
        acceptedKeywords: ['psych', 'sike'],
        choices: ['What is "Psych!"?', 'What is "Busted!"?', 'What is "Bogus!"?', 'What is "Radical!"?'],
        media: { source: 'wiki', id: 'Wayne%27s_World_(film)', caption: '1990s Slang ("Psych!" & "Not!")', showOnClue: true },
      },
    ],
  },

  // 28. DOUBLE JEOPARDY — Y2K & TURN OF THE MILLENNIUM
  {
    id: 'y2k_millennium',
    title: 'Y2K & TURN OF THE MILLENNIUM',
    subtitle: 'Party like it\'s 1999',
    preferredRound: 'double_jeopardy',
    clues: [
      {
        tier: 1,
        prompt:
          'Seen here in its famous translucent Bondi Blue shell, Apple\'s 1998 all-in-one desktop ditched the floppy drive and made computers colorful.',
        correctResponse: 'What is the iMac G3?',
        acceptedKeywords: ['imac', 'imac g3'],
        choices: ['What is the iMac G3?', 'What is the Power Mac?', 'What is the eMate?', 'What is the Compaq Presario?'],
        media: { source: 'wiki', id: 'IMac_G3', caption: 'Apple Bondi Blue iMac G3 (1998)', showOnClue: true },
        video: {
          archiveId: 'PubblicitItalianaComputerAppleIMac1998',
          file: '[Pubblicità_Italiana]_Computer_Apple_iMac_(1998).mp4',
          caption: 'Internet Archive: 1998 Apple iMac G3 Commercial',
          timing: 'with_clue',
        },
      },
      {
        tier: 2,
        prompt:
          'Programmers raced to fix two-digit year fields before midnight on December 31, 1999 to stop this feared global computer meltdown.',
        correctResponse: 'What is the Y2K Bug?',
        acceptedKeywords: ['y2k', 'y2k bug', 'millennium bug'],
        choices: ['What is the Y2K Bug?', 'What is the Melissa Virus?', 'What is Skynet?', 'What is the Dot-Com Crash?'],
        media: { source: 'wiki', id: 'Year_2000_problem', caption: 'Year 2000 (Y2K) Countdown', showOnClue: true },
      },
      {
        tier: 3,
        prompt:
          'Keanu Reeves leaned backward in slow-motion "Bullet Time" as Neo chose the red pill in this mind-bending March 1999 sci-fi classic.',
        correctResponse: 'What is The Matrix?',
        acceptedKeywords: ['matrix', 'the matrix'],
        choices: ['What is The Matrix?', 'What is Dark City?', 'What is Men in Black?', 'What is The Fifth Element?'],
        media: { source: 'wiki', id: 'The_Matrix', caption: 'The Matrix (1999)', showOnClue: true },
      },
      {
        tier: 4,
        prompt:
          'Launched by college student Shawn Fanning in June 1999 with a headphone-wearing cat logo, it let kids wait 45 minutes to download one MP3.',
        correctResponse: 'What is Napster?',
        acceptedKeywords: ['napster'],
        choices: ['What is Napster?', 'What is LimeWire?', 'What is Winamp?', 'What is Kazaa?'],
        media: { source: 'wiki', id: 'Napster', caption: 'Napster Peer-to-Peer MP3 (1999)', showOnClue: true },
      },
      {
        tier: 5,
        prompt:
          'Before iTunes, every PC music fan customized neon skins on this sleek 1997 MP3 player that famously "really whips the llama\'s ass!"',
        correctResponse: 'What is Winamp?',
        acceptedKeywords: ['winamp'],
        choices: ['What is Winamp?', 'What is RealPlayer?', 'What is QuickTime?', 'What is Windows Media Player?'],
        media: { source: 'wiki', id: 'Winamp', caption: 'Nullsoft Winamp (1997)', showOnClue: true },
      },
    ],
  },
];
