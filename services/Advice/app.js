var express = require('express');
var app = express();
var kanye = require("../../kanye");
var ADVICE_KEY = 'previous_advice';

var ADVICE_ARRAY = [
    "I am God's vessel. But my greatest pain in life is that I will never be able to see myself perform live.",
    "Would you believe in what you believe in if you were the only one who believed it?",
    "I feel like I'm too busy writing history to read it.",
    "I'll say things that are serious and put them in a joke form so people can enjoy them. We laugh to keep from crying.",
    "I refuse to accept other people's ideas of happiness for me. As if there's a 'one size fits all' standard for happiness.",
    "I am Warhol. I am the No. 1 most impactful artist of our generation. I am Shakespeare in the flesh.",
    "I liberate minds with my music. That's more important than liberating a few people from apartheid or whatever.",
    "If you have the opportunity to play this game of life you need to appreciate every moment. a lot of people don't appreciate the moment until it's passed.",
    "I don't know what's better gettin' laid or gettin' paid.",
    "I think I do myself a disservice by comparing myself to Steve Jobs and Walt Disney and human beings that we've seen before. It should be more like Willy Wonka... and welcome to my chocolate factory.",
    "Keep your nose out the sky, keep your heart to god, and keep your face to the raising sun.",
    "I still think I am the greatest.",
    "You don't have to be scared of me, because I am loyal. Why are people so scared of creative ideas and so scared of truth? All I want to do is do good.",
    "I would never want a book's autograph. I am a proud non-reader of books.",
    "I don't even listen to rap. My apartment is too nice to listen to rap in.",
    "But for me to have the opportunity to stand in front of a bunch of executives and present myself, I had to hustle in my own way. I can't tell you how frustrating it was that they didn't get that. No joke - I'd leave meetings crying all the time.",
    "Nothing in life is promised except death.",
    "I would hear stories about Steve Jobs and feel like he was at 100 percent exactly what he wanted to do, but I'm sure even a Steve Jobs has compromised. Even a Rick Owens has compromised. You know, even a Kanye West has compromised. Sometimes you don't even know when you're being compromised till after the fact, and that's what you regret.",
    "Nobody can tell me where I can and can't go.",
    "I ain't here to argue about his facial features. Or here to convert atheists into believers. I'm just trying to say the way school need teachers the way Kathie Lee needed Regis that's the way yall need Jesus.",
    "I will go down as the voice of this generation, of this decade, I will be the loudest voice.",
    "I was never really good at anything except for the ability to learn.",
    "We all self-conscious. I'm just the first to admit it.",
    "I am not a fan of books.",
    "Know your worth! People always act like they're doing more for you than you're doing for them.",
    "In Paris, you're as far as possible from the land of pleasant smiles.",
    "I thank Marc Jacobs so much for giving me the opportunity to design a shoe for Louis Vuitton, but the thing that broke my heart most was when they said, 'You're finished. The shoe's finished.'",
    "This dark diction has become America's addiction.",
    "Man, I'm the No. 1 living and breathing rock star. I am Axl Rose; I am Jim Morrison; I am Jimi Hendrix.",
    "Creative output, you know, is just pain. I'm going to be cliche for a minute and say that great art comes from pain.",
    "People always say that you can't please everybody. I think that's a cop-out. Why not attempt it? 'Cause think of all the people you will please if you try.",
    "My message isn't perfectly defined. I have, as a human being, fallen to peer pressure.",
    "Thirty-three-years-old, still creating art. It's rage, it's creativity, it's pain, it's hurt, but it's the opportunity to still have my voice get out there through music.",
    "If I was just a fan of music, I would think that I was the number one artist in the world.",
    "Michael Jordan changed so much in basketball, he took his power to make a difference. It's so much going on in music right now and somebody has to make a difference.",
    "I'm pretty calculating. I take stuff that I know appeals to people's bad sides and match it up with stuff that appeals to their good sides.",
    "They say you can rap about anything except for Jesus, that means guns, sex, lies, video tapes, but if I talk about God my record won't get played Huh?",
    "Black people can be the most conservative, the most discriminating. Especially among ourselves. It wasn't white people who said all black men have to wear baggy jeans.",
    "I know I got angels watchin me from the other side.",
    "Fashion breaks my heart.",
    "The concept of commercialism in the fashion and art world is looked down upon. You know, just to think, 'What amount of creativity does it take to make something that masses of people like?' And, 'How does creativity apply across the board?'",
    "George Bush doesn't care about black people.",
    "I hate the way they portray us in the media. If you see a black family it says they're looting, if you see a white family it says they're looking for food.",
    "Why, if someone is good in one field can they not be accepted or given the slightest opportunity to express and be creative in other fields?",
    "If you see a black family, it's looting, but if it's a white family they are looking for food.",
    "I didn't want to play it boring and safe. I also didn't want to innovate too much. Second albums, man, they're even scarier than first ones.",
    "It was a strike against me that I didn't wear baggy jeans and jerseys and that I never hustled, never sold drugs.",
    "I really appreciate the moments that I was able to win rap album of the year or whatever.",
    "Our work is never over.",
    "Sometimes people write novels and they just be so wordy and so self-absorbed.",
    "I can always tell if a band has a British rhythm section due to the gritty production."
];

var currentAdvice = 0;
var adviceMax = ADVICE_ARRAY.length;

function getAdvice() {
  var message = ADVICE_ARRAY[currentAdvice];
  currentAdvice++;
  if (currentAdvice >= adviceMax) {
      currentAdvice = 0;
  }
  return message;
}

// The main app can hit this when an SMS is received
app.get('/sms', function(req, res) {
  if (req.query.message.toLowerCase() != "advice") {
    res.status(400).end();
        return;
  }

    var message = getAdvice();
  kanye.sendMessage(req.query.number, message);
  res.status(200).end();
});

app.listen(3000);
