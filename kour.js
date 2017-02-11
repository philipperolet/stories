var ICON_SIZE = 20;
var NOUV_ETAPE = "Créer Etape";
var currentNode = null;
var channelImages = {
    "facebook": "fb.png",
    "display": "display.png",
    "email": "email.png",
    "new": "step-forward.svg",
    "conversion": "shopping-cart.svg"
};
var branchTypes = {
    "conversion": {"image":"euro.svg", "textColor":"blue"},
    "positive": {"image":"add.png", "textColor":"green"},
    "negative": {"image":"minus.png", "textColor":"red"}
}

var treeData =
    {
	"name": NOUV_ETAPE,
	"channel": "new",
	"children": [
	    { 
		"name": "Level 2: A",
	    },
	    { "name": "Level 2: B" }
	]
    };

// Set the dimensions and margins of the diagram
var margin = {top: -20, right: 90, bottom: -20, left: 30},
    width = 960 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("div#kour").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
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

// Collapse after the second level
collapse(root);

update(root);

// Collapse the node and all it's children
function collapse(d) {
    if(d.children) {
	d._children = d.children
	d._children.forEach(collapse)
	d.children = null
    }
}

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
	.filter(function(d) { return d.data.type != "conversion"; })
	.attr("data-toggle","modal")
	.attr("data-target","#myModal")
	.on('click', click)
	.on('contextmenu', rightclick);
        

    var midPath = nodeEnter.filter(function(d) { return d.data.type; }).append('g')
	.attr('class', 'midpath');

    // Add KPI boxes for the branches
    midPath.append('g')
	.append('rect')
	.attr('width', 30).attr('height', 24)
	.attr('x',-15).attr('y', -10)
	.attr('fill', 'white')
	.attr('stroke','black');
    var kpis = midPath.select('g')
	.append('text').attr('fill', function(d) { return branchTypes[d.data.type].textColor; })
    kpis.append('tspan').attr('x', '-13').attr('y','-10').attr('dy',"1em").text("1000");
    kpis.append('tspan').attr('x', '-13').attr('y','-10').attr('dy',"2em").text('100%');

    // Add image labels for the branches
    midPath.append('image')
	.attr('class', 'node branch')
	.attr("xlink:href", function(d) { return branchTypes[d.data.type].image; })
	.attr("width", ICON_SIZE/2.0).attr("height",ICON_SIZE/2.0)

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
    nodeUpdate.select("image").attr("xlink:href",function(d) { return channelImages[d.data.channel] });
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
	if (d.children) {
	} else {
	    d.parent.children = null;
	    d3.event.preventDefault();
	}
	update(d.parent);
    }

}

function change_step(d) {
    d.data.channel = d3.select("#canal").property('value');
    d.data.name = d3.select("#message").property('value');
    d._children = null;
    if (!(d.children) && d.depth < 3 && d.data.type != "conversion") {
        addNode(d, {"name": NOUV_ETAPE, "channel": "new", "type":"positive"});
	addNode(d, {"name": NOUV_ETAPE, "channel": "new", "type": "negative"});	
	addNode(d, {"name": "Conversion!", "channel": "conversion", "type":"conversion"});
    }
    update(d);
}

function addNode(parentNode, data) {
    child = d3.hierarchy(data);
    child.parent = parentNode;
    child.children = null;
    child.depth = parentNode.depth + 1;
    if (!parentNode.children) {
	parentNode.children = []
    }
    parentNode.children.push(child);
}

function getBranchImage(d) {
    // Returns the little image below the tree branch
    // to indicate the kind of
    imageMap = {
	"conversion": "euro.svg",
	"positive": "add.png",
	"negative": "minus.png"
    }
    if (d.data.type) return imageMap[d.data.type];
    return "";
}

function launchCampaign() {
    midpaths = d3.selectAll("g.midpath");
    midpaths.select('g').attr("style","display: block;");
    midpaths.select('image').attr("style","display: none;");
    d3.selectAll("image.node").attr("data-toggle","").on('click', null).on('contextmenu', null);
}
