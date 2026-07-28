// Curated quote pool for the Today screen.
// Rotates on each mount/refresh via getRandomQuote().

export type FamousQuote = {
  kind: "famous";
  text: string;
  author: string;
};

export type AnimeQuote = {
  kind: "anime";
  text: string;
  character: string;
  anime: string;
};

export type Quote = FamousQuote | AnimeQuote;

export const FAMOUS_QUOTES: FamousQuote[] = [
  { kind: "famous", text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { kind: "famous", text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { kind: "famous", text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { kind: "famous", text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { kind: "famous", text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
  { kind: "famous", text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { kind: "famous", text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { kind: "famous", text: "The mind is everything. What you think you become.", author: "Buddha" },
  { kind: "famous", text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { kind: "famous", text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { kind: "famous", text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { kind: "famous", text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { kind: "famous", text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { kind: "famous", text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { kind: "famous", text: "Whether you think you can, or you think you can't — you're right.", author: "Henry Ford" },
  { kind: "famous", text: "Discipline equals freedom.", author: "Jocko Willink" },
  { kind: "famous", text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { kind: "famous", text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { kind: "famous", text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { kind: "famous", text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { kind: "famous", text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { kind: "famous", text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { kind: "famous", text: "Growth is never by mere chance; it is the result of forces working together.", author: "James Cash Penney" },
  { kind: "famous", text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { kind: "famous", text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { kind: "famous", text: "The best way out is always through.", author: "Robert Frost" },
  { kind: "famous", text: "What we do in life echoes in eternity.", author: "Marcus Aurelius" },
  { kind: "famous", text: "Stay hungry, stay foolish.", author: "Stewart Brand" },
  { kind: "famous", text: "Comparison is the thief of joy.", author: "Theodore Roosevelt" },
  { kind: "famous", text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
];

export const ANIME_QUOTES: AnimeQuote[] = [
  { kind: "anime", text: "The moment you think of giving up, think of the reason why you held on so long.", character: "Natsu Dragneel", anime: "Fairy Tail" },
  { kind: "anime", text: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" },
  { kind: "anime", text: "It's not the face that makes someone a monster; it's the choices they make with their lives.", character: "Naruto Uzumaki", anime: "Naruto" },
  { kind: "anime", text: "A lesson without pain is meaningless. That's because no one can gain without sacrificing something.", character: "Edward Elric", anime: "Fullmetal Alchemist: Brotherhood" },
  { kind: "anime", text: "The world is cruel, but also very beautiful.", character: "Mikasa Ackerman", anime: "Attack on Titan" },
  { kind: "anime", text: "If you don't like your destiny, don't accept it. Instead, have the courage to change it the way you want it to be.", character: "Naruto Uzumaki", anime: "Naruto" },
  { kind: "anime", text: "People's lives don't end when they die. It ends when they lose faith.", character: "Itachi Uchiha", anime: "Naruto" },
  { kind: "anime", text: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger.", character: "Gildarts Clive", anime: "Fairy Tail" },
  { kind: "anime", text: "Don't be so quick to throw away your life. No matter how disgraceful or embarrassing it may be, you need to keep struggling to find your way out until the very end.", character: "Kiritsugu Emiya", anime: "Fate/Zero" },
  { kind: "anime", text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", character: "Kenshin Himura", anime: "Rurouni Kenshin" },
  { kind: "anime", text: "Hard work is worthless for those that don't believe in themselves.", character: "Naruto Uzumaki", anime: "Naruto" },
  { kind: "anime", text: "The greatest joy of magic lies in searching for it.", character: "Frieren", anime: "Frieren: Beyond Journey's End" },
  { kind: "anime", text: "It's just ten years for you, but for me it's a quarter of my life. It felt like an eternity.", character: "Himmel", anime: "Frieren: Beyond Journey's End" },
  { kind: "anime", text: "A real hero doesn't need a reason to save someone.", character: "Himmel", anime: "Frieren: Beyond Journey's End" },
  { kind: "anime", text: "Don't give up. There's no shame in falling down. True shame is to not stand up again.", character: "Shintaro Midorima", anime: "Kuroko no Basket" },
  { kind: "anime", text: "The world isn't perfect. But it's there for us, doing the best it can. That's what makes it so damn beautiful.", character: "Roy Mustang", anime: "Fullmetal Alchemist: Brotherhood" },
  { kind: "anime", text: "Power comes in response to a need, not a desire. You have to create that need.", character: "Son Goku", anime: "Dragon Ball Z" },
  { kind: "anime", text: "If you don't share someone's pain, you can never understand them.", character: "Nagato", anime: "Naruto Shippuden" },
  { kind: "anime", text: "I'll leave tomorrow's problems to tomorrow's me.", character: "Saitama", anime: "One Punch Man" },
  { kind: "anime", text: "Being weak is nothing to be ashamed of… Staying weak is!", character: "Fuegoleon Vermillion", anime: "Black Clover" },
  { kind: "anime", text: "A dropout will beat a genius through hard work.", character: "Rock Lee", anime: "Naruto" },
  { kind: "anime", text: "The only ones who should kill are those who are prepared to be killed.", character: "Lelouch vi Britannia", anime: "Code Geass" },
  { kind: "anime", text: "Reject common sense to make the impossible possible.", character: "Simon", anime: "Gurren Lagann" },
  { kind: "anime", text: "Don't believe in yourself. Believe in the me that believes in you.", character: "Kamina", anime: "Gurren Lagann" },
  { kind: "anime", text: "If you can't do something, then don't. Focus on what you can.", character: "Shiroe", anime: "Log Horizon" },
  { kind: "anime", text: "To know sorrow is not terrifying. What is terrifying is to know you can't go back to happiness you could have.", character: "Matsumoto Rangiku", anime: "Bleach" },
  { kind: "anime", text: "Push through the pain. Giving up hurts more.", character: "Vegeta", anime: "Dragon Ball Z" },
  { kind: "anime", text: "No matter how deep the night, it always turns to day, eventually.", character: "Brook", anime: "One Piece" },
  { kind: "anime", text: "If you're gonna insist on gambling and then complain when you lose, you had better work on your game.", character: "Hisoka", anime: "Hunter x Hunter" },
  { kind: "anime", text: "You should enjoy the little detours to the fullest. Because that's where you'll find the things more important than what you want.", character: "Ging Freecss", anime: "Hunter x Hunter" },
];

const ALL: Quote[] = [...FAMOUS_QUOTES, ...ANIME_QUOTES];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomQuote(opts?: { preferAnime?: boolean }): Quote {
  if (opts?.preferAnime) {
    // 70% anime bias when in Frieren theme
    return Math.random() < 0.7 ? pick(ANIME_QUOTES) : pick(FAMOUS_QUOTES);
  }
  return pick(ALL);
}
