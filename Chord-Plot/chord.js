//*******************************************************************
//  CREATE MATRIX AND MAP
//*******************************************************************
var FullData, PopularThemes;
var dataLoaded = false;



function loadChordData(f) {
  d3.csv('data/Full_Cleaned_Data.csv', function (error, data) {

    d3.csv('data/PopularThemes.csv', function (error, pThemes) {
      console.log("Vipraaaaaaaaa");
      FullData = data;
      PopularThemes = pThemes;
      dataLoaded = true;
      f();
    });
  });
}

function getDistinctThemes(yearBegin, yearEnd) {
  
  var filteredThemesByYear = [];
  var topThemeIndex = {};
  var i = -1;

  PopularThemes.forEach(function(r) {

    if (r.Year >= yearBegin && r.Year <= yearEnd) {
      if (!topThemeIndex[r.ThemeName] && topThemeIndex[r.ThemeName] != 0) {
        filteredThemesByYear.push({name: r.ThemeName, val: parseInt(r.NoOfReleasedSets)})                                    
        topThemeIndex[r.ThemeName] = ++i;
      }
      else
        filteredThemesByYear[topThemeIndex[r.ThemeName]].val += parseInt(r.NoOfReleasedSets);
    }
  });

  filteredThemesByYear.sort(function(a,b){
    if (a.val < b.val) return 1;
    if (a.val > b.val) return -1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  })

  return filteredThemesByYear;
}

function changeData(topN, yB, yE) {
  d3.select('#diagram svg').remove();

  filterData(topN, yB, yE);
}


function filterData(topN, yearBegin, yearEnd) {
  
  var n = 0;

  var filteredThemesByYear = [];
  var topThemeIndex = {};
  var i = -1;
  var topNThemes = {};
  var filteredData = [];

  console.log("111vipra:");
  // console.log(PopularThemes);
  if(topN > 0) {


    PopularThemes.forEach(function(r) {
      console.log(r);
      if (r.Year >= yearBegin && r.Year <= yearEnd) {
        if (!topThemeIndex[r.ThemeName] && topThemeIndex[r.ThemeName] != 0) {
          filteredThemesByYear.push({name: r.ThemeName, val: parseInt(r.NoOfReleasedSets)})                                    
          topThemeIndex[r.ThemeName] = ++i;
        }
        else
          filteredThemesByYear[topThemeIndex[r.ThemeName]].val += parseInt(r.NoOfReleasedSets);
      }
    });

    console.log("vipra:"+filteredThemesByYear)
    filteredThemesByYear.sort(function(a,b){
      if (a.val < b.val) return 1;
      if (a.val > b.val) return -1;
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    })

    //console.log(filteredThemesByYear);              
    filteredThemesByYear.some(function(r) {
      if (!topNThemes[r.name]) {
        topNThemes[r.name] = 1;
        n++;
      }
      return n === topN;
    });              
  }            

  FullData.forEach(function(r) {
    if(r.Year1 >= yearBegin && r.Year1 <= yearEnd && r.Year2 >= yearBegin && r.Year2 <= yearEnd && topNThemes[r.Theme1] === 1 &&  topNThemes[r.Theme2] === 1) {
      r.ThemeName1 = r.Year1+'-'+r.Theme1;
      r.ThemeName2 = r.Year2+'-'+r.Theme2;
      r.NormalizedDiff = parseInt(r.NormalizedDiff);
      //r.NormalizedDiff = (r.NormalizedDiff < 0)? r.NormalizedDiff*-1:r.NormalizedDiff;
      filteredData.push(r);
    }
  })

  console.log(topNThemes);
  plotData(filteredData);
    
}

function plotData(data) {

                
  var mpr = chordMpr(data);        

  mpr
    .addValuesToMap('ThemeName1', ['SetCount1', 'Year1'])
    .setFilter(function (row, a, b) {
      return (row.ThemeName1 === a.name && row.ThemeName2 === b.name)
    })
    .setAccessor(function (recs, a, b) {
      if (!recs[0]) return 0;
      return +recs[0].NormalizedDiff;
    });


  console.log(mpr.getMap());

  drawChords(mpr.getMatrix(), mpr.getMap());

}
//*******************************************************************
//  DRAW THE CHORD DIAGRAM
//*******************************************************************
function drawChords (matrix, mmap) {
  var w = 980, h = 800, margin = 60, r1 = (h-margin) / 2, r0 = r1 - 100;
  var outer_r0 = r0 + 30;

  var fill = d3.scale.category10();

  var chord = d3.layout.chord()
      .padding(.02)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);        

  var outerArc = d3.svg.arc()
      .innerRadius(outer_r0)
      .outerRadius(outer_r0 + 20);

  var arc = d3.svg.arc()
      .innerRadius(r0)
      .outerRadius(r0 + 20);

  var rdr = chordRdr(matrix, mmap);
    chord.matrix(matrix);
  

  var mainsvg = d3.select("#diagram").append("svg")
      .attr("width", w)
      .attr("height", h);

  var outersvg = mainsvg.append("svg:g")
            .attr("id", "circle")
            .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
            
      outersvg.append("circle")
              .attr("r", r0 + 80);
        

  year_chord_groups = [];
  yearMap = {};
  map_index = -1;
  var mmap_keys = Object.keys(mmap);     
  var themeIndexes = {};   
  chord.groups().forEach(function(d,i) {
    if (!yearMap[mmap[mmap_keys[i]].data[1]]) {
      ++map_index;
      yearMap[mmap[mmap_keys[i]].data[1]] = {index: map_index, startAngle: d.startAngle, endAngle:d.endAngle, value:0, angle:0, data: mmap[mmap_keys[i]].data[1]};
    }
    else {
      yearMap[mmap[mmap_keys[i]].data[1]].endAngle = d.endAngle;
    }          
    var name = mmap_keys[i].substring(mmap_keys[i].indexOf("-")+1)
    if(!themeIndexes[name]) {
      themeIndexes[name] = [];
      themeIndexes[name].push(i);
    }
    else
      themeIndexes[name].push(i);
  });

  //console.log(yearMap);
  Object.keys(yearMap).forEach(function(d,i) {
    //console.log(new_m);
    year_chord_groups.push(yearMap[d]);
  })
  
  console.log(chord.groups());
  console.log(mmap);        

  var outerCircle_g = outersvg.selectAll("g.group")
      .data(year_chord_groups)
    .enter().append("svg:g")
      .attr("class", "group")            
      .on("mouseover", function(d,i) {
          d3.select("#tooltip")
            .style("visibility", "visible")
            .html(d.data)
            .style("top", function () { return (d3.event.pageY - 40)+"px"})
            .style("left", function () { return (d3.event.pageX - 80)+"px";})
      })
      .on("mousemove", function(d,i) {
          d3.select("#tooltip")
            .style("top", function () { return (d3.event.pageY - 40)+"px"})
            .style("left", function () { return (d3.event.pageX - 80)+"px";})
      })
      .on("mouseout", function (d) { d3.select("#tooltip").style("visibility", "hidden") });

  outerCircle_g.append("svg:path")
      .attr("id",function(d,i) { return "yearArc_"+i; })
      .style("stroke-width", "1")
      .style("stroke", "black")
      //.style("fill", "white")
      .style("fill", "url(#whitecarbon)")
      //.style()
      .attr("d", outerArc)
      .each(function(d,i) {
        //Search pattern for everything between the start and the first capital L
        var firstArcSection = /(^.+?)L/;

        //Grab everything up to the first Line statement
        var newArc = firstArcSection.exec( d3.select(this).attr("d") )[1];
        //Replace all the commas so that IE can handle it
        newArc = newArc.replace(/,/g , " ");

        //If the end angle lies beyond a quarter of a circle (90 degrees or pi/2)
        //flip the end and start position
        if (d.endAngle > 90 * Math.PI/180) {
            //Everything between the capital M and first capital A
            var startLoc = /M(.*?)A/;
            //Everything between the capital A and 0 0 1
            var middleLoc = /A(.*?)0 0 1/;
            //Everything between the 0 0 1 and the end of the string (denoted by $)
            var endLoc = /0 0 1 (.*?)$/;
            //Flip the direction of the arc by switching the start and end point
            //and using a 0 (instead of 1) sweep flag
            var newStart = endLoc.exec( newArc )[1];
            var newEnd = startLoc.exec( newArc )[1];
            var middleSec = middleLoc.exec( newArc )[1];

            //Build up the new arc notation, set the sweep-flag to 0
            newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
        }

        //Create a new invisible arc that the text can flow along
        outersvg.append("path")
            .attr("class", "hiddenArcs")
            .attr("id", "hiddenArc"+i)
            .attr("d", newArc)
            //.style("fill", "url(#diagonal-stripe-1)");
            .style("fill", "none");

      });          

  outerCircle_g.append("svg:text")
      .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; d.x = (d.endAngle - d.startAngle)*outer_r0; })
      .attr("x", function(d) { return d.x/2; })
      //.attr("dy", 15)
      //.attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })     
      //.attr("transform", function(d) {
      //  return "rotate(" + ((d.angle > 2*Math.PI/4 && d.angle < 2*Math.PI*3/4)? "180":"0") + ")";                  
      //})       
      .attr("dy", function(d,i) {
          return ((d.angle > 2*Math.PI/4 && d.angle < 2*Math.PI*3/4)? -5 : 15);
      })
      .append("textPath")
      //.attr("xlink:href", function(d,i) { return "#yearArc_"+i; })
      //.attr("startOffset","50%")
      .style("text-anchor","middle")
      .attr("xlink:href",function(d,i){return ((d.angle > 2*Math.PI/4 && d.angle < 2*Math.PI*3/4)? "#hiddenArc"+i:"#yearArc_"+i);})
      .text(function(d) { return d.data; })
      .attr("font-size", "18px")
      .attr("font-weight", "bold");

  var svg = mainsvg.append("svg:g")
          .attr("id", "circle")
          .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

      svg.append("circle")
         .attr("r", r0 + 20);

  var g = svg.selectAll("g.group")
      .data(chord.groups())
    .enter().append("svg:g")
      .attr("class", "group")
      .on("mouseover", mouseover)
      .on("mousemove", function(d,i) {
          d3.select("#tooltip")
            .style("top", function () { return (d3.event.pageY - 50)+"px"})
            .style("left", function () { return (d3.event.pageX - 90)+"px";})
      })
      .on("mouseout", function (d) { d3.select("#tooltip").style("visibility", "hidden") })
      .on("click", onclick);

  g.append("svg:path")
      .style("stroke", "none")
      .style("fill", function(d) { return fill(d.index); })
      .attr("d", arc);

  g.append("svg:text")
      .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2;})
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
      .attr("transform", function(d) {
        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
            + "translate(" + (r0 + 60) + ")"
            + (d.angle > Math.PI ? "rotate(180)" : "");
      })
      .text(function(d) { 
        name = rdr(d).cname; 
        return name.substring(name.indexOf("-")+1); 
      });

    var chordPaths = svg.selectAll("path.chord")
          .data(chord.chords())
        .enter().append("svg:path")
          .attr("class", "chord")
          .attr("id",function(d) { return d.source.index+"-"+d.target.index; })
          .style("stroke", function(d) { return d3.rgb(fill(d.target.index)).darker(); })
          .style("fill", function(d) { return fill(d.target.index); })
          .attr("d", d3.svg.chord().radius(r0))
          .on("mouseover", function (d) {
            d3.select("#tooltip")
              .style("visibility", "visible")
              .html(chordTip(rdr(d)))
              .style("top", function () { return (d3.event.pageY - 100)+"px"})
              .style("left", function () { return (d3.event.pageX - 100)+"px";})
          })
          .on("mouseout", function (d) { d3.select("#tooltip").style("visibility", "hidden") });

    function chordTip (d) {                        
      diff = d.sdata[0] - d.tdata[0];
      //console.log(d);
      return d.sname+": "+d.sdata[0]+"<br/>" +
             d.tname+": "+d.tdata[0]+"<br/>" + 
             "Difference: " + Math.abs(diff);
    }

    function mouseover(d, i) {
      d3.select("#tooltip")
        .style("visibility", "visible")
        .html(function(){
          f = rdr(d);
          return f.cname.substring(f.cname.indexOf("-")+1)+': '+f.cdata[0];
        })
        .style("top", function () { return (d3.event.pageY - 50)+"px"})
        .style("left", function () { return (d3.event.pageX - 90)+"px";})

      chordPaths.classed("fade", function(p) {
        return p.source.index != i && p.target.index != i;
      });
    }

    function onclick(d,i) {            
      name = rdr(d).cname; 
      name = name.substring(name.indexOf("-")+1);   
      console.log(themeIndexes[name]);           
      chordPaths.classed("fade", function(p) {
        //console.log(d3.select(this).attr("id"), !(p.source.index in themeIndexes[name] || p.target.index in themeIndexes[name]));
        return !(themeIndexes[name].includes(p.source.index) || themeIndexes[name].includes(p.target.index));
      });            
    }
}