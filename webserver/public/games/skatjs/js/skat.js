'use strict';

const IMGDIR="./skatjs/img";

class SkatDeck {
    suits = ["Karo", "Herz", "Pik", "Kreuz"];
    symbols = ['7', '8', '9', '10', 'B', 'D', 'K', 'A'];
    // value of the cards at the time of counting points
    values = [0, 0, 0, 10, 2, 3, 4, 11];

    getCards() {
	// create all 32 cards of the deck
	var cards = [];
	for (var suit of this.suits) {
	    for (var symbol of this.symbols) {
		var card = {
		    suit   : suit,
		    symbol : symbol,
		    value  : this.values[this.symbols.indexOf(symbol)],
		};
		cards.push(card);
	    }
	}
	return cards;
    }
    shuffleInPlace(array) {
	// shuffle elements of an array in play
	var n = array.length;
	for (var i=0; i<n; i++) {
	    // choose the i-th element randomly from the remaining n-i elements
	    var j = i + Math.floor(Math.random() * (n-i));
	    // swap elements i and j
	    var tmp = array[i];
	    array[i] = array[j];
	    array[j] = tmp;
	}
	return array
    }
    clearGame() {
	// clear table
	deleteCards('off-table-attacker');
	deleteCards('off-table-defender');
	deleteCards('hand-1-local');
	deleteCards('hand-2-remote');
	deleteCards('hand-3-remote');
    }
    newGame() {
	// shuffle and deal cards
	this.clearGame();
	var cards = this.getCards();
	// shuffle cards
	cards = this.shuffleInPlace(cards);
	// distribute cards:
	// The first two cards go to the Skat
	var skat = document.getElementById('off-table-attacker');
	var i=0;
	for (; i<2; i++) {
	    // The cards in the skat are hidden
	    skat.append(card2element(cards[i], false));
	}
	// Each player gets 10 cards
	for (; i<32; i=i+3) {
	    // My own cards should be visible to me
	    document.getElementById("hand-1-local").append(card2element(cards[i+0], true));
	    // But the cards of the other two players should be hidden
	    document.getElementById("hand-2-remote").append(card2element(cards[i+1], false));
	    document.getElementById("hand-3-remote").append(card2element(cards[i+2], false));
	}
    }
    countGame() {
	// count cards to determine winner
    
	// check that all cards have been played
	var left = 0;
	left += fetchCards('hand-1-local').length;
	left += fetchCards('hand-2-remote').length;
	left += fetchCards('hand-3-remote').length;    
	if (left > 0) {
	    console.log("Game is not over, yet!");
	}
	
	fetchCards('off-table-attacker');
	fetchCards('off-table-defender');
    }

}

function card2element(card, visible) {
    var id = card.suit + "_" + card.symbol;
    var src;
    if (visible) {
	src = IMGDIR + "/" + id + ".png";
    } else {
	src = IMGDIR + "/" + "backside.png";
    }
    var html = `<img class="card" id="${id}" src="${src}" draggable="true" ondragstart="drag(event)">`;

    var template = document.createElement("template");
    template.innerHTML = html;
    return template.content.firstChild;
}


function fetchCards(containerId) {
    // fetch all cards from a given container
    var container = document.getElementById(containerId);
    var cards = [];
    for (var child of container.children) {
	if (child.class === "card") {
	    cards.push(child);
	}
    }
    return cards;
}

function deleteCards(containerId) {
    // delete all cards in a given container
    var container = document.getElementById(containerId);
    var cards = container.querySelectorAll("#card");
    while (cards.length > 0) {
	delete cards[0];
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("id", event.target.id);
}

function drop(event) {
    event.preventDefault();
    // element being droped
    var dropped = document.getElementById(event.dataTransfer.getData("id"));
    // receiving element
    var target = event.target;
    var referenceNode = null;
    // Only images (cards) can be dropped
    if (dropped.tagName !== "IMG") {
	return;
    }
    // You cannot drop images into other images
    if (target.tagName === "IMG") {
	// Insert into the parent node before the target node
	referenceNode = target;
	target = target.parentNode;
    }
    // Change the visibility of the cards depending where they lie
    var visible;
    switch(target.id) {
    case "table":
	// Cards on the table have to be visible.
	visible = true;
	break;
    case "hand-1-local":
	// You should be able to see your own cards.
	visible = true
	break;
    case "hand-2-remote":
    case "hand-3-remote":
	// You should not see the cards of the other players
	visible = false;
	break;
    case "off-table-attacker":
    case "off-table-defender":
	// Cards outside the table should not be visible either
	visible = false;
	break;
    default:
	visible = true;
    }
    if (visible) {
	dropped.src = IMGDIR + "/" + dropped.id + ".png";
    } else {
	dropped.src = IMGDIR + "/" + "backside.png";
    }
    
    target.insertBefore(dropped, referenceNode);
    console.log("Dropping element with ID=" + dropped.id + " into ", target.id);
}



window.onload = (event) => {
    var deck = new SkatDeck();
    console.log(deck.getCards());
    deck.newGame();

};

