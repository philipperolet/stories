// Data and labels

var NOUV_ETAPE = "Créer Etape";

var channels = ["facebook", "display", "email"];
var messages = ["Humour", "Pratique", "Pas cher"];

var branchTypes = {
    "conversion": {"image":"euro.svg", "textColor":"blue"},
    "engagement": {"image":"add.png", "textColor":"green"},
    "negative": {"image":"minus.png", "textColor":"red"}
}

var treeData =
    {
	"name": NOUV_ETAPE,
	"channel": "new",
	"reach": 1000000,
	"children": [
	    { 
		"name": "Level 2: A",
	    },
	    { "name": "Level 2: B" }
	]
    };
