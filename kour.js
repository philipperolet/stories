var ICON_SIZE = 20;
var NOUV_ETAPE = "Créer Etape";
var currentNode = null;
var treeData =
    {
	"name": NOUV_ETAPE,
	"image": "step-forward.svg",
	"children": [
	    { 
		"name": "Level 2: A",
		"children": [
		    { "name": NOUV_ETAPE },
		    { "name": NOUV_ETAPE }
		]
	    },
	    { "name": "Level 2: B" }
	]
    };

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 960 - margin.left - margin.right,
    height = 415 - margin.top - margin.bottom;

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
    
    node.select("text").text(function(d) { return d.data.name });
    node.select("image").attr("xlink:href",function(d) { return d.data.image });
    node.attr("data-toggle","modal");
    node.attr("data-target","#myModal");

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
	.attr('class', 'node')
	.attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
	})
	.on('click', click)
	.on('contextmenu', rightclick);

    // Add image for the nodes
    nodeEnter.append('image')
	.attr('class', 'node')
	.attr("xlink:href", function(d) { return d.data.image ? d.data.image : "step-forward.svg"; })
	.attr("x",-ICON_SIZE/2).attr("y",-ICON_SIZE)
	.attr("width", ICON_SIZE).attr("height",ICON_SIZE)
    
    // Add image labels for the branches
    nodeEnter.append('image')
	.attr('class', 'node')
	.attr("xlink:href", function(d) {
	    if (d.depth == 0) return "";
	    return d.data.interaction ? "add.png" : "minus.png"; })
	.attr("x",-ICON_SIZE*1.5).attr("y", ICON_SIZE/3.0)
	.attr("width", ICON_SIZE/2.0).attr("height",ICON_SIZE/2.0)
    
    // Add labels for the nodes
    nodeEnter.append('text')
	.attr("dy", ".35em")
	.attr("x",0)
	.attr("y", -ICON_SIZE-10)
	.attr("text-anchor", "middle")
	.text(function(d) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

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
    d.data.image = d3.select("#canal").property('value');
    d.data.name = d3.select("#message").property('value');
    d._children = null;
    if (!(d.children) && d.depth < 3) {
        addNode(d, {"name": NOUV_ETAPE, "image": "step-forward.svg", "interaction": "True"});
	addNode(d, {"name": NOUV_ETAPE, "image": "step-forward.svg"});
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
