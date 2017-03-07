
var currentNode = null;

// Set the dimensions and margins of the diagram
var margin = {top: 0, right: 90, bottom: -20, left: 30},
    width = 960 - margin.left - margin.right,
    height = 920 - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("div#kour").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .attr("class", "parcours")
    .append("g")
    .attr("transform", "translate("
          + margin.left + "," + margin.top + ")");

var i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

    

// Assigns parent, children, height, depth
root = d3.hierarchy(treeData, function(d) { return d.children; });
root.x0 = height / 2;
root.y0 = 0;

function updateSvgSize(height) {
    //svg = d3.select("div#kour svg")
	//.attr("height", height + margin.top + margin.bottom);
    root.x0 = height / 2;
    //treemap = d3.tree().size([height, width]);
    update(root);
}


// Adds a few functions to nodes object
root.__proto__.updateStep = function() {
    this._updateStepData({
	"channel": d3.select("#canal").property('value'),
	"name": messageDetails[d3.select("#message").property('value')].name,
	"message": d3.select("#message").property('value')
    });
    update(this); 
}

root.__proto__._updateStepData = function(stepData) {
    this.data.channel = stepData.channel;
    this.data.name = stepData.name;
    this.data.message = stepData.message;
    this._children = null;
    if (!(this.children) && this.depth < 3 && this.data.type != "conversion") {
	svgHeight = d3.select("div#kour svg").attr("height");
	if (this.depth == 2 && svgHeight < 700) updateSvgSize(2 * svgHeight);
	this.addNode({"name": NOUV_ETAPE, "channel": "new", "type": "negative"});	
        this.addNode({"name": NOUV_ETAPE, "channel": "new", "type":"engagement"});
	this.addNode({"name": "Conversion!", "channel": "buyer", "type":"conversion"});
    }
    this._updateNodeReach();
}

root.__proto__._updateNodeReach = function () {
    this.data.reach = this.getNodeReach();
    if (this.children) {
	this.children.forEach(function(child) { child._updateNodeReach(); });
    }
}

root.__proto__.getNodeReach = function() {
    // returns how many people are reached by this node's message
    if (!this.parent) {
	return INITIAL_REACH;
    }
    var line = this.parent.data.message +
	this.parent.data.channel +
	this.parent.data.type +
	(this.parent.parent ? this.parent.parent.data.message : "none") +
	(this.parent.parent ? this.parent.parent.data.channel : "none") +
	this.parent.getPreviousEmailsAndSmsNumber();

    return Math.round(this.parent.data.reach * rates[this.parent.depth][line][this.data.type]);
}


root.__proto__.getPreviousEmailsAndSmsNumber = function () {
    var email_nb = 0, sms_nb = 0;
    if (!this.parent) return "00";
    var grandparent = this.parent.parent;
    if (grandparent) {
	if (grandparent.data.channel == "email") email_nb++;
	if (grandparent.data.channel == "sms") sms_nb++;
	if (grandparent.parent) {
	    if (grandparent.parent.data.channel == "email") email_nb++;
	    if (grandparent.parent.data.channel == "sms") sms_nb++;
	}
    }
    return ""+ email_nb + sms_nb;
}

root.__proto__.addNode = function(data) {
    child = d3.hierarchy(data);
    child.parent = this;
    child.children = null;
    child.depth = this.depth + 1;
    if (!this.children) {
	this.children = []
    }
    child._updateNodeReach();
    this.children.push(child);
}

// Collapse the node and all its children
root.__proto__.collapse = function () {
    if(this.children) {
	this._children = this.children;
	this._children.forEach(function(child) { child.collapse(); });
	this.children = null;
    }
}

// Collapse after the second level
root.collapse()

update(root);

function update(source) {

    // Assigns the x and y position for the nodes
    var treeData = treemap(root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
	links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 180});

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = svg.selectAll('g.node')
	.data(nodes, function(d) {return d.id || (d.id = ++i); });
        
    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
	.attr('class', 'node')
	.attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
	})

    // Add image for the nodes
    nodeEnter.append('image')
	.attr('class', 'node')
	.attr("x",-ICON_SIZE/2).attr("y",-ICON_SIZE)
	.attr("width", ICON_SIZE).attr("height",ICON_SIZE)
        
    // Filter out the root node
    var midPath = nodeEnter.filter(function(d) { return d.parent; }).append('g')
	.attr('class', 'midpath');

    // Add KPI boxes for the branches
    midPath.append('g')
	.append('rect')
	.attr('width', 48).attr('height', 28)
	.attr('x',-22).attr('y', -12)
	.attr('fill', 'white')
	.attr('stroke','black');
    var kpis = midPath.select('g')
	.append('text').attr('fill', function(d) { return branchDetails[d.data.type].textColor; })
    kpis.append('tspan')
	.attr('x', '-13').attr('y','-10').attr('dy',"1em")
	.attr('class', 'reach')
	.text(function(d) { return formatNumber(d.data.reach); });
    kpis.append('tspan')
	.attr('x', '-13').attr('y','-10').attr('dy',"2em")
    	.attr('class', 'percent')
	.attr('style', 'display: none;')
	.text(function(d) {
	    var ctr = 100*d.data.reach / d.parent.data.reach;
	    return (ctr < 99.5 ? ctr.toPrecision(2) : ctr.toPrecision(3)) +"%";
	});

    

    // Add image labels for the branches
    midPath.append('image')
	.attr('class', 'node branch')
	.attr("xlink:href", function(d) { return branchDetails[d.data.type] + ".png"; })
	.attr("width", ICON_SIZE * 0.8).attr("height",ICON_SIZE * 0.8)

    // Add labels for the nodes
    nodeEnter.append('text')
	.attr("dy", ".35em")
	.attr("x",0)
	.attr("y", -ICON_SIZE-5)
	.attr("text-anchor", "middle")
	.attr("class","label");

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);
    
    nodeUpdate.select("text.label").text(function(d) { return d.data.name });
    nodeUpdate.select("image").attr("xlink:href",function(d) { return d.data.channel+".png"; })
	.filter(function(d) { return d.data.type != "conversion"; })
	.attr("data-toggle","modal")
	.attr("data-target","#myModal")
    	.attr("data-remote","")
	.on('click', click)
	.on('contextmenu', rightclick);

    nodeUpdate.select("g")
	.attr("transform", function(d) {
	    return "translate("+ (-180*0.5) + "," + (d.parent ? (d.parent.x - d.x)*0.5 : 0) + ")";
	}).select('image')

    // Transition to the proper position for the node
    nodeUpdate.transition()
	.duration(duration)
	.attr("transform", function(d) { 
            return "translate(" + d.y + "," + d.x + ")";
	});

    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
	.duration(duration)
	.attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
	})
	.remove();

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
	.style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
	.data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
	.attr("class", "link")
	.attr('d', function(d){
            var o = {x: source.x0, y: source.y0}
            return diagonal(o, o)
	});

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
	.duration(duration)
	.attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
	.duration(duration)
	.attr('d', function(d) {
            var o = {x: source.x, y: source.y}
            return diagonal(o, o)
	})
	.remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
	d.x0 = d.x;
	d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

	path = `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
        ${(s.y + d.y) / 2} ${d.x},
        ${d.y} ${d.x}`

	return path
    }
    function click(d) {
	currentNode = d;
	update(d);
    }
    function rightclick(d) {
	d3.event.preventDefault();
	// if the node has been set
	if (channels.indexOf(d.data.channel) >= 0 &&
	    messages.indexOf(d.data.message) >=0 &&
	    confirm("Réinitialiser cette étape? (supprime les étapes filles)")) {
	    d.data.channel = "new";
	    d.data.message = NOUV_ETAPE;
	    d.data.name = NOUV_ETAPE;
	    d.children = null;
	}
	update(d);
    }

}

function formatNumber(num) {
    // Formats a number with K for 1000s, M for millions, with a precision of 2
    switch (Math.floor(Math.log10(num))) {
    case 0:
    case 1:
	return num.toPrecision(2);
    case 2:
	return num.toPrecision(3);
    case 3:
    case 4:
    case 5:
	return (num/1000).toPrecision(3) + "K";
    case 6:
    case 7:
    case 8:
	return (num/1000000).toPrecision(3) + "M";
    default:
	return num.toPrecision(3);	
    }
}
