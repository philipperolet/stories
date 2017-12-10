// Data and labels
var ICON_SIZE = 20;
var INITIAL_REACH = 10000000;
var MARGE_UNITAIRE = 200;

var NOUV_ETAPE = "Create Step";

var channelDetails = {
    "sms": {
	"name": "SMS",
	"description": "SMS message to prospect",
	"description_fr": "Envoi de SMS au prospect",
	"cost": 0,
	"engagement": 0.03,
	"conversion": 0.0015,
	"favoured_message": "achat"},
    "video": {
	"name": "Vidéo",
	"description": "Video preroll on Youtube",
	"description_fr": "Preroll vidéo sur Youtube",
	"cost": 0.01,
	"engagement": 0.005,
	"conversion": 0.0005,
	"favoured_message": "notoriete"},
    "display": {
	"name": "Display",
	"description": "Rich display message (e.g. native, or facebook)",
	"description_fr": "Message display riche (e.g. natif, ou facebook)",
	"cost": 0.0015,
	"engagement": 0.002,
	"conversion": 0.0002,
	"favoured_message": "achat"},
    "email": {
	"name": "E-mail",
	"description": "E-mail sent to prospect (reminder: 100% reach assumed for email)",
	"description_fr": "Envoi d'email au prospect (rappel: reach mail à 100%)",	
	"cost": 0,
	"engagement": 0.01,
	"conversion": 0.0005,
	"favoured_message": "notoriete"}
};
var channels = Object.keys(channelDetails);

var messageDetails = {
    "notoriete": {
	"name": "Brand image",
    	"description": "Message focused on brand identity",
	"name_fr": "Notoriété",
    	"description_fr": "Message focalisé sur l'image de la marque"},
    "achat": {
	"name": "Promotion",
    	"description": "Message focused on promoting a product to convert (e.g. promo, strong call-to-action)",
	"name_fr": "Achat",
    	"description_fr": "Message focalisé sur la transformation (e.g. promo, call-to-action fort)"}
};

var messages = Object.keys(messageDetails);

var branchDetails = {
    "conversion": {
	"name": "Conversion",
    	"description": "Indicates the prospect bought. S/he won't be targeted again.",
	"description_fr": "Indique que le prospect a converti. Il ne sera plus ciblé par la suite.",
	"textColor":"green"},
    "engagement": {
	"textColor":"blue",
	"name": "Engagement",
	"description": "The prospect reacted positively to the message (e.g. clic, site visit, preroll fully viewed) but did not convert.",
    	"description_fr": "Indique que le prospect a réagi positivement au message (e.g. clic, visualisation à 100%, visite du site) mais sans convertir."},
    "negative": {
	"textColor":"red",
	"name": "Negative",
    	"description": "Prospect saw the message but did not react.",
	"name_fr": "Négatif",
    	"description_fr": "Le prospect a vu le message mais n'a pas donné signe d'engagement."}

};
var branches = Object.keys(branchDetails);
var perfInformation = {
    "convdef" : {
	"name" : "Conversions",
	"description" : "Total sum on all the steps of the campgain of people who converted.",
	"description_fr" : "Somme totale sur toutes les étapes de la campagnes des personnes ayant renouvellé leur abonnement."},
    "CAC" : {
	"name" : "CAC",
	"description" : "Customer Acquisition Cost = conversions / total campaign cost.",
	"description_fr" : "Customer Acquisition Cost, coût d'acquisition moyen par client = conversions / coût total campagne."},
    "roidef" : {
	"name" : "Net profits", 
	"description" : "Net profits of campaign (in €), computed as net unitary margin (€ per conversion) multiplied by number of conversions.",
	"name_fr" : "Bénéfices nets",
	"description_fr" : "Bénéfices nets dégagés par la campagne (en €), calculés comme la marge unitaire nette (€ par conversion) multipliée par le nombre de conversions."},
    "margedef" : {
	"name" : "Net unitary margin",
	"description" : "Average net profit by conversion (here 250 euros) minus CAC",
	"name_fr" : "Marge nette unitaire",
	"description_fr" : "Bénéfice net moyen par converti (ici 250 euros) moins CAC"}
}
    
var details = {
    "channel" : channelDetails,
    "branch" : branchDetails,
    "message" : messageDetails,
    "perf" : perfInformation
}
Object.keys(details).forEach(function(type) { Object.keys(details[type]).forEach(function(key) { details[type][key].id = key;});});
Object.keys(details).forEach(function(type) {
    var selection = d3.selectAll("."+type+"-info").selectAll("div.item")
	.data(Object.values(details[type]));
    var selEnter = selection.enter().append('div').attr("class", "item");
    selEnter.filter(function(d) { return type != "perf";}).append("img").attr("src", function(d) { return d.id + ".png";})
	.attr("class", "item-img")
	.attr("width", ICON_SIZE)
    	.attr("height", ICON_SIZE);
    selEnter.append("span").attr("class", "item-name").text(function(d) { return d.name; });
    selEnter.append("p").attr("class", "item-descr").text(function(d) { return d.description; });
    selEnter.merge(selection);
});

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

    // Les canaux display & sms fonctionnent mieux avec l'achat
    // Les canaux videos & mail avec la notoriété
    if (message == channelDetails[channel]['favoured_message']) {
	conv *= (1 + FAVOURED_MESSAGE_UPLIFT * 1.25);
	eng *= (1 + FAVOURED_MESSAGE_UPLIFT);
    }
    else {
	conv *= (1 - FAVOURED_MESSAGE_UPLIFT * 1.25);
	eng *= (1 - FAVOURED_MESSAGE_UPLIFT);
    }

    // Un message de notoriété booste l'engagement; un message d'achat booste la conversion
    if (message == "notoriete") eng *= 4;
    if (message == "achat") conv *= 2;
    if (depth >0) {

	// Lassitude si 2 * le même message / le même canal
	if (message == prev_message) {
	    conv /= 3;
	    eng /= 3;
	}
	if (channel == prev_channel) {
	    conv /= 3;
	    eng /= 3;
	}

	// Lassitude progressive au fil des étapes
	if (depth == 2) {
	    conv *= 0.8;
	    eng *= 0.8;
	}
	if (depth == 3) {
	    conv *= 0.5;
	    eng *= 0.5;
	}

	// Taux de conversion amélioré suite à un engagement
	if (reaction == "engagement") {
	    conv *= 20;
	}

	var real_nb_mail = ( prev_channel == "email" ? 1 : 0 ) + nb_mail;
	var real_nb_sms = ( prev_channel == "sms" ? 1 : 0 ) + nb_sms;

	// Les gens sont moins réactifs aux emails / sms après un engagement
	// mais plus après un engagement
	
	if (reaction == "engagement") {
	    if (channel == "email" || channel == "sms") {
		conv *= 2;
		eng *= 2;
	    }
	}
	else if (reaction == "negative") {
	    if (channel == "email" || channel == "sms") {
		conv /= 5;
		eng /= 5;
	    }
	    // Le display obtient un boost dans les cas très négatif
	    // Suprise incongrue là où le reste a échoué
	    
	    else if (channel == "display" && (real_nb_mail + real_nb_sms > 1)) {
		conv *= 8;
		eng *= 8;
	    }
	}	
	// Le 2e email est 3 * moins performant, le 3e 6 * moins
	if (channel == "email") {
	    if (real_nb_mail == 1) {
		conv /= 3;
		eng /= 3;
	    }
	    if (real_nb_mail > 1) {
		conv /= 8;
		eng /= 8;
	    }
	}

	// Idem pour le SMS avec 4 et 10
	if (channel == "sms") {
	    if (real_nb_sms == 1) {
		conv /= 6;
		eng /= 4;
	    }
	    if (real_nb_sms > 1) {
		conv /= 10;
		eng /= 10;
	    }
	}

	//
    }
    return {
	"conversion": conv,
	"engagement": eng,
	"negative": 1-conv-eng
    };
}

