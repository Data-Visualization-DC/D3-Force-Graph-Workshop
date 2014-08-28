function rawForceGraph(nodeArray) {

    margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = $(window).width() - margin.left - margin.right,
        height = $(window).height() - margin.top - margin.bottom;
        // height = 1100 - margin.top - margin.bottom;

    var max_r = 25,
        min_r = 5,
        initial_scale = 0.3,
        initial_width_translate = width/4,
        initial_height_translate = height/4,
        initialize = true,
        nodes2explore = false; //d3.select('body').node();

    zoom = d3.behavior.zoom()
        .scaleExtent([0.1, 20])
        .on("zoom", zoomed);

    drag = d3.behavior.drag()
        .origin(function(d) { 
            return d; 
        })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    force = d3.layout.force()
        .gravity(1)
        // .distance(110)
        .linkDistance(function(d) {return ((1-d.strength)*100)})
        .linkStrength(function(d) {return d.strength})
        .friction(0.15)
        .charge(function(d) {
            var numLinks = d.source.length;
            return -(100 + 1000*numLinks)
        })
        .size([width, height]);

    var nodes = force.nodes(),
        links = force.links(),
        node_hash = new Array(),
        link_hash = new Array(),
        chosenNodes = [],
        chosenLinks = [];

    // var cluster_nodes = force.nodes();
    // var cluster_links = force.links();

    this.nodesLinked = function (theseLinks,nid1) {
        return $.grep(theseLinks, function(e){ return (e.source == nid1 || e.target == nid1) }).length>0;
    }

    this.anyLinks = function (theseLinks,nid) {
        return $.grep(theseLinks, function(e){ return (e.source == nid || e.target == nid) }).length>0;
    }

    this.initialize = function () {

        // Determine the deepest depth for each cluster
        // for (var cid=0; cid<clusterArray.length; cid++) {
        //     cluster_nodes[cid] = clusterArray[cid];
        // }

        // nodeArray.sort( function(a,b) {return a.id - b.id});
        nodeArray.sort( function(a,b) {return a.id - b.id});
        // for (var nid=0; nid<nodeArray.length; nid++) {
        //     // node_hash[String(nodeArray[nid].id)] = nid;
        //     // nodes[nid] = nodeArray[nid];
        //     // nodes[nid].x = width/2;
        //     // nodes[nid].y = height/2;
        // }
        // // linkArray.sort( function(a,b) {return a.source.id - b.source.id});
        // for (var lid=0; lid<linkArray.length; lid++) {
        //     // link_hash['source'][String(linkArray[lid].source.id)] = lid;
        //     // link_hash['target'][String(linkArray[lid].target.id)] = lid;
        //     // links[lid] = linkArray[lid];
        // }

        // BUILD THE CONTAINER - BUILD THE CONTAINER - BUILD THE CONTAINER
        
        // Container
        // vis = d3.select("#network-container")
        //   .append("canvas")
        //     .attr("id","network-container-canvas");
        vis = d3.select("#network-container")
          .append("svg")
            .attr("id","network-container-svg")
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("transform", "translate(" + initial_width_translate + "," + initial_height_translate + ")scale(" +String(initial_scale)+ ")")
            .call(zoom)
                .on("dblclick.zoom", null);
        
        // Gradient
        // http://stackoverflow.com/questions/20837147/draw-a-d3-circle-with-gradient-colours
        // https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients
        // http://jsfiddle.net/JokesOnYou77/Wduqt/
        var gradient = vis.append("svg:defs")
            // .append("svg:linearGradient")
            .append("svg:radialGradient")
            .attr("id", "gradient")
            //.attr("x1", "0%")
            //.attr("y1", "0%")
            //.attr("x2", "100%")
            //.attr("y2", "100%")
            .attr("spreadMethod", "pad");

        gradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#FFFFFF")
            .attr("stop-opacity", 1);

        gradient.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#B0B0B0")
            .attr("stop-opacity", 1);
        
        // Container background
        rect = vis.append("rect")
            .attr("id","graph-rectangle-cover")
            .attr("width", width/initial_scale)
            .attr("height", height/initial_scale)
            .attr("x",-initial_width_translate/initial_scale)
            .attr("y",-initial_height_translate/initial_scale)
            .attr("fill", 'url(#gradient)')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            // .attr('viewBox', "0 0 " +String(width)+" "+String(height)+"")
            //.style("fill", "#E0E0E0")
            .style("pointer-events", "all");
        
        // $('#graph-rectangle-cover', vis.root())
        //     .attr('preserveAspectRatio', 'xMinYMin meet')
        //     .attr('viewBox', '0 0 100 50');

        container = vis.append("g");

        bodyNode = d3.select('#network-container').node();
        // calcRenderNodes();
    }

    this.updateData = function () {

        // calcRenderNodes();
        // queue()
        //     .defer(calcRenderNodes())
        //     .defer(calcRenderLinks())
        //     .awaitAll(function(error, results) { console.log("all done!"); });
        calcRenderNodes();
        // console.log("Chosen: ",chosenNodes,chosenLinks)
    }

    this.update = function() {

        // var Q = queue(1);
        // var tasks = [ updateGraph, berry_legend];
        // tasks.forEach( function(t) { Q.defer(t); });
        // Q.awaitAll( function(error) { console.log("Berries Ran."); });

        updateGraph();
    }

    var updateGraph = function() {

        // First render the clusters
        // var cluster_links = container.selectAll("cluster.link").data();

        var rendered_links = container //.append("g")
                .selectAll("line.link")
                    .data(chosenLinks, function(d) {return d.source.id + "-" + d.target.id; });

        assignLinkAttributes(rendered_links);
        var line_inserts = rendered_links.enter().insert("line");
        assignLinkAttributes(line_inserts);

        rendered_links.exit().remove();

        //------------------------------------------------------------------------------

        if (initialize) {
            initialize = false;
            start_graph = true;
            // berry_legend();
        } else {
            var dom_nodes = container.selectAll('g.rendered'); //.each(function(d){ 
            for (var k=0; k<dom_nodes[0].length; k++) {
                var nid = d3.select(dom_nodes[0][k]).attr('data-nid');
                if (node_hash[nid]==undefined) { 
                    start_graph = true; 
                    break;
                    // return false; 
                }
            }
            // });
            if (start_graph) { nodes2explore = true; } 
            else { 
                nodes2explore = false;
                // notify user that there's nothing to add.
                // var absoluteMousePos = mousePosition();
                // d3.select('#network-container').append('div')
                //     .style({ left: width/2+'px',
                //              top: height/2+'px',
                //              // left: (absoluteMousePos[0].x)+'px',
                //              // top: (absoluteMousePos[1].x - 5)+'px',
                //              position: 'absolute',
                //              'padding': '5px',
                //              'background-color': '#FFFFFF',
                //              'border-width': '1px',
                //              'border-style':'solid',
                //              'border-color':'#888888',
                //              'border-radius' : '2px',
                //              'box-shadow': '5px 5px 2px #888888',
                //              'z-index': 1001,
                //              'opacity': 1 })
                //     .text("No Hidden Nodes to Explore").transition().duration(2000).remove();
            }
        };
        var rendered_nodes = container 
                    .selectAll("g.rendered")
                        .data( chosenNodes, function(d) { return d.id; } );

        assignNodeListeners(rendered_nodes);
        var node_appends = rendered_nodes.enter().append("g").attr("data-nid",function(d){return d.id}); // Replaced .id -> .index
        assignNodeListeners(node_appends);

        // Now that the g elements have been updated and added/deleted, let's add some Style!
        var non_fav_nodes = container.selectAll("g.rendered.non_favorite");
        non_fav_nodes.selectAll("polygon").remove(); //.attr("opacity",0);
        non_fav_nodes.append("circle")
            // .attr("r", function(d) {return Math.max( Math.min( d.source.length+d.target.length,max_r),min_r)})
            .attr("r", function(d) { return renderSignalGeometry(d); })
            .attr("fill",function(d) {
                return clusterColors(d.cGroup); // Color the Themes according to the Adj. Professor output.
            })
            .attr('opacity',0.7);

        var favorite_nodes = container.selectAll("g.rendered.favorite");
        favorite_nodes.selectAll("circle").remove(); //.attr('opacity',0);
        favorite_nodes.append("polygon")
            // .attr("visibility", "visible")
            .attr("points", function(d) { 
                var signalGeom = renderSignalGeometry(d);
                return CalculateStarPoints( 0, 0, 5, signalGeom, signalGeom*4/7)
            })
            .attr("fill", function(d) { return clusterColors(d.cGroup); })
            .attr('opacity',0.7);

        var no_sentiment_nodes = container.selectAll("g.rendered.no-sentiment");
        no_sentiment_nodes.selectAll("rect").attr('opacity',0);
        var sentiment_nodes = container.selectAll("g.rendered.sentiment");
        // sentiment_nodes.selectAll("rect").remove();
        sentiment_nodes.append("rect")
            .attr("width",  function(d) {return renderSignalGeometry(d)*2.5 })
            .attr("height", function(d) {return renderSignalGeometry(d)*2.5 })
            .attr("x",function(d) {return -renderSignalGeometry(d)*2.5/2})
            .attr("y",function(d) {return -renderSignalGeometry(d)*2.5/2})
            .attr("stroke",function(d) {

                if (d.tags.sentiment) {
                    return sentimentColors[d.tags.sentiment];
                }                
            })
            .attr("stroke-width",function(d) { return renderSignalGeometry(d)/3 })
            .attr("fill","none");

        rendered_nodes.exit().remove();

        
        //------------------------------------------------------------------------------
        if (start_graph) { 
            nodes2explore = false;
            force.on("tick", function() {

                rendered_links.attr("x1", function(d) { return d.source.x; })
                              .attr("y1", function(d) { return d.source.y; })
                              .attr("x2", function(d) { return d.target.x; })
                              .attr("y2", function(d) { return d.target.y; });

                rendered_nodes.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
                             // .attr("cx", function(d) { return d.x = Math.max(max_r, Math.min(width  - max_r, d.x)); })
                             // .attr("cy", function(d) { return d.y = Math.max(max_r, Math.min(height - max_r, d.y)); });
            });
            force.start();
            start_graph = false;
        };

        nodeArray.map( function(na) { na.temp_selection = false; });

        // callback(null);
    }
//------------------------------------------------------------------------------------------------

    function colorByGroup(d) { return clusterColors(d.cGroup); }

    function zoomed() {
        var d3_scale = d3.event.scale;
        // var d3_translate = [ initial_width_translate  + d3.event.translate[0],
        //                      initial_height_translate + d3.event.translate[1] ];
        var d3_translate = d3.event.translate;
        container.attr("transform", "translate(" + d3_translate + ")scale(" + d3_scale + ")");
    }

    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
      d3.select(this).classed("dragging", false);
    }
//------------------------------------------------------------------------------------------------
    
    var assignLinkAttributes = function(link_selection) {
        
        link_selection
            .attr("id",function(d) {return 's' + String(d.source.id) + 't' + String(d.target.id)} )
            .attr("class", "link")
            // .attr("stroke","black")
            .attr("stroke", function(d) {
                return clusterColors(d.strength)
            })
            .attr("stroke-width", function(d) {
                return (d.strength * 3)
            })
            .attr('stroke-opacity', function(d,i) { 
                var link_opacity = 0
                var draw_link = drawLinks(d,0);
                if (draw_link) { link_opacity = 0.2; }
                return link_opacity
            });
    }

    var assignNodeListeners = function(node_selection) {

        node_selection
            .attr("class", function(d) {
                var blah = "rendered";
                switch (d.tags.favorite) {
                    case true:
                        blah += ' favorite'; break;
                    default:
                        blah += ' non_favorite'; break;
                }
                if (d.tags.Positive==true) { blah += ' sentiment Positive'; }
                else if (d.tags.Negative==true) { blah += ' sentiment Negative'; }
                else if (d.tags.Neutral==true) {  blah += ' sentiment Neutral'; }
                else if (d.tags.Mixed==true) {    blah += ' sentiment Mixed'; }
                else { blah += ' no-sentiment'; }

                return blah
            })
            .on('mouseover', function(d){

                $(this).attr('opacity','1');
                highlightConnectedLinks(d.id,'0.85',1);
                force.stop();
            })
            .on('mouseout', function(d){

                $(this).attr('opacity','0.7');
                highlightConnectedLinks(d.id,'0.1',2);
                // force.start();
                // d3.selectAll('.berry-tooltip').remove();
            })
            .on('dblclick',function(d) {
                
                var num_src = Math.min(d.source.length,10);
                var num_tgt = Math.min(d.target.length,20-num_src);
                for (var k=0; k<num_src; k++) {
                    var sn = d.source[k];
                    var xx = nodeAlpha[sn];
                    nodeArray[xx].temp_selection = true;
                }
                for (var k=0; k<num_tgt; k++) {
                    var sn = d.target[k];
                    var xx = nodeAlpha[sn];
                    nodeArray[xx].temp_selection = true;
                }

                calcRenderNodes();
                updateGraph();
                d3.selectAll('.berry-tooltip').remove();
                nodes2explore = true;
            })
            // .on('click',function(d) { 
            //     d3.helper.tooltip()
            //     .attr({class: function(d, i) { return d + ' ' +  i + ' A'; }}) 
            //     .style({color: 'black'})
            //     .text(function(d, i){ return 'value: '+d; })
            // });
            .attr('pointer-events', 'mouseover')
            .attr('pointer-events', 'click')
            .call( 
                d3.helper.tooltip()
                .attr({class: function(d, i) { return d + ' ' +  i + ' A'; }}) 
                .style({color: 'black'})
                .text(function(d, i){ return 'value: '+d; })
            )
            .call(drag);
            // .call(force.drag);
    }

    var calcLinkDensity = function(dd) { 
        return Math.max( Math.min( dd.source.length+dd.target.length,max_r),min_r);
    }

    var renderSignalGeometry = function(dd) {
        return Math.max(Math.min(dd.Momentum*20,max_r),min_r)
    }

    var CalculateStarPoints = function(centerX, centerY, arms, outerRadius, innerRadius) {
       
       var results = "";
       var angle = Math.PI / arms;
     
       for (var i = 0; i < 2 * arms; i++) {

          // Use outer or inner radius depending on what iteration we are in.
          var r = (i & 1) == 0 ? outerRadius : innerRadius;
          
          var currX = centerX + Math.cos(i * angle) * r;
          var currY = centerY + Math.sin(i * angle) * r;
     
          // Our first time we simply append the coordinates, subsequet times
          // we append a ", " to distinguish each coordinate pair.
          if (i == 0) {
             results = currX + "," + currY;
          }
          else {
             results += ", " + currX + "," + currY;
          }
       }
     
       return results;
    }

    var highlightConnectedLinks = function(index,opacity,allORpath) {

        var link_svgs = $('.link');
        var link_sources = link_svgs.data('source');

        for (var k=0; k<links.length; k++) {

            var src_id = links[k].source.id;
            var tgt_id = links[k].target.id;
            if ((src_id==index) || (tgt_id==index)) {

                if (allORpath >=1) { 
                    draw_link = drawLinks(links[k],allORpath);

                    var blah = '#s' + String(src_id) + 't' + String(tgt_id);
                    var link_id_sel = $(blah);
                    if (link_id_sel.length==0) {
                        console.log("Can't select: ",src_id,tgt_id);
                    }
                    if (draw_link) {
                        $(blah).css('stroke-opacity',opacity);
                        // console.log("Drawing Link: ",blah)
                    } else {
                        $(blah).css('stroke-opacity','0.0'); 
                        // console.log("not Link: ",blah)
                    }
                }
            }
        }
    }

    var drawLinks = function(this_link,from_edge) {

        return true

        // var src_id = this_link.source.id;
        // var tgt_id = this_link.target.id;

        // var edge_dist = 0; // i.e. 0 IS the edge, lol
        // var src_linked = false;
        // var NA = NodeAssociations[src_id];
        // var N  = NA.length;
        // // console.log("NodeAssociations-source: ",NA)
        // for (var k=0; k<N; k++) {
        //     if ((k!=src_id) && (k!=tgt_id) && (NA[k]==true)) {
        //         // console.log("source sources: ",src_id,tgt_id,k,NA,NA.length)
        //         edge_dist += 1;
        //         if (edge_dist >= from_edge) {
        //             src_linked = true;
        //             // console.log("src-other-linked: ",d.source.id,"-",k,"-",NA[k])
        //             break
        //         }
        //     }
        // }

        // var edge_dist = 0; // i.e. 0 IS the edge, lol
        // var tgt_linked = false;
        // var NA = NodeAssociations[tgt_id];
        // var N  = NA.length;
        // // console.log("NodeAssociations-target: ",NA)
        // for (var k=0; k<N; k++) {
        //     if ((k!=src_id) && (k!=tgt_id) && (NA[k]==true)) {
        //         // console.log("target sources: ",src_id,tgt_id,k,NA,NA.length)
        //         edge_dist += 1;
        //         if (edge_dist >= from_edge) {
        //             tgt_linked = true;
        //             // console.log("tgt-other-linked: ",d.target.id,"-",k,"-",NA[k])
        //             break
        //         }
        //     }
        // }

        // // console.log("src-tgt-linked: ",src_linked,tgt_linked)
        // var draw_link = false;
        // if (src_linked && tgt_linked) { draw_link = true }

        // return draw_link
    }

    // var augmentLinkDOMs = function(id,opacity,allORpath) {
    //     // allORpath is an integer indicating whether all the links should be augmented
    //     //     or if those that follow certain paths should be augmented.

    //     highlightLinks = highlightConnectedLinks(id,0,allORpath);
    //     connectedLinks = highlightConnectedLinks(id,0,1);

    //     connectedLinks.forEach(function(L) {
    //             var blah = '#s' + String(L.source.id) + 't' + String(L.target.id)
    //             $(blah).css('stroke-opacity','0.0'); //'1');
    //     })
    //     highlightLinks.forEach(function(L) {
    //         // $('line.link').each(function(e) {
    //             var blah = '#s' + String(L.source.id) + 't' + String(L.target.id)
    //             $(blah).css('stroke-opacity',opacity); //'1');
    //             // debugger
    //         // });
    //         // debugger
    //     })
    // }

    var sortLinks = function() {
        links.sort(function(a,b) { return(a.strength - b.strength) })
    }


    // var recenterVoronoi = function(nodes) {
    //     var shapes = [];
    //     voronoi(nodes).forEach(function(d) {
    //         if ( !d.length ) return;
    //         var n = [];
    //         d.forEach(function(c){
    //             n.push([ c[0] - d.point.x, c[1] - d.point.y ]);
    //         });
    //         n.point = d.point;
    //         shapes.push(n);
    //     });
    //     return shapes;
    // }

    var updateRelevantNode = function(nid,thisNode) {

        if (nodeHash[d.id].relevant) { // means you're turning it off
            nodeHash[d.id].relevant = false;
            thisNode.select('circle')
                .attr('opacity',0.7)
                .attr('stroke-width',0);
        } else {
            nodeHash[d.id].relevant = true;
            thisNode.select('circle')
                .attr('opacity',1.0)
                .attr('stroke','#7FFF00')
                .attr('stroke-width',3);
        }
    }

    var calcMaxDepth = function() {
        cluster_depths = nodeArray.map( function(tn) {

        });
    }

    var saveNodeFavorite = function() {

    }

    var calcRenderNodes = function() { //seeds) {

        var show_cluster_depth = optimumClusterDepth(600); 
        // show_cluster_depth = 75;
        chosenNodes = [];
        chosenLinks = [];

        // Find the center of the current set of nodes
        length_nodes = nodes.length;
        if (length_nodes==0) {
            avg_x = width/2;
            avg_y = height/2;

        } else {

            var avg_x = 0, avg_y = 0;
            nodes.forEach( function(tn) {
                avg_x += tn.x;
                avg_y += tn.y;
            });
            avg_x = avg_x/length_nodes;
            avg_y = avg_y/length_nodes;
        }
            // var hasTag = true;
            //var filterArray = Object.keys(globalFilters);

            // for (var i = 0, l = filterArray.length; i < l; i++) {
            //     var tag = filterArray[i];
            //     if (tn.tags[tag]) {
            //         hasTag = true;
            //     } else {
            //         hasTag = false;
            //         break;
            //     }
            // }
            
        for (var k=0; k<nodeArray.length; k++) { 

            var tn = nodeArray[k];
            var nid = String(tn.id);

            // New show field
            var selected = tn.selected;
            
            var right_depth = (((clusterArray[tn.cluster_idx].max_depth-show_cluster_depth-1) <= tn.depth) && tn.depth!=0);
            var has_sentiment = (tn.tags.Positive==true || tn.tags.Negative==true || 
                                 tn.tags.Neutral==true  || tn.tags.Mixed==true);
            var is_relevant_or_sentiment = (tn.tags.relevant==true || has_sentiment);
            var passes_mustard = (tn.sGroup == 1 && tn.signalThreshold && selected && right_depth);

            add_dat_shizzle = ( tn.temp_selection || 
                                ( is_relevant_or_sentiment && ( passes_mustard || tn.tags.favorite==true ) )
                              );


            if (add_dat_shizzle) {
                if (node_hash[nid]==undefined) { // i.e. it is NOT defined, add it to the hash
                    nodes.push(tn);
                    var nl = nodes.length-1;
                    node_hash[nid] = nl;
                    nodes[nl].x = avg_x;
                    nodes[nl].y = avg_y;
                    start_graph = true;
                }
            } else { // remove dat shizzle
                var nx = [];
                for (var xx=0; xx<nodes.length; xx++) {
                    if (nodes[xx].id==tn.id) { nx = xx; break }}

                // var xx = node_hash[nid];
                if (nx.length!=0) { // i.e. it is defined
                    delete node_hash[nid];
                    nodes.splice(nx,1);
                }
            }
            // return add_dat_shizzle;
        };
        chosenNodes = nodes; 
        // });

        var blah = [];
        chosenNodes.forEach(function(d){ blah.push(d.id); });
        // chosenNodes.forEach(function(d){ blah.push(parseInt(d.id)); });
        // chosenLinks = linkArray.filter( function(tl) {
        for (var k=0; k<linkArray.length; k++) { 
            var tl = linkArray[k],
                lsid = tl.source.id,
                ltid = tl.target.id;
            var lstid = 's'+lsid+'t'+ltid;

            var add_dat_lizzle = (tl.render && 
                                    (jQuery.inArray(tl.source.id,blah)!=-1 && 
                                     jQuery.inArray(tl.target.id,blah)!=-1)
                                    // (jQuery.inArray(parseInt(tl.source.id),blah)!=-1 && 
                                    //  jQuery.inArray(parseInt(tl.target.id),blah)!=-1)
                                 );

            if (add_dat_lizzle) {
                // tl.source.id = node_hash[lsid];
                // tl.target.id = node_hash[ltid];
                if (link_hash[lstid]==undefined) { // i.e. it's NOT defined
                    links.push(tl);
                    link_hash[lstid] = links.length-1; 
                    // link_hash[ltid] = links.length-1;
                    start_graph = true;
                } 
            } else { // i.e. it is defined, so remove stuff
                
                var lx = [];
                for (var xx=0; xx<links.length; xx++) {
                    if (links[xx].source.id==tl.source.id && 
                        links[xx].target.id==tl.target.id ) { lx = xx; break }}

                if (lx.length!=0) { // i.e. it is defined
                    links.splice(lx,1);
                    delete link_hash[lstid];
                    // delete link_hash[ltid];
                }
            }
        }
        chosenLinks = links;
        //     return test;
        // });

        // return chosenNodes
    };

    var optimumClusterDepth = function(nodes2render) {
        
        var optimum_cluster_depth = 0;
        var num_visualized_nodes = 0;
        var max_cluster_depth = Math.max.apply(null,clusterArray.map(function(d){ return d.max_depth; }));
        while (num_visualized_nodes<nodes2render && optimum_cluster_depth<=max_cluster_depth) {

            optimum_cluster_depth += 1;
            var num_cluster_nodes_visualized = clusterArray.map( function(ca) { 

                var xx = Math.min(optimum_cluster_depth,ca.depth_type.length);
                var blah = ca.depth_hist.reduce(function(previousValue, currentValue, index, array){
                    if (index<=xx && ca.depth_type[index]!=0) {
                        return previousValue + currentValue;
                    } else {
                        return previousValue;
                    }
                });
                return blah;
            });
            num_visualized_nodes = num_cluster_nodes_visualized.reduce(function(previousValue, currentValue){
                return previousValue + currentValue;
            })
        }

        return optimum_cluster_depth
    }

    var mousePosition = function() {
        var temp = d3.mouse(bodyNode);
        var absoluteMousePos = [];
        for (var i=0; i<temp.length; i++) { 
            absoluteMousePos.push({'x':temp[i]});
        };
        return absoluteMousePos;
    }

    d3.helper = {};
    d3.helper.tooltip = function(nid) {
        var tooltipDiv;
        var attrs = {};
        var text = '';
        var styles = {};

        function tooltip(selection){
            
            selection.on('click.tooltip', function(pD, pI){
                
                var name, value,
                    nid = String(pD.id),
                    cid = String(pD.cluster_idx);

                var tooltip_width = Math.min($(window).width()/5,275);
                var network_position = $('#network-container').position();
                var network_height   = $('#network-container').height();
                var network_width    = $('#network-container').width();

                // var temp = d3.mouse(bodyNode);
                // var absoluteMousePos = [];
                // for (var i=0; i<temp.length; i++) { 
                //     absoluteMousePos.push({'x':temp[i]});
                // }
                var absoluteMousePos = mousePosition();

                d3.selectAll('.tooltip.berry-tooltip').remove();
                // d3.select('body').append('div')
                d3.select('#network-container').append('div')
                        .attr("class","tooltip berry-tooltip")
                        .attr("role","tooltip")
                        .style({ 
                            // left: (absoluteMousePos[0].x + 70)+'px',
                            // top: (absoluteMousePos[1].x - 25)+'px',
                            // left: (initial_width_translate*initial_scale*4/5) + 'px',
                            // top: (initial_height_translate*initial_scale*1.5) + 'px',
                            left:String(network_position.left+network_width-tooltip_width - 5)+'px',
                            top:String(network_position.top + 5)+'px',
                            position: 'absolute',
                            'padding': '5px',
                            'padding-bottom': '10px',
                            'background-color': '#FFFFFF',
                            'border-width': '1px',
                            'border-style':'solid',
                            'border-color': '#e5e5e5', //'#888888',
                            'border-radius' : '2px',
                            'box-shadow': '-3px 3px 3px #888888',
                            // width: (Math.max(Math.min(400,pD.name.length*2/3),150)) + 'px',
                            'width': tooltip_width + 'px',
                            'z-index': 1001,
                            'opacity': 1
                        });

                var tooltipDiv = d3.select('.tooltip.berry-tooltip');

                tooltipDiv.append('button').attr('class','close').html('&times;');
                d3.select('.tooltip.berry-tooltip .close').on('click',function(){d3.selectAll('.tooltip.berry-tooltip').remove();});

                tooltipDiv.append("h4")
                        .attr("class","tooltip-title")
                        .style({"margin-top": '5px'})
                        .text("Comment #" + nid);
                        //.text("Annotate Comment #" + nid);
                tooltipDiv.append("h5")
                        .attr("class","tooltip-subtitle")
                        .style({'margin-bottom': '0px',
                                'padding-bottom': '10px',
                                'border-bottom': '1px solid #E5E5E5'})
                        .text("Cluster: " + pD.ClusterName);
                        //.text('The "' + pD.ClusterName +'" Cluster');

                // Widgets
                /////////////
                tooltipDiv
                    .append("table")
                        .attr("class","report-table")
                        .style({'margin-bottom':10,
                                'width':"100%",
                                // 'display':'inline-block',
                                'border-bottom': '1px solid #E5E5E5',
                                'margin-bottom': '10px'
                                // 'border-width':'1px',
                                // 'border-style':'solid',
                                // 'border-color':'B0B0B0'
                            })
                        .append("tr");

                var tooltipButtons = d3.select('.tooltip.berry-tooltip .report-table');
                tooltipButtons.append("td").text("Favorite").style({ "padding":"10px"});
                tooltipButtons.append("td").text("Sentiment").style({"padding":"10px"});
                tooltipButtons.append("td").text("Relevant").style({ "padding":"10px"});
                tooltipButtons.append("tr");
                
                // FAVORITE
                tooltipButtons.append("td").attr("class","favorite");
                var tooltipFavorite = d3.select('.tooltip.berry-tooltip .report-table .favorite');
                tooltipFavorite.append('input')
                          .attr("class","favorite-checkbox")
                          .attr("data-nid",nid)
                          .attr('type','checkbox');
                
                tooltipFavorite.append('i')
                        .attr('class','fa fa-star')
                        .attr("data-nid",nid);

                if (pD.tags.favorite) {
                    d3.select('.tooltip.berry-tooltip .report-table .favorite .favorite-checkbox').attr('checked',true);
                    d3.select('.tooltip.berry-tooltip .report-table .favorite .fa .fa-star').attr('class','starred');
                }
                var JFavorite = $('.tooltip.berry-tooltip .favorite');
                JFavorite.find('i').css({'horizontal-align':'center',
                                         'font-size':'2em',
                                         'margin-left':'20px'});

                // SENTIMENT
                tooltipButtons.append("td")
                                .attr("class","berry-sentiment")
                            .append("select")
                                .attr("class","sentiment-dropdown form-control input-sm")
                                .attr("data-nid",nid)
                                .attr("data-cid",cid);

                var tooltipSentiment = d3.select('.tooltip.berry-tooltip .sentiment-dropdown');
                tooltipSentiment.append("option").attr("value","");
                tooltipSentiment.append("option").attr("value","Positive").text("Positive");
                tooltipSentiment.append("option").attr("value","Negative").text("Negative");
                tooltipSentiment.append("option").attr("value","Neutral").text("Neutral");
                tooltipSentiment.append("option").attr("value","Mixed").text("Mixed");

                var cells = this;
                var sent = pD.tags.sentiment;
                sent = sent ? sent : '';
                var JSentiment = $('.tooltip.berry-tooltip .berry-sentiment');
                JSentiment.val(sent);
                // setSentimentColors( parseFloat(nid), sent);
                JSentiment.css({
                        'horizontal-align':'center',
                        'margin-left':10,
                        'margin-right':10,
                        'margin-bottom':7
                    });

                // RELEVANCE
                tooltipButtons.append("td")
                        .attr("class","radio-switch")
                        .attr("data-nid",nid);
                var tooltipRelevance = d3.select('.tooltip.berry-tooltip .report-table .radio-switch');
                tooltipRelevance.append('input')
                        .attr('type','checkbox')
                        .attr('checked',true)
                        .attr('class','relevance-radio is-relevant')
                        .attr("data-nid",nid);
                $(".tooltip.berry-tooltip .radio-switch input").bootstrapSwitch();
                $(".relevance span:first-of-type").css("background-color", "#3d4550"); //"#578ab7");
                $(".tooltip.berry-tooltip .radio-switch").css({
                        'horizontal-align':'center',
                        'margin-left':10,
                        'margin-right':10,
                        'margin-bottom':10
                    });

                // COMMENT ITSELF
                tooltipDiv.append("div").text( pD.name);
            });
        }

        tooltip.attr = function(_x){
            if (!arguments.length) return attrs;
            attrs = _x;
            return this;
        };

        tooltip.style = function(_x){
            if (!arguments.length) return styles;
            styles = _x;
            return this;
        };

        tooltip.text = function(_x){
            if (!arguments.length) return text;
            text = d3.functor(_x);
            return this;
        };

        return tooltip;
    };

    var berry_legend = function() {

        var network_position = $('#graph').position();
        var network_height   = $('#graph').height();
        var network_width    = $('#graph').width();
        var legend_width = Math.min($(window).width()/5,275);
        var legend_height = network_height/3;

        d3.select('#network-container').append('div')
                .attr("class","berry-legend")
                .style({ 
                    left:String(network_position.left+network_width)+'px',
                    top:String(network_position.top)+'px',
                    position: 'absolute',
                    'padding': '2px',
                    'background-color': '#FFFFFF',
                    'border-width': '1px',
                    'border-style':'solid',
                    'border-color':'#888888',
                    'border-radius' : '2px',
                    'box-shadow': '5px 5px 2px #888888',
                    'width': legend_width + 'px',
                    'z-index': 1001,
                    'opacity': 1
                });

        var tooltipDiv = d3.select('.berry-legend').text("A LEGEND!!");

        // callback(null);
    }
}