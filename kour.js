
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
    midpaths.select('image').attr("style","display: none;");
    d3.selectAll("image.node").attr("data-toggle","").on('click', null).on('contextmenu', null);

    // Display results
    var results = getCampaignResults();
    d3.select('.results').attr("style", "display: block;");
    ['media-cost', 'cac', 'conversions'].forEach(function(kpi) {
	d3.select('.results .'+kpi).text(formatNumber(results[kpi]));
    });
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

var optimum = [{}, {}, {}, {}, {}];
function optimizeByIA() {

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
	optimum[node.depth][line].name = optimum[node.depth][line].message;
	node._updateStepData(optimum[node.depth][line]);
	if (node.children) {
	    node.children.forEach(function(child) { _optimalStep(child, optimum[node.depth][line].nextOptimum + child.data.type); });
	}
    }
    // initial line not important
    _optimalStep(root, messages[0] + channels[0] + branches[0] + messages[0] + channels[0] + branches[1]);
    update(root);
}



