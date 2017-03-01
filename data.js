// Data and labels

var NOUV_ETAPE = "Créer Etape";
var channelDetails = {
    "facebook": { "cost": 0.01 },
    "display": { "cost": 0.001 },
    "email": { "cost": 0.0001 }
}
var channels = Object.keys(channelDetails);
var messages = ["humour", "pratique", "pas_cher"];

var branchDetails = {
    "conversion": {"image":"euro.png", "textColor":"green"},
    "engagement": {"image":"like.png", "textColor":"blue"},
    "negative": {"image":"minus.png", "textColor":"red"}
}
var branches = Object.keys(branchDetails);

var INITIAL_REACH = 100000000;

/* ROOT NODE DATA
Note: the type is meaningless for root node, but used 
in computations */
var treeData =
    {
	"name": NOUV_ETAPE,
	"channel": "new",
	"reach": INITIAL_REACH,
	"type": "engagement",
	"children": [
	    { 
		"name": "Level 2: A",
	    },
	    { "name": "Level 2: B" }
	]
    };

var rates = [{}, {}, {}, {}]
messages.forEach(function(message) {
    channels.forEach(function(channel) {
	branches.forEach(function(reaction) {
	    messages.concat(["none"]).forEach(function(prev_message) {
		channels.concat(["none"]).forEach(function(prev_channel) {
		    for (var depth=0; depth < 4; depth++) {
			rate_line = message + channel + reaction + prev_message + prev_channel;
			rates[depth][rate_line] = getRates(depth, message, channel,
							   reaction, prev_message, prev_channel);
		    }
		});
	    });
	});
    });
});

function getRates(depth, message, channel,
		  reaction, prev_message, prev_channel) {
    var conv = 0.9 + (Math.random()*0.2);
    var eng = 0.9 + (Math.random()*0.2);
    conv *= 0.0003;
    eng *= 0.003;
    if (channel == "email") conv = conv / 10;
    return {
	"conversion": conv,
	"engagement": eng,
	"negative": 1-conv-eng
    };
}

