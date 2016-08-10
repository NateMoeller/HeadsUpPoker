var $input = $('#chat-input'); // where the user inputs chat text
var $output = $('#chat-output'); // where output is sent
var channel = 'poker';


// generate a random username
var randomName = function() {
  var animals = ['pigeon', 'seagull', 'bat', 'owl', 'sparrows', 'robin', 'bluebird', 'cardinal', 'hawk', 'fish', 'shrimp', 'frog', 'whale', 
  'shark', 'eel', 'seal', 'lobster', 'octopus', 'mole', 'shrew', 'rabbit', 'chipmunk', 'armadillo', 'dog', 'cat', 'lynx', 'mouse', 'lion', 
  'moose', 'horse', 'deer', 'raccoon', 'zebra', 'goat', 'cow', 'pig', 'tiger', 'wolf', 'pony', 'antelope', 'buffalo', 'camel', 'donkey', 
  'elk', 'fox', 'monkey', 'gazelle', 'impala', 'jaguar', 'leopard', 'lemur', 'yak', 'elephant', 'giraffe', 'hippopotamus', 'rhinoceros', 
  'grizzlybear'];
  var colors = ['silver', 'gray', 'black', 'red', 'maroon', 'olive', 'lime', 'green', 'teal', 'blue', 'navy', 'fuchsia', 'purple'];
  return colors[Math.floor(Math.random() * colors.length)] + '_' + animals[Math.floor(Math.random() * animals.length)];
}

// globals
var me = randomName();
$('#whoami').text(me);
var my_skill = Math.floor(Math.random() * 3) + 1;
$('#my_skill').text(my_skill);

var gameid;
var game;
var player1;
var player2;
var opponent;

// start pubnub
var pubnub = PUBNUB.init({
  publish_key: 'pub-c-0aaea98f-9468-461b-a0b5-fcef903dca63',
  subscribe_key: 'sub-c-258770f2-5b57-11e6-bca9-0619f8945a4f',
  uuid: me
});


pubnub.subscribe({
  channel: channel,
  state: {
    skill: my_skill
  },
  message: function(data) {
    // CHAT MESSAGES
     if(data.type == 'chat') {
      var $line = $('<li class="list-group-item"><strong>' + data.payload.uuid + ':</strong> </span>');
      var $message = $('<span class="text" />').text(data.payload.text).html();
      $line.append($message);
      $output.append($line);
      $output.scrollTop($output[0].scrollHeight);
    }

    // CHALLENGE MESSAGES
    if(data.type == 'challenge' && data.payload.target == me) {
      if(data.payload.action == 'request') {
        var response = confirm(data.payload.uuid + ' is challenging you to a match! Press OK to accept or Cancel to deny.');
        if(response){
          gameid = pubnub.uuid();
          game = new Game(gameid);
          player1 = data.payload.uuid;
          opponent = player1;
          player2 = me;
          // You accepted!
          var $line = $('<li class="list-group-item"><strong>Game: </strong> </span>');
          var $message = $('<span class="text" />').text("Game Started! GameID: " + gameid).html();
          $line.append($message);
          $('#chat-output').append($line);
          $('#challenge-match').hide();
          $('.game').show();
        }
        // SEND RESPONSE BACK TO CHALLENGER  
        pubnub.publish({
          channel: channel,
          message: {
            type: 'challenge',
            payload: {
              action: 'response',
              accepted: response,
              uuid: me,
              gameid: gameid,
              deck: game.deck,
              target: data.payload.uuid 
            }
          },
          callback: function(){
            alert('Your response has been sent.');
          }
        });

      }

      // PROCESS CHALLENGE RESPONSE
      if(data.payload.action == 'response') {
        if(data.payload.accepted) {
          player1 = me;
          player2 = data.payload.uuid;
          opponent = player2;
          gameid = data.payload.gameid;
          game = new Game(gameid);
          game.deck = data.payload.deck
          // SYNCHRONIZED GAME STATE, SEND DEAL
          pubnub.publish({
            channel: channel,
            message: {
              type: 'game',
              payload: {
                action: 'deal1',
                uuid: gameid, 
              }
            }
          });
          var $line = $('<li class="list-group-item"><strong>Game: </strong> </span>');
          var $message = $('<span class="text" />').text("Game Started! GameID: " + gameid).html();
          $line.append($message);
          $('#chat-output').append($line);
          $('#challenge-match').hide();
          $('#myModal').modal('hide');
          $('.game').show();
          alert(player2 + ' has accepted your challenge!');
        } 
        else {
          alert(player2 + ' has rejected your challenge!');
        }
      }
    }

    // PROCESS GAME DATA
    if(data.type == "game" && gameid == data.payload.uuid){
      // INITIAL DEAL
      if(data.payload.action == "deal1"){
        game.deal();
        var target;
        // TAKE CARE OF BLINDS
        if(game.player1.smallBlind){
          // TODO: check if players have enough money  
          game.curPot += game.bigBlind;
          game.player2.money -= game.bigBlind;
          game.curPot += game.smallBlind;
          game.player1.money -= game.smallBlind;
          target = player1;
        }
        else{
          //TODO: check if players have enough money
          game.curPot += game.bigBlind;
          game.player1.money -= game.bigBlind;
          game.curPot += game.smallBlind;
          game.player2.money -= game.smallBlind;
          target = player2;
        }

        
        // SHOW THE STATE OF THE GAME TO THE PLAYERS
        if(player1 == me){
          game.showPlayer1();
          game.player1UI();
        }
        if(player2 == me){
          game.showPlayer2();
          game.player2UI();
        }
        game.dealOpponent();
        game.currentPot();


        // FIRE OFF ACTION TO NEXT PLAYER
        if(target == me){ //this if is needed to only fire off one message through the channel
          pubnub.publish({
            channel: channel,
            message: {
              type: 'game',
              payload: {
                action: 'raise',
                amount: game.bigBlind - game.smallBlind,
                uuid: gameid,
                target: target 
              }
            }
          });
        }           
      }
      else if(data.payload.action == "deal2"){
        game.dealFlop();
        game.showFlop();
      }

      // IT IS MY TURN
      if(data.payload.target == me){
        if(data.payload.action == 'raise'){
          $(".buttons").css("visibility","visible");
          $("#check").hide();
          $("#call").prop('value', data.payload.amount);
          $("#call").html('Call (' + data.payload.amount + ")");
        }
        else if(data.payload.action == 'check'){
          $(".buttons").css("visibility","visible");
          $("#call").hide();
        }
        else if(data.payload.action == "call"){
          // OTHER PLAYER CALLED
          var amount = parseInt(data.payload.amount);
          // Log action in chat
          var $line = $('<li class="list-group-item"><strong>Game: </strong> </span>');
          var $message = $('<span class="text" />').text(opponent + " called " + amount).html();
          $line.append($message);
          $('#chat-output').append($line);

          // UPDATE POT    
          game.curPot += amount;
          game.currentPot();
          // DEAL SHOULD DEAL CARDS
          if(game.cards.length == 0){
            // DEAL FLOP
            pubnub.publish({
              channel: channel,
              message: {
                type: 'game',
                payload: {
                  action: 'deal2',
                  uuid: gameid,
                }
              }
            });
          }
          else if(game.cards.length == 3){
            // DEAL TURN
          }         
          else if(game.cards.length == 4){
            // DEAL RIVER
          }
          else{
            // HAND OVER
          }
        }
        else{
          // OTHER PLAYER FOLDED

          // reset the cards
          game.cards = [];

          // reset each player's cards
          game.player1.hand = [];
          game.player2.hand = [];


          if(me == player1){
            game.showPlayer1();
            game.player1.money += game.curPot;
            game.player1UI();
          }
          else{
            game.showPlayer2();
            game.player2.money += game.curPot;
            game.player2UI();
          }

          // reset the pot
          game.curPot = 0;
          game.currentPot();

          // reset the current card
          game.currentCard = 0;
          game.deck = new Deck(1);

          game.swapBlindsAndDealer();

          $(".opponent").html("");

          // Log action in chat
          var $line = $('<li class="list-group-item"><strong>Game: </strong> </span>');
          var $message = $('<span class="text" />').text(opponent + " folded").html();
          $line.append($message);
          $('#chat-output').append($line);

          // DEAL NEW HAND
          pubnub.publish({
            channel: channel,
            message: {
              type: 'game',
              payload: {
                action: 'deal1',
                uuid: gameid,
              }
            }
          });
        }
        
      }

      
    }

  },
  presence: function(data){
    // get notified when people join
    if(data.action == "join") {
      var $new_user = $('<li id="' + data.uuid + '" class="list-group-item">' + data.uuid + '</li>');
      $new_user.click(function(){
        pubnub.publish({
          channel: channel,
          message: {
            type: 'challenge',
            payload: {
              action: 'request',
              uuid: me,
              target: data.uuid
            }
          }
        });
        alert('Challenging ' + data.uuid + '...');
      });
      $('#online-users').append($new_user);
    }
    // and when they leave
    if(data.action == "leave" || data.action == "timeout") {
      $('#' + data.uuid).remove();
    }
  }


});

// when the "send message" form is submitted
$('#chat').submit(function() {
  // publish input value to channel 
  pubnub.publish({
    channel: channel,
    message: {
      type: 'chat',
      payload: {
        text: $input.val(),
        uuid: me 
      }
    }
  });
  // clear the input field
  $input.val('');
   // cancel event bubbling
  return false;
});

// challenge button
$('#challenge-match').click(function(){
  $('#myModal').modal('toggle');
});

// CALL
$('#call').click(function(){
  // UPDATE GAME STATE
  var target;
  var amount = parseInt(this.value);
  if(player1 == me){
    // TODO check if they have enough money
    game.player1.money -= amount;
    game.curPot += amount;
    game.player1UI();
    target = player2;
  }
  else{
    // TODO check if they have enough money
    game.player2.money -= amount;
    game.curPot += amount;
    game.player2UI();
    target = player1;
  }
  game.currentPot();

  // Log action in chat
  var $line = $('<li class="list-group-item"><strong>Game: </strong> </span>');
  var $message = $('<span class="text" />').text(me + " called " + this.value).html();
  $line.append($message);
  $('#chat-output').append($line);
  // HIDE BUTTONS
  $(".buttons").css("visibility","hidden");
  // SEND CALL MESSAGE
  pubnub.publish({
    channel: channel,
    message: {
      type: 'game',
      payload: {
        action: 'call',
        amount: this.value,
        uuid: gameid,
        target: target 
      }
    }
  });
});

// FOLD
$('#fold').click(function(){
  var target;
  //reset the cards
  game.cards = [];

  // reset each player's cards
  game.player1.hand = [];
  game.player2.hand = [];

  // reset the current card
  game.currentCard = 0;
  game.deck = new Deck(1);
  // TODO: swap blinds and dealer chip
  game.swapBlindsAndDealer();

  if(me == player1){
    game.showPlayer1();
    game.player1UI();
    game.player2.money += game.curPot;
    target = player2;
  }
  else if(me == player2){
    game.showPlayer2();
    game.player2UI();
    game.player1.money += game.curPot;
    target = player1;
  }
  // reset the pot
  game.curPot = 0;
  game.currentPot();
  $(".opponent").html("");
  $(".buttons").css("visibility", "hidden");

  // Log action in chat
  var $line = $('<li class="list-group-item"><strong>Game: </strong> </span>');
  var $message = $('<span class="text" />').text(me + " folded").html();
  $line.append($message);
  $('#chat-output').append($line);


  //SEND FOLDING MESSAGE
  pubnub.publish({
    channel: channel,
    message: {
      type: 'game',
      payload: {
        action: 'fold',
        uuid: gameid,
        target: target 
      }
    }
  });
});

