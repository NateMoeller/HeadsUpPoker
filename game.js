var suits = ['clubs', 'hearts', 'spades', 'diamonds'];
var labels = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

var Game = function(gameid){
	this.gameid = gameid;
	this.player1 = new Player(true); // PLAYER1 is dealer and small blind
	this.player2 = new Player(false); // PLAYER2 is big blind
	this.bigBlind = 10;
	this.smallBlind = 5;
	this.curPot = 0;
	this.cards = [];
	this.currentCard = 0;
	this.deck = new Deck(1);
	this.deck.shuffle();


}

// TODO: make sure currentCard isn't > 52
Game.prototype.deal = function(){
	if(this.player1.dealer){
		this.player1.hand[0] = this.deck.cards[this.currentCard];
		this.currentCard++;
		this.player2.hand[0] = this.deck.cards[this.currentCard];
		this.currentCard++;
		this.player1.hand[1] = this.deck.cards[this.currentCard];
		this.currentCard++;
		this.player2.hand[1] = this.deck.cards[this.currentCard];
		this.currentCard++;
	}
	else{
		this.player2.hand[0] = this.deck.cards[this.currentCard];
		this.currentCard++;
		this.player1.hand[0] = this.deck.cards[this.currentCard];
		this.currentCard++;
		this.player2.hand[1] = this.deck.cards[this.currentCard];
		this.currentCard++;
		this.player1.hand[1] = this.deck.cards[this.currentCard];
		this.currentCard++;
	}
}
Game.prototype.dealFlop = function(){
	this.currentCard++ // burn one
	for(var i = 0; i < 3; i++){
		this.cards[i] = this.deck.cards[this.currentCard];
		this.currentCard++;
	}
}
Game.prototype.showFlop = function(){
	$(".cards").html("");
	for(var i = 0; i < this.cards.length; i++){
		var path = this.cards[i].image;
		$(".cards").append("<img src='" + path + ".png'>" + " ");
	}
}


Game.prototype.dealPlayer1 = function(){
  //update player1 cards
  $(".player").html("");
  //show the player's cards
  for(var i = 0; i < this.player1.hand.length; i++){
    var path = this.player1.hand[i].image;
    $(".player").append("<img src='" + path + ".png'>" + " ");
  }
}
Game.prototype.dealPlayer2 = function(){
  //update player1 cards
  $(".player").html("");
  //show the player's cards
  for(var i = 0; i < this.player2.hand.length; i++){
    var path = this.player2.hand[i].image;
    $(".player").append("<img src='" + path + ".png'>" + " ");
  }
}
Game.prototype.dealOpponent = function(){
	$(".opponent").html("");
	$(".opponent").append("<img src='img/b1fv.png'>" + " ");
	$(".opponent").append("<img src='img/b1fv.png'>" + " ");
}
Game.prototype.player1UI = function(){
	$(".money").html("");
	$(".money").append("Money: " + this.player1.money);
}
Game.prototype.player2UI = function(){
	$(".money").html("");
	$(".money").append("Money: " + this.player2.money);
}
Game.prototype.currentPot = function(){
	$(".pot").html("");
	$(".pot").append("Pot: " + this.curPot);
}


var Card = function(label, suit, imageSrc){
	this.label = label;
  	this.suit = suit;
  	this.image = imageSrc;
}

var Deck = function(numberOfDecks){
  this.cards = new Array(52 * numberOfDecks);

  var spot = 0;
  for(var i = 0; i < labels.length; i++){
    for(var j = 0; j < suits.length; j++){
      var imagePath = 'img/' + labels[i] + suits[j];
      var card = new Card(labels[i], suits[j], imagePath);
      this.cards[spot] = card;
      spot++;
    }
  }

  this.shuffle = function(){
    for (var i = 0; i < this.cards.length; ++i){
          var randomSpot = i + Math.floor(Math.random() * (52 - i));
          var temp = this.cards[i];
          this.cards[i] = this.cards[randomSpot];
          this.cards[randomSpot] = temp;
      }
  }

}

var Player = function(dealer){
	this.hand = [];
	this.dealer = dealer;
	this.money = 1000;
	if(this.dealer){
		this.bigBlind = false;
		this.smallBlind = true;
	}
	else{
		this.bigBlind = true;
		this.smallBlind = false;
	}
	 
	

}