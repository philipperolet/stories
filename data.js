// Data and labels

var NOUV_ETAPE = "Créer Etape";

var channels = ["facebook", "display", "email"];
var messages = ["humour", "pratique", "pas_cher"];
var branches = ["engagement", "negative", "conversion"]
var branchTypes = {
    "conversion": {"image":"euro.svg", "textColor":"blue"},
    "engagement": {"image":"add.png", "textColor":"green"},
    "negative": {"image":"minus.png", "textColor":"red"}
}

var treeData =
    {
	"name": NOUV_ETAPE,
	"channel": "new",
	"reach": 1000000,
	"children": [
	    { 
		"name": "Level 2: A",
	    },
	    { "name": "Level 2: B" }
	]
    };
var rates = {}
messages.forEach(function(message) {
    channels.forEach(function(channel) {
	branches.forEach(function(reaction) {
	    messages.concat(["none"]).forEach(function(prev_message) {
		channels.concat(["none"]).forEach(function(prev_channel) {
		    for (var depth=0; depth < 4; depth++) {
			rates[message + channel + reaction + prev_message + prev_channel + depth] = {
			    "conversion": 0.01,
			    "engagement": 0.1,
			    "negative": 0.89
			};
		    }
		});
	    });
	});
    });
});

	
		    
	    
