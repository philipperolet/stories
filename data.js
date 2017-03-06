// Data and labels

var NOUV_ETAPE = "Créer Etape";
var channelDetails = {
    "sms": { "cost": 0, "engagement": 0.001, "conversion": 0.0005, "favoured_message": "achat"},
    "video": { "cost": 0.01, "engagement": 0.002, "conversion": 0.0005, "favoured_message": "notoriete"},
    "display": { "cost": 0.0015, "engagement": 0.0005, "conversion": 0.0001, "favoured_message": "achat"},
    "email": { "cost": 0, "engagement": 0.0002, "conversion": 0.00005, "favoured_message": "notoriete"}
}
var channels = Object.keys(channelDetails);

var messageDetails = {"notoriete": {"name": "Notoriété"},
		       "achat": {"name": "Achat"}};
var messages = Object.keys(messageDetails);

var branchDetails = {
    "conversion": {"image":"euro.png", "textColor":"green"},
    "engagement": {"image":"like.png", "textColor":"blue"},
    "negative": {"image":"minus.png", "textColor":"red"}
}
var branches = Object.keys(branchDetails);

var INITIAL_REACH = 70000000;
var MARGE_UNITAIRE = 150;
/* ROOT NODE DATA
Note: the type is meaningless for root node, but used 
in computations */
var treeData =
    {
	"name": NOUV_ETAPE,
	"channel": "new",
	"reach": INITIAL_REACH,
	"type": "negative",
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
		    for (var nb_mail = 0; nb_mail < 3; nb_mail++) { // nb total de mails envoyés jusqu'alors sans compter ce noeud et son parent
			for (var nb_sms = 0; nb_sms < 3; nb_sms++) { // idem sms
			    for (var depth=0; depth < 4; depth++) {
				rate_line = message + channel + reaction + prev_message + prev_channel+nb_mail+nb_sms;
				rates[depth][rate_line] = getRates(depth, message, channel,
								   reaction, prev_message, prev_channel, nb_mail, nb_sms);
			    }
			}
		    }
		});
	    });
	});
    });
});


function getRates(depth, message, channel,
		  reaction, prev_message, prev_channel, nb_mail, nb_sms) {
    var FAVOURED_MESSAGE_UPLIFT = 0.3;
    var conv = channelDetails[channel]['conversion'];// * (0.9 + (Math.random()*0.2));
    var eng = channelDetails[channel]['engagement'];// * (0.9 + (Math.random()*0.2));
    if (message == channelDetails[channel]['favoured_message']) {
	conv *= (1 + FAVOURED_MESSAGE_UPLIFT * 1.25);
	eng *= (1 + FAVOURED_MESSAGE_UPLIFT);
    }
    else {
	conv *= (1 - FAVOURED_MESSAGE_UPLIFT * 1.25);
	eng *= (1 - FAVOURED_MESSAGE_UPLIFT);
    }
    if (depth >0) {
    if (message == prev_message) {
	conv /= 2;
	eng /=2;
    }
    if (channel == prev_channel) {
	conv /= 2;
	eng /= 2;
    }
    if (depth == 2) {
	conv *= 0.8;
	eng *= 0.8;
    }
    if (depth == 3) {
	conv *= 0.5;
	eng *= 0.5;
    }
    if (reaction == "engagement") {
	conv *= 10;
    }
    if (message == "achat" && prev_message == "notoriete") {
	conv *= 4;
	eng *=4;
    }
    if (prev_channel == "video" && channel != "video") {
	conv *=4;
	eng *=4;
    }
    if (prev_channel == "sms" && channel == "email") {
	conv /= 4;
	eng /= 4;
    }
    var real_nb_mail = ( prev_channel == "email" ? 1 : 0 ) + nb_mail;
    var real_nb_sms = ( prev_channel == "sms" ? 1 : 0 ) + nb_sms;
    if (channel == "email") {
	if (real_nb_mail == 1) {
	    conv /= 2;
	    eng /= 2;
	}
	if (real_nb_mail > 1) {
	    conv /= 6;
	    eng /= 6;
	}
    }
    if (channel == "sms") {
	if (real_nb_sms == 1) {
	    conv /= 4;
	    eng /= 4;
	}
	if (real_nb_sms > 1) {
	    conv /= 10;
	    eng /= 10;
	}
    }
    }
    return {
	"conversion": conv,
	"engagement": eng,
	"negative": 1-conv-eng
    };
}

