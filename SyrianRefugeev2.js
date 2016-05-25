<!DOCTYPE html>

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
    <li id="Continent"  class="menu-item" onclick="genreClick(this)">Continent</li>
    <li id="Year" class="menu-item" onclick="decadeClick(this)">Year</li>
    <li id="Refugee"  class="menu-item" onclick="grossClick(this)">Scale</li>
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

var movies, svg, grossScale;
    
var width = 960,         // dimensions of the visualization 
    height = 520,
    padding = 2,         // separation between same-color circles
    clusterPadding = 15, // separation between different-color circles
    maxRadius = 38,      // maximum size of a circle
    minRadius = 10,     // minimum size of a circle
    margin = 50;

d3.csv("top100.csv", function(data) {
    movies = data;
    movies.forEach(function(d) {
        d.Refugee = +d.Refugee; // cast the dollar amount from string to integer
        d.Year = +d.Year; // create a new category in the data called Decade 
    });
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
        
        var minGross = d3.min(movies, function(d){ return d.Refugee; });
        var maxGross = d3.max(movies, function(d){ return d.Refugee; });
        var radiusScale = d3.scale.linear()
            .domain([minGross, maxGross])
            .range([minRadius,maxRadius]);
        
        var clusters = new Array(m);
        
        var nodes = movies.map(function(currentValue, index) {
              
            var i = currentValue[category],  
              r = radiusScale(currentValue.Refugee),
              d = {cluster: i, 
                   radius: r, 
                   Country: currentValue.Country,
                   Continent: currentValue.Continent,
                   Refugee: currentValue.Refugee,
                   Year: currentValue.Year,
                   Population: currentValue.Population};
          // if this is the largest node for a category, add it to 'clusters' array
          if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
          return d;
        });
        
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
         
        var circle = svg.selectAll("circle")
            .data(nodes)
            .enter().append("circle")   
            .attr("r", function(d) { return d.radius; }) // set the radius of each circle to d.radius
            .style("fill", function(d) { return color(d.cluster); }) // set the color of each circle 
        svg.selectAll("circle");
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
        .style("width", "200px")
        .style("height", "60px")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")          
        .style("font-family", "sans-serif"); 
        /* Adding mouseover functions to the tooltip so that it appears
         * only when the user's mouse is over a node, and text changes accordingly
         * to match the movie the user is hovering over
         */
        svg.selectAll("circle")
            .on("mouseover", function(d){
                return tooltip.style("visibility", "visible")
                .text(d.Country +":    "+(d.Refugee) + '\n' + "Year: " + d.Year);})
            .on("mousemove", function(){return tooltip.style("top", (d3.event.pageY-10)+"px")
                .style("left",(d3.event.pageX+10)+"px");})
            .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
        
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
              .each((category == "Refugee") ? clusterGross(10*e.alpha*e.alpha) : cluster(10*e.alpha*e.alpha))
              .each(collide(.5))
              .attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        }
        
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
            var cluster = {x: grossScale(d.Refugee), 
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
        .ticks(8, " ");
    grossScale.domain([d3.min(movies, function(d) { return d.Refugee; }), 
              d3.max(movies, function(d) { return d.Refugee; })]);
    
    svg.append("g")
        .attr("class", "x axis")
        .call(xAxis)
        .attr("transform", "translate(0,"+height/2+")")
        .append("text")
        .text("Millions");
    
        
svg.append("rect")
        .attr("x", width-250)
        .attr("y", height-190)
        .attr("width", 220)
        .attr("height", 180)
        .attr("fill", "lightgrey")
        .style("stroke-size", "1px");

    svg.append("circle")
        .attr("r", 5)
        .attr("cx", width-100)
        .attr("cy", height-175)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 15.8)
        .attr("cx", width-100)
        .attr("cy", height-150)
        .style("fill", "white");

    svg.append("circle")
        .attr("r", 50)
        .attr("cx", width-100)
        .attr("cy", height-80)
        .style("fill", "white");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-172)
        .style("text-anchor", "end")
        .text(" 1 to 10 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-147)
        .style("text-anchor", "end")
        .text(" 10 to 50 Million");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-77)
        .style("text-anchor", "end")
        .text(" 50 Million Plus");

    svg.append("text")
        .attr("class", "label")
        .attr("x", width -150)
        .attr("y", height-15)
        .style("text-anchor", "middle")
        .style("fill", "Green") 
        .attr("font-size", "20px")
        .text("Population");   
};
    
function genreClick(elem){
     
    document.getElementById("Year").style.backgroundColor="black";
    document.getElementById("Refugee").style.backgroundColor="black";
    elem.style.backgroundColor="orange";
    initialize("Continent");
};
function decadeClick(elem){
    var buttons = document.getElementsByClassName("menu-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="orange";
    initialize("Year");
};
function grossClick(elem){
    var buttons = document.getElementsByClassName("menu-item");
    for(i = 0; i < buttons.length; ++i){
        buttons[i].style.backgroundColor="black";
    }
    elem.style.backgroundColor="orange";
    initialize("Refugee");
    addScale();
}; 
</script>