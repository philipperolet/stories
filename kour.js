// This variable's null value is used as a flag indicating that "OptimizeByIA" has
// not been clicked
var resultsWithoutIA = null; 

function launchCampaign() {
    // Change new nodes into "end" nodes and add conversion boxes for end nodes
    var treeData = treemap(root);
    var nodes = treeData.descendants();
    nodes.forEach(function(node) {
	if (node.data.channel == "new") {
	    node.data.channel = "stop";
	    node.data.name = "";
	} else if (node.children == null && node.data.type != "conversion") {
	    node.addNode({"name": "Conversion!", "channel": "conversion", "type":"conversion"});
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
    var results = getCampaignResults();

    d3.select('.results').attr("style", "display: block;");
    ['media-cost', 'cac', 'conversions'].forEach(function(kpi) {
	animateToNumber(d3.select('.results .'+kpi), function(d) { return results[kpi]; });
    });
    
    if (resultsWithoutIA) {
	var iaPerf = getIAPerf(results);
	d3.select('.results-ia').attr("style", "display: block;");
	['learning-time', 'conversion-gain', 'cac-gain'].forEach(function(kpi) {
	    animateToNumber(d3.select('.results-ia .'+kpi), function(d) { return iaPerf[kpi]; });
	});
    }
    
    d3.select('button.launch').attr("disabled",true);
    d3.select('button.optim').attr("disabled",true);
    return results;
}

function getIAPerf(resultsWithIA) {
    var learningTime = Math.floor(- 10 * Math.log((resultsWithoutIA["conversions"]/resultsWithoutIA["cac"])/(resultsWithIA["conversions"]/resultsWithIA["cac"])));
    return {
	"learning-time": learningTime,
	"conversion-gain": resultsWithIA["conversions"] - resultsWithoutIA["conversions"],
	"cac-gain": 100*resultsWithIA["cac"]/resultsWithoutIA["cac"]
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
    return {
	"conversions": conversions,
	"cac": cac.toPrecision(3),
	"media-cost": mediaCost
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
    d3.select('button.optim').attr("disabled", null);
}


var optimum = [{}, {}, {}, {}, {}];


function optimizeByIA() {
    if (!confirm("Lancer l'IA va modifier votre parcours actuel, êtes vous sûr?")) return false;
    
    // Save campaign results without IA
    resultsWithoutIA = launchCampaign();
    retry();
    // iterate on depth, node type, parent channel, parent message
    for(var depth=4; depth >=0 ; depth--) {
	branches.forEach(function(nodeType) { branches.forEach(function(parentType) {
	    channels.forEach(function(parentChan) { messages.forEach(function(parentMsg) {
		channels.forEach(function(ancestorChan) { messages.forEach(function(ancestorMsg) {
		    var line = parentMsg + parentChan + parentType +
			ancestorMsg + ancestorChan;
		    var reach = depth > 0 ? rates[depth-1][line][nodeType] : 1;
		    
	// Conversion nodes always yield 
		    if (nodeType == "conversion") {
			optimum[depth][line + nodeType] = {
			    "message": "Conversion!",
			    "channel": "conversion",
			    "conversionRate": reach,
			    "mediaCostRate": 0
			}
		    }
	// Otherwise depth 4 nodes never yield
		    else if (depth == 4) {
			optimum[depth][line + nodeType] = {
			    "message": undefined,
			    "channel": undefined,
			    "conversionRate": 0,
			    "mediaCostRate": 0
			}
		    }
		    
	// For all the other nodes, dyn prog
		    else {
			var optimalValue = 0;
			channels.forEach(function(chan) { messages.forEach(function(msg) {
			    var mediaCostRate = channelDetails[chan].cost,
			    	conversionRate = 0,
				newLine = msg + chan + nodeType + parentMsg + parentChan;
			    branches.forEach(function(type) {
				mediaCostRate += rates[depth][newLine][type] * optimum[depth+1][newLine + type].mediaCostRate;
				conversionRate += rates[depth][newLine][type] * optimum[depth+1][newLine + type].conversionRate;
			    });
			    var value = conversionRate * conversionRate / mediaCostRate;
			    if (optimalValue < value) {
				optimalValue = value;
				optimum[depth][line + nodeType] = {
				    "message": msg,
				    "channel": chan,
				    "conversionRate": conversionRate,
				    "mediaCostRate": mediaCostRate,
				    "nextOptimum": newLine
				};
			    }
			})})
		    }
		})})
	    })})
	});});
    }

    // setup the optimal path
    
    function _optimalStep(node, line) {
	/* Sets the optimal message for node N with previous steps stored in line */
	return new Promise(function(resolve) {
	    animateSubtree(node, Math.floor(Math.random() * 3) + 2).then(function() {
		optimum[node.depth][line].name = optimum[node.depth][line].message;
		node._updateStepData(optimum[node.depth][line]);
		update(node);
		if (node.children) {
		    for (var chInd = 0; chInd < node.children.length; chInd++) {
			var child = node.children[chInd];
			_optimalStep(child, optimum[node.depth][line].nextOptimum + child.data.type).then(() => resolve());
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
		sleep(100).then(function() { animateSubtree(node, iterations - 1).then(() => resolve()) })
	    }
	});
    }
    // initial line
    _optimalStep(root, messages[0] + channels[0] + branches[0] + messages[0] + channels[0] + branches[1])
	.then(function() { console.log('Launching'); launchCampaign() });
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
