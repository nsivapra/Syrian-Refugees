<!DOCTYPE html>
<!--This code is for visualizing data about the top 100 highest grossing movies in the US.
The users of the webpage can choose to cluster the movies by categories such as which studio 
produced the movie, the genre of the movie, and which decade it came out in to see trends.-->
<meta charset="utf-8">
<head>
    <meta charset="utf-8">
    <title>Top Earning Movies</title>
</head>
<body>
<script src="https://d3js.org/d3.v3.js"></script>
<!--this unordered list serves as an interactive menu for the 
user to select how they want to group the movies.-->
<ul class="menu">
    <li id="Studio" class="menu-item" onclick="studioClick(this)">Studio</li>
    <li id="Genre"  class="menu-item" onclick="genreClick(this)">Genre</li>
    <li id="Decade" class="menu-item" onclick="decadeClick(this)">Decade</li>
    <li id="Gross"  class="menu-item" onclick="grossClick(this)">Scale</li>
</ul>
<style>
    ul.menu{
        padding: 0;
    }
    ul.menu li{
        display: inline;
        background-color: black;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 4px 4px 0 0;
    }
</style>
<script>
/* code adapted from:
 *   http://bl.ocks.org/mbostock/1748247
 *   http://www.w3schools.com/html/tryit.asp?filename=tryhtml_lists_menu
 *   http://bl.ocks.org/biovisualize/1016860
 *   http://zeroviscosity.com/d3-js-step-by-step
 * 
 * modified by Lev Stefanovich for CMPS 165 at UCSC
 * 
 * data from boxofficemojo.com. Top 100 all time domestic gross, not adjusted for inflation.
 */ 
var movies, svg, grossScale;
    
var width = 960,         // dimensions of the visualization 
    height = 520,
    padding = 2,         // separation between same-color circles
    clusterPadding = 15, // separation between different-color circles
    maxRadius = 38,      // maximum size of a circle
    minRadius = 0.5,     // minimum size of a circle
    margin = 50;
/* --
exercises: try changing max radius to 6, to 20
ask why var movies; outside of the data loading callback does not work    
todo: 
add support for third category [done!]
add a scale
add a legend
 - add legend title
 - add legend data [done!]
make code better so it does not reload data every time
*/
 
// This function takes a year and gives the decade of that year, rounding down
// so 1992 and 1997 both become 1990, since they are considered the 90's
function roundToDecade(year) { 
    var head = year - year % 100; // year minus the two last numbers
    var tail = Math.floor( (year % 100) / 10) * 10; // two last numbers rounded down
    return head + tail;
};
/* The initialize function will load the data and basically do everything.
 * In practice, this is inefficient since the data is re-loaded every time the 
 * use wants to cluster the data by a different category, to it would be good
 * to split out the clustering into a different function.
 */
d3.csv("SyrianRefugee.js", function(data) {
    data.forEach(function(d) {
        d.year = +d.year; //year dealt with
        d.country = d.country; //Country of Residence
        d.population = +d.population; //Population of country
        d.refugee = +d.refugee; //number of refugees
});
/* This function will create the visualization based on the category selected by the user */
function initialize(category){
    d3.selectAll("svg").remove(); // first we remove the exising visualization, if there is one
        // the code below will count number of distinct elements in the category 
        // recall that 'category' is a parameter passed to this function, and will
        // depend on which button was clicked in the menu. It could be "Studio" for example
        var categories = d3.map(movies, function(d) { return d.category; });
        var m = 13;
        
        var n = movies.length; // total number of circles
        var color = d3.scale.category20(); // this is a scale used to map categories to colors
        /* Here we figure out the maximum and minimum values in the Gross column of the data 
         * (how much money the movie made), so that we can create a radiusScale which we will 
         * use to resize the circles in our visualization. We need to scale the values since 
         * the max gross is 934940519 and we need to convert that to a reasonable amount of pixels
         * to display. The D3 scale makes this relatively easy, since if we add a new movie to the data 
         * it will automatically be taken into account, and if we want larger or smaller circles later on 
         * we just need to change the min/maxRadius variables we defined above.
         */ 
        var minGross = d3.min(movies, function(d){ return d.Gross; });
        var maxGross = d3.max(movies, function(d){ return d.Gross; });
        var radiusScale = d3.scale.linear()
            .domain([minGross, maxGross])
            .range([minRadius,maxRadius]);
        /* The largest node for each cluster. This is used in the 'cluster' function
         * to make each node cluster around the largest node of it's category
         */
        var clusters = new Array(m);
        /* nodes becomes an array that contains the 200 randomly generated circles
         * each node contains information on which of the 10 clusters it belongs to, 
         * its x and y coordinates, and its radius. Explore the nodes array by typing
         * 'nodes' in the developer console
         */
        var nodes = movies.map(function(currentValue, index) {
            /* currentValue will be bound to each element in the 'movies' array.
             * This is a way to iterate through all the movies, and create one node 
             * for each movie. Recall that 'category' can be Studio, Genre, or Decade
             * based on which button the user clicked. So currentValue[category] will become
             * the Studio/Genre/Decade of each movie. For example, if the user clicked the Genre
             * button, the node created for a Star Wars movie would get i = "Sci-Fi". 
             * We will later use the property d.cluster to assign a color to each movie based
             * on its category.
             */  
            var i = currentValue[category],  
              r = radiusScale(currentValue.Gross),
              d = {cluster: i, 
                   radius: r, 
                   Title: currentValue.Title,
                   Genre: currentValue.Genre,
                   Gross: currentValue.Gross,
                   Year: currentValue.Year,
                   Studio: currentValue.Studio};
          // if this is the largest node for a category, add it to 'clusters' array
          if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
          return d;
        });
        /* This creates a force that will be applied to all the nodes, causing them
         * to cluster together, but not overlap. The way the force behaves is defined later in 
         * the 'cluster' and 'collide' functions
         */
        var force = d3.layout.force()
            .nodes(nodes)
            .size([width, height])
            .gravity(0)
            .charge(0) //attractive force between nodes. Negative values makes nodes repel
            .on("tick", tick) 
            .start();
        // Create an SVG element of size width x height that contains the graph
        svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);
        /* -- Add all the nodes to the SVG --
         * This is the most important segment of code. It is using the usual D3 approach of selecting 
         * all the circles (even before they have been created), binding the data to them (this time
         * from the 'nodes' array), and then actually creating the elements with the 'enter().append()'
         * method.
         */ 
        var circle = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")   
            .attr("r", function(d) { return d.radius; }) // set the radius of each circle to d.radius
            .style("fill", function(d) { return color(d.cluster); }) // set the color of each circle 
        svg.selectAll("circle").call(force.drag);
        // a simple tooltip from http://bl.ocks.org/biovisualize/1016860
        var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        /* If you want to put a box around the tooltip, comment out the following two lines
         * You may want to change the CSS style of the tooltip further to make it pretty */
        //.style("background-color", "lightgrey")
        //.style("color", "grey")
        .style("font-family", "sans-serif"); 
        /* Adding mouseover functions to the tooltip so that it appears
         * only when the user's mouse is over a node, and text changes accordingly
         * to match the movie the user is hovering over
         */
        svg.selectAll("circle")
            .on("mouseover", function(d){
                return tooltip.style("visibility", "visible")
                .text(d.Title +":    $"+Math.round(d.Gross)+" mil");})
            .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px")
                .style("left",(d3.event.pageX+10)+"px");})
            .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
        /* -- Adding a legend --
         * code adapted from http://zeroviscosity.com/d3-js-step-by-step
         * Here, we will add a simple legend that basically consists of one color square for each category,
         * and text describing what each color represents. It may not be clear how this legend knows about
         * all the studios, genres, or decades, since nothing about that is mentioned; it gets all it needs from 
         * .data(color.domain()). Remeber that 'color' is a D3 scale that we used to decide the color of each 
         * node based on what studio produced it (or its genre, or decade). D3 scales can automatically infer 
         * their domain (the various possible studios for example), so as long as we have used the color scale
         * it will have a list of all the studios under color.domain(). The other important part to note is that
         * when we 'transform' the legend elements we vertically offset each element by i * height; height
         * is just the size of each legend block plus the margin, i is the array index, so the ith element of the
         * array will be displayed i*height from the top of the legend.  
         */
        var legendBlockSize = 18, legendSpace = 4; // how large each legend element is, and the margin between them
        var legend = svg.selectAll(".legend")
            .data(color.domain())
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i){
                var legendHeight = legendBlockSize + legendSpace;
                var horz = 0; // horizontal offset, change this to move where the legend appears
                // vertical offset is based on i, so it will be different for each category
                var vert = i * legendHeight; 
                return "translate(" +horz+", "+vert+")";
        });
        // adds the colored squares to the legend
        legend.append("rect") 
            .attr("width", legendBlockSize)
            .attr("height", legendBlockSize)
            .style("fill", color);
        // adds text to the legend, here 'd' is the category 
        legend.append("text")
            .attr("x", legendBlockSize + legendSpace)
            .attr("y", legendBlockSize)
            .text(function(d) {return d;});
        // update circles on each 'tick' of the simulation
        function tick(e) {
          circle
              .each((category == "Gross") ? clusterGross(10*e.alpha*e.alpha) : cluster(10*e.alpha*e.alpha))
              .each(collide(.5))
              .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        }
        /* Move node d to be adjacent to the clusters largest node.
         * d is each node, cluster is the largest node in the same cluster as d
         * l is the distance between a node and the largest node of its cluster
         * r is the sum of radiuses of the node and its cluster boss. 
         * basically if the distance between a node and its cluster boss is not the
         * sum of their radiuses, then this function moves them closer together.  
         */
        function cluster(alpha) {
          return function(d) {
            var cluster = clusters[d.cluster],
                k = 1;
            // For cluster nodes, apply custom gravity.
            if (cluster === d) {
              cluster = {x: width / 2, y: height / 2, radius: -d.radius};
              k = .1 * Math.sqrt(d.radius);
            }
            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + cluster.radius;
            if (l != r) {
              l = (l - r) / l * alpha * k;
              d.x -= x *= l;
              d.y -= y *= l;
              cluster.x += x;
              cluster.y += y;
            }
          };
        }
        
        function clusterGross(alpha) {
          return function(d) {
            var cluster = {x: grossScale(d.Gross), 
                           y: height / 2, 
                           radius: -d.radius};
              
            var k = .1 * Math.sqrt(d.radius);
            
            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + cluster.radius;
            if (l != r) {
              l = (l - r) / l * alpha * k;
              d.x -= x *= l;
              d.y -= y *= l;
              cluster.x += x;
              cluster.y += y;
            }
          };
        }
        // Resolves collisions between d and all other circles.
        function collide(alpha) {
          var quadtree = d3.geom.quadtree(nodes);
          return function(d) {
            var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
              if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + 
                        (d.cluster === quad.point.cluster ? padding : clusterPadding);
                if (l < r) {
                  l = (l - r) / l * alpha;
                  d.x -= x *= l;
                  d.y -= y *= l;
                  quad.point.x += x;
                  quad.point.y += y;
                }
              }
              return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
          };
        }
};
    
/* code adapted from https://bl.ocks.org/mbostock/3885304 */
function addScale(){
    svg.selectAll(".legend").remove();
    grossScale = d3.scale.linear()
        .range([0+margin, width-margin]);
    
    var xAxis = d3.svg.axis()
        .scale(grossScale)
        .orient("bottom")
        .ticks(8, "$");
    grossScale.domain([d3.min(movies, function(d) { return d.Gross; }), 
              d3.max(movies, function(d) { return d.Gross; })]);
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(0,"+height/2+")")
        .append("text")
        .text("Millions");
};
    
function studioClick(elem){
    /* This function will be executed when the user clicks on the "Studio" button
     * that we created in the HTML body way at the top of this file. Remember, we 
     * set an onclick event as a property of each button with: onclick="studioClick(this)"
     * Since we passed "this" as an argument to "studioClick(this)", we are able to acces
     * the DOM element that triggered the function; here I call it "elem". 
     * Once a button is clicked, we also want to set the color of all the 
     * other buttons to the default "black", we do this by getting all DOM elements with 
     * the class "menu-item". There are other ways to do this, for example we could 
     * get each button individually by ID (eg. document.getElementById("Genre")...)
     * But then if we ever add a new button the menu we would have to add more lines.
     * Using class names means we don't have to change this code when adding new buttons,
     * so long as we remember to make "menu-item" one of their classes. 
     * However, we must be careful not to add "menu-item" class to any other element.
     */
    // Get all the buttons and set their color to black  
    var buttons = document.getElementsByClassName("menu-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    // Set the color of the clicked button to orange
    elem.style.backgroundColor="orange";
    // Run the initialize function clustering movies by "Studio"
    initialize("Studio");
};
function genreClick(elem){
    /* This example shows how to get the buttons individually by ID.
     * You can see that if you want to add a new button, you have to 
     * remember to modify this code. However, this approach would be 
     * useful if you want the buttons to behave differently
     */ 
    document.getElementById("Studio").style.backgroundColor="black";
    document.getElementById("Decade").style.backgroundColor="black";
    document.getElementById("Gross").style.backgroundColor="black";
    elem.style.backgroundColor="orange";
    initialize("Genre");
};
function decadeClick(elem){
    var buttons = document.getElementsByClassName("menu-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="orange";
    initialize("Decade");
};
function grossClick(elem){
    var buttons = document.getElementsByClassName("menu-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="orange";
    initialize("Gross");
    addScale();
};
</script>