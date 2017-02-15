
function launchCampaign() {
    // Change new nodes into "end" nodes and add conversion boxes for end nodes
    var treeData = treemap(root);
    var nodes = treeData.descendants();
    nodes.forEach(function(node) {
	if (node.data.channel == "new") {
	    node.data.channel = "stop";
	    node.data.name = "";
	} else if (node.children == null && node.data.type != "conversion") {
	    addNode(node, {"name": "Conversion!", "channel": "conversion", "type":"conversion", "reach": getNewNodeReach(node, "conversion") });
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

function optimizeByIA() {
    
			 
}
