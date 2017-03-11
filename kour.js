var resultsWaveOne = null;
var resultsWithIA = null;

function launchCampaign(manualLaunch) {
    // Change new nodes into "end" nodes and add conversion boxes for end nodes
    var treeData = treemap(root);
    var nodes = treeData.descendants();
    nodes.forEach(function(node) {
	if (node.data.channel == "new") {
	    node.data.channel = "stop";
	    node.data.name = "";
	} else if (node.children == null && node.data.type != "conversion") {
	    node.addNode({"name": "Conversion!", "channel": "buyer", "type":"conversion"});
	}
    });
    update(root);
    
    // display KPI boxes
    var midpaths = d3.selectAll("g.midpath");
    midpaths.select('g').attr("style","display: block;");
    animateToNumber(midpaths.select('tspan.reach'), function(d) { return d.data.reach;})
	.on('end', function() { midpaths.select('tspan.percent').attr("style","display: block;"); });

    // deactivate clicks
    midpaths.select('image').attr("style","display: none;");
    d3.selectAll("image.node")
	.attr("data-toggle","")
	.on('click', null)
	.on('contextmenu', null);

    // Display results
    if (manualLaunch) {
	resultsWaveOne = getCampaignResults();
	resultsWithIA = null;
    }
    else {
	resultsWithIA = getCampaignResults();
	var iaPerf = getIAPerf();
	d3.select('.results-ia').attr("style", "display: block;");
	['learning-time', 'conversion-gain', 'roi-gain'].forEach(function(kpi) {
	    animateToNumber(d3.select('.results-ia .'+kpi), function(d) { return iaPerf[kpi]; });
	});
	['media-cost', 'cac', 'conversions', 'roi'].forEach(function(kpi) {
	    animateToNumber(d3.select('.results-ia .'+kpi), function(d) { return resultsWithIA[kpi]; });
	});
    }	

    d3.select('.results').attr("style", "display: block;");
    ['media-cost', 'cac', 'conversions', 'roi'].forEach(function(kpi) {
	animateToNumber(d3.select('.results .'+kpi), function(d) { return resultsWaveOne[kpi]; });
    });
    
    d3.select('button.launch').attr("disabled", true);
    if (manualLaunch) d3.select('button.optim').attr("disabled", null);
}



function getIAPerf() {
    var learningTime = Math.floor(5 * (Math.log(1 + (resultsWithIA["roi"] - resultsWaveOne["roi"])/1000000)));
    return {
	"learning-time": learningTime,
	"conversion-gain": resultsWithIA["conversions"] - resultsWaveOne["conversions"],
	"roi-gain": resultsWithIA["roi"] - resultsWaveOne["roi"]
    };
}

function getCampaignResults() {
    var conversions = 0, cac = 0, mediaCost = 0;
    var nodes = treemap(root).descendants();
    nodes.forEach(function(node) {
	if ($.inArray(node.data.channel, channels) >= 0) {
	    mediaCost += node.data.reach * channelDetails[node.data.channel]["cost"];
	}
	if (node.data.type == "conversion") {
	    conversions += node.data.reach;
	}
    });
    cac = mediaCost / conversions;
    var roi = (MARGE_UNITAIRE - cac) * conversions;
    return {
	"conversions": conversions,
	"cac": cac.toPrecision(3),
	"media-cost": mediaCost,
	"roi": roi
    };
}

function retry() {
    var midpaths = d3.selectAll("g.midpath");
    midpaths.select('g').attr("style","display: none;");
    d3.select('.results').attr("style", "display: none;");
    midpaths.select('image').attr("style","display: block;");
    d3.select('.results-ia').attr("style", "display: none;");
    var treeData = treemap(root);
    var nodes = treeData.descendants();
    nodes.forEach(function(node) {
	if (node.data.channel == "stop") {
	    node.data.channel = "new";
	    node.data.name = NOUV_ETAPE;
	} else if (node.children && node.children.length == 1 && node.children[0].data.type == "conversion") {
	    node.children = null; 
	}
    });
    
    update(root);
    d3.select('button.launch').attr("disabled", null);
    d3.select('button.optim').attr("disabled", true);
}

// optimum[depth][currentnodeline][branchtype] = the optimal msg, chan & datas for the child of currentnode
// of type branchtype
var optimum = [{}, {}, {}, {}, {}];


function optimizeByIA() {
    if (!confirm("Lancer l'IA va modifier votre parcours actuel, êtes vous sûr?")) return false;
    retry();
    d3.select('button.launch').attr("disabled", true);
    // iterate on depth, node type, parent channel, parent message
    for(var depth=3; depth >=0 ; depth--) {
	branches.forEach(function(childType) { branches.forEach(function(nodeType) {
	    channels.forEach(function(nodeChan) { messages.forEach(function(nodeMsg) {
		channels.forEach(function(parentChan) { messages.forEach(function(parentMsg) {
		    [0,1,2].forEach(function(email_nb) { [0,1,2].forEach(function(sms_nb) {
			var line = nodeMsg + nodeChan + nodeType +
			    parentMsg + parentChan + email_nb + sms_nb;
			var childReach = rates[depth][line][childType];
			if (!optimum[depth][line]) optimum[depth][line] = {};
			// Conversion nodes always yield 
			if (childType == "conversion") {
			    optimum[depth][line][childType] = {
				"message": "Conversion!",
				"channel": "buyer",
				"conversionRate": childReach,
				"mediaCostRate": 0
			    }
			}
			// Otherwise depth 4 nodes never yield
			else if (depth == 3) {
			    optimum[depth][line][childType] = {
				"message": undefined,
				"channel": undefined,
				"conversionRate": 0,
				"mediaCostRate": 0
			    }
			}
			
			// For all the other nodes, dyn prog
			else {
			    var new_email_nb = Math.min(2, (parentChan == "email") ? email_nb + 1 : email_nb);
			    var new_sms_nb = Math.min(2, (parentChan == "sms") ? sms_nb + 1 : sms_nb);
			    optimum[depth][line][childType] = optimizeForNode(depth, childType, nodeMsg, nodeChan, new_email_nb, new_sms_nb);
			}
		    })})
		})})
	    })})
	});});
    }

    function optimizeForNode(depth, childType, nodeMsg, nodeChan, email_nb, sms_nb) {
	/* for a given node with message nodeMsg and channel nodeChan 
	   Returns the optimal message, channel and rates for the child of type childType
	   Assumes optima have been computed for higher depths
	 */
	var optimalValue = 0;
	var result = {};
	channels.forEach(function(chan) { messages.forEach(function(msg) {
	    var mediaCostRate = channelDetails[chan].cost,
		conversionRate = 0,
		newLine = msg + chan + childType + nodeMsg + nodeChan + email_nb + sms_nb;
	    branches.forEach(function(type) {
		mediaCostRate += (rates[depth+1][newLine][type] * optimum[depth+1][newLine][type].mediaCostRate);
		conversionRate += (rates[depth+1][newLine][type] * optimum[depth+1][newLine][type].conversionRate);
	    });
	    var value = conversionRate * MARGE_UNITAIRE - mediaCostRate;
	    if (optimalValue < value) {
		optimalValue = value;
		result = {
		    "message": msg,
		    "channel": chan,
		    "conversionRate": conversionRate,
		    "mediaCostRate": mediaCostRate,
		    "nextOptimum": newLine
		};
	    }
	})});
	return result;
    }

    // setup the optimal path
    
    function _optimalStep(node, line) {
	/* Sets the optimal message for node N with previous steps stored in line */
	return new Promise(function(resolve) {
	    animateSubtree(node, Math.floor(Math.random() * 3) + 2).then(function() {
		var optimalData = node.depth > 0 ? optimum[node.depth-1][line][node.data.type] : optimizeForNode(-1,"negative","achat","video", 0, 0);
		optimalData.name = messageDetails[optimalData.message] ? messageDetails[optimalData.message].name : "Conversion!";
		node._updateStepData(optimalData);
		update(node);
		if (node.children) {
		    if (node.children.length == 1) {
			_optimalStep(node.children[0], optimalData.nextOptimum).then(() => resolve());
		    }
		    else {
			_optimalStep(node.children[0], optimalData.nextOptimum).then(function() {
			    _optimalStep(node.children[1], optimalData.nextOptimum).then(function() {
				_optimalStep(node.children[2], optimalData.nextOptimum).then(() => resolve());
			    });
			});
		    }
		} else { resolve();}
	    });
	});
    }

    function animateSubtree(node, iterations) {
	return new Promise(function(resolve, reject) {
	    if (iterations == 0) resolve();
	    else {
		node.descendants().concat(node).forEach(function(nd) {
		    nd.data.channel = channels[Math.floor(Math.random()*channels.length)];
		    nd.data.message = messages[Math.floor(Math.random()*messages.length)];
		    nd.data.name = nd.data.message;
		});
		update(node);
		sleep(300).then(function() { animateSubtree(node, iterations - 1).then(() => resolve()) })
	    }
	});
    }
    // initial line
    _optimalStep(root, messages[0] + channels[0] + branches[0] + messages[0] + channels[0] + "00")
	.then(function() { launchCampaign() });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function animateToNumber(selection, transfNumber) {
    return selection.transition().duration(1500)
	.tween("text", function(d) {
	    var that = d3.select(this),
		i = d3.interpolateNumber(0, transfNumber(d));
	    return function(t) {
		that.text(formatNumber(i(t)));
	    };
	});
}
