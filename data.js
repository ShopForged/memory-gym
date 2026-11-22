'use strict';
// Static content for Memory Gym. All plain data — edit freely.

const WORDS = `anchor apple arrow axe backpack balloon banana barrel basket bathtub battery beard bell bicycle blanket boat bone book boot bottle bowl bracelet bread brick bridge broom bucket butterfly cactus cake camel camera candle cannon canoe carrot castle cat chain chair cheese cherry chimney clock cloud coconut coffin compass cookie crab crown crystal cup curtain dagger desk diamond dice dinosaur doll dolphin donkey door dragon drum duck eagle egg elephant envelope feather fence fire fish flag flashlight flute fork fountain fox frog ghost giraffe glove goat guitar hammer hammock harp hat helicopter helmet honey horse hose iceberg igloo jacket jellyfish kangaroo kettle key kite knife ladder lamp lemon lightning lion lobster lock magnet map mask mirror monkey moon motorcycle mushroom necklace needle nest octopus onion owl paintbrush pancake parachute parrot peanut pear pencil penguin piano pillow pineapple pirate pizza plane pumpkin puppet pyramid rabbit radio rainbow rake robot rocket rope saddle sandwich saw scarf scissors shark shell shovel skateboard skeleton skull snail snake snowman sock sofa spider sponge spoon squirrel stamp statue strawberry submarine suitcase sunflower sword table telescope tent tiger toaster tomato toothbrush tornado tractor train trophy trumpet turtle umbrella unicorn vampire violin volcano wagon wallet watermelon whale wheel whistle windmill wizard wolf zebra zipper`.split(' ');

const FIRST = `Aaron Abby Adrian Aisha Alan Alma Amir Ana Andre Bella Ben Bianca Boris Brooke Caleb Camila Carlos Chloe Clara Colin Dana Dante Diego Dina Eli Elena Emma Ethan Farah Felix Fiona Gabe Gina Grant Hana Hector Iris Ivan Jade Jamal Jen Joel Julia Kai Kara Kevin Kira Leo Lena Liam Lucia Luis Maya Mei Milo Nadia Nate Nina Noah Omar Owen Paige Priya Quinn Rafael Rosa Ruby Ryan Sam Sara Sean Sofia Tara Theo Tina Uma Victor Vera Wade Wendy Xavier Yara Yusuf Zane Zoe`.split(' ');
const LAST = `Adams Alvarez Baker Bennett Brooks Campbell Chen Clarke Cohen Cruz Dixon Duarte Ellis Evans Fischer Flores Foster Garcia Gray Hale Hayes Hughes Ito Jensen Kaur Keller Khan Kim Lambert Larsen Lopez Mason Meyer Miller Moreno Nakamura Nash Novak Okafor Olsen Ortiz Park Patel Perez Price Quinn Ramos Reed Reyes Rossi Russo Santos Schmidt Shah Silva Stone Sullivan Tanaka Torres Turner Vargas Walsh Ward Weber Wong Young Zhang`.split(' ');

// Default Major System images, 00–99. Every one is editable in the app.
const MAJOR = Object.fromEntries(`sauce suit sun sumo sewer seal sash sock sofa soap
toes tattoo tuna dome tire towel dish duck dove tub
nose net nun gnome winner nail nacho neck knife knob
moose mat moon mummy mower mule match mug movie map
rose rat rain ram rower roll roach rock roof rope
lace light lion lime lure lily leash lock leaf lip
cheese sheet chain jam chair jail judge chalk chef ship
goose cat coin comb car coal cage cake cave cap
vase foot fan foam fire file fish fog fife fob
bus bat bone puma bear bell beach bike beef pipe`.split(/\s+/).map((w, i) => [String(i).padStart(2, '0'), w]));

const MAJOR_KEY = [
  ['0', 's, z, soft c', 'zero starts with z'],
  ['1', 't, d, th', 't has one downstroke'],
  ['2', 'n', 'n has two downstrokes'],
  ['3', 'm', 'm has three downstrokes'],
  ['4', 'r', 'four ends in r'],
  ['5', 'l', 'L is the Roman 50; five fingers make an L'],
  ['6', 'j, sh, ch, soft g', 'a j flipped looks like 6'],
  ['7', 'k, hard g, hard c', 'two 7s make a K'],
  ['8', 'f, v', 'a cursive f looks like 8'],
  ['9', 'p, b', 'p is 9 mirrored'],
];

const SAMPLE_PALACE = {
  id: 'home',
  name: 'My home (sample — edit me)',
  loci: ['Front door', 'Doormat', 'Coat hook', 'Couch', 'TV', 'Coffee table', 'Kitchen sink', 'Fridge', 'Stove', 'Microwave', 'Dining table', 'Bathroom door', 'Mirror', 'Shower', 'Toilet', 'Bed', 'Nightstand', 'Closet', 'Desk', 'Window'],
};

const LESSONS = [
  {
    id: 'principles', title: 'How memory techniques work', mins: 3,
    html: `<p>Your brain is bad at storing abstract things (digits, names, lists) and excellent at storing <b>vivid images in places</b>. Every technique here does the same job: turn abstract information into a picture, then put the picture somewhere you can find it again.</p>
<p>Three things make an image stick:</p>
<ul><li><b>Exaggeration</b>: giant, tiny, a thousand copies.</li><li><b>Action</b>: the object is <i>doing</i> something: exploding, melting, attacking.</li><li><b>Senses and emotion</b>: smell it, hear it, make it funny or gross.</li></ul>
<p>Bland images fade. "A key on the couch" fades. "A key the size of a surfboard stabbing through the couch, spraying stuffing everywhere" sticks.</p>`
  },
  {
    id: 'palace', title: 'The memory palace (method of loci)', mins: 4,
    html: `<p>Pick a place you know well, like your home, and choose a fixed route through it with distinct stops (<b>loci</b>): front door → doormat → coat hook → couch… Always walk the same direction.</p>
<p>To memorize a list, put one vivid image at each stop. To recall, walk the route in your mind and "see" what's there. The route gives you the order for free.</p>
<ol><li>Build your route in <a href="#palaces">Palaces</a>. Start with 10–20 loci.</li><li>Practise walking it until you can list the loci forwards <i>and</i> backwards.</li><li>Use it in the <a href="#words">Words</a> trainer: choose your palace and each word gets a locus.</li></ol>
<p>Tip: make several palaces (home, work, a friend's house, your commute). Reuse a palace once old images have faded, usually after a day or two.</p>`
  },
  {
    id: 'major', title: 'The Major System for numbers', mins: 5,
    html: `<p>Each digit maps to consonant sounds. Vowels and w, h, y are free fillers. So 32 = m-n = <b>moon</b>, and 71 = k-t = <b>cat</b>.</p>
<div class="scroll"><table class="key"><thead><tr><th>Digit</th><th>Sounds</th><th>Hook</th></tr></thead><tbody>${MAJOR_KEY.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
<p>It's about <i>sounds</i>, not spelling: "phone" is f-n = 82.</p>
<p>The power move is to <b>fix one image per two-digit number</b> (00–99) and drill them until they're instant. Then any number is a string of images: 3271 = moon + cat = a cat howling at a giant moon. A default list is preloaded; change any image to one that clicks for you in <a href="#major">Major System</a>.</p>`
  },
  {
    id: 'cards', title: 'Memorizing a deck of cards', mins: 3,
    html: `<p>Give each of the 52 cards a fixed image, then store two cards per locus in a palace.</p>
<p>A simple way in: use the suit letter plus the value through the Major System. Spades = s, Hearts = h, Diamonds = d, Clubs = c. Then K♥ and 7♠ become whatever images you assign. Many people use people for court cards (a king you know, a queen, etc.).</p>
<p>Start with 13 cards (one suit's worth of random cards), then 26, then the full deck. Speed comes from the images being automatic, not from rushing.</p>`
  },
  {
    id: 'names', title: 'Names and faces', mins: 3,
    html: `<ol><li><b>Pay attention</b>: most "forgotten" names were never heard properly. Repeat it back.</li><li><b>Turn the name into an image</b>: Sofia → sofa, Grant → a giant granite rock, Baker → a loaf of bread.</li><li><b>Anchor the image to a feature of the face</b>: big eyebrows, glasses, hair. Sofia's curly hair is stuffed into a sofa cushion.</li><li><b>Use it</b>: say the name again before you leave.</li></ol>
<p>The <a href="#names">Names &amp; Faces</a> trainer draws random faces so you can practise steps 2 and 3.</p>`
  },
  {
    id: 'srs', title: 'Spaced repetition: making it permanent', mins: 3,
    html: `<p>Images in a palace last days. Facts you want for <i>years</i> need review, ideally just before you'd forget. Each successful recall pushes the next review further out: 1 day, 3 days, a week, a month…</p>
<p>In <a href="#review">Review</a>, add your own cards (anything: vocab, phone numbers, your 00–99 images, speeches). Rate each recall honestly. <b>Again</b> brings it back in 10 minutes, and <b>Easy</b> sends it far into the future.</p>
<p>A few minutes a day beats an hour once a week.</p>`
  },
  {
    id: 'plan', title: 'A 10-minute daily routine', mins: 1,
    html: `<ol><li>Review: clear what's due (2–4 min).</li><li>Major drill: 20 numbers to images (2 min).</li><li>One trainer: rotate between Numbers, Words, Cards and Names (5 min).</li></ol>
<p>Keep the streak alive. Push difficulty up a notch whenever you score 100% twice in a row.</p>`
  },
];
