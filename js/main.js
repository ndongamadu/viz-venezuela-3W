function hxlProxyToJSON(input){
    var output = [];
    var keys = [];
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

var blue = '#007CE0';
var blueLight = '#72B0E0';
var green = '#06C0B4';

function generate3W(data, geom) {
    var where = dc.leafletChoroplethChart('#map');
    var whoChart = dc.rowChart('#orgType');
    var whatChart = dc.rowChart('#whatChart');


    var cf = crossfilter(data);

    var whereDim = cf.dimension(function(d){
        return d['#adm1+name'];
    });
    var whatDim = cf.dimension(function(d){
        return d['#sector'];
    });
    var whoDim = cf.dimension(function(d){
        return d['#org'];
    });

    var whereGroup = whereDim.group().reduceCount(function(d){ 
        return d['#org'];
    });
    var whatGroup = whatDim.group();
    var whoGroup = whoDim.group();


    //tooltip
    var rowtip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        return d.key + ': ' + d3.format('0,000')(d.value);

    });


 where.width($('#map').width())
            .height(500)
            .dimension(whereDim)
            .group(whereGroup)
            .center([0,0]) //8.779/13.436
            .zoom(0)
            .geojson(geom)
            .colors(['#007CE0','#C7D5EE','#95B5DE','#6599D1','#DDDDDD'])
            .colorDomain([0, 4])
            .colorAccessor(function(d){
                var c = 4;
                if (d>80) {
                    c = 0;
                } else if (d>60) {
                    c = 1;
                } else if(d>30){
                    c = 2;
                } else if (d>0){
                    return c = 3;
                }
                return c;
            })
            .featureKeyAccessor(function(feature){
                return feature.properties['ESTADO'];
            }).popup(function(feature){
                return feature.properties['ESTADO'];
            });

    whatChart.width(400)
        .height(300)
        .gap(2)
        .dimension(whatDim)
        .group(whatGroup)
        .data(function (group) {
            return group.top(Infinity);
        })
        .colors(blue)
        .elasticX(true)
        .renderTitle(false)
        .xAxis().ticks(5);

    whoChart.width(400)
        .height(530)
        .gap(2)
        .dimension(whoDim)
        .group(whoGroup)
        .data(function (group) {
            return group.top(20);
        })
        .colors(blue)
        .elasticX(true)
        .renderTitle(false)
        .xAxis().ticks(5);

    $('.viz-container').show();
    $('.loader').hide();

    dc.renderAll();

    //tooltip events
    d3.selectAll('g.row').call(rowtip);
    d3.selectAll('g.row').on('mouseover', rowtip.show).on('mouseout', rowtip.hide);

    var map = where.map();
    map.options.minZoom = 3;


    zoomToGeom(geom);


    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }

    function genLookup(geojson){
        var lookup = {};
        geojson.features.forEach(function(e){
            lookup[e.properties['admin1Pcod']] = String(e.properties['admin1Name']);
        });
        return lookup;
    }

} //generate3W

function generateDate(date) {
    $('.title h2 span').text(date[0]['#date'])
}

var geodataCall = $.ajax({
    type: 'GET',
    dataType: 'json',
    url: 'data/estados_venezuela.geojson',
});

var dataCall = $.ajax({
    type: 'GET',
    dataType: 'json',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1abQtEGbQrKNIP-PHTu9hrnEheNtCyXXb2E_oplc5De0%2Fedit%23gid%3D2090313683&force=on'
});

var dateCall = $.ajax({
    type: 'GET',
    dataType : 'JSON',
    url : 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1abQtEGbQrKNIP-PHTu9hrnEheNtCyXXb2E_oplc5De0%2Fedit%23gid%3D1652404916&force=on',
});

$.when(geodataCall, dataCall, dateCall).then(function(geomArgs, dataArgs, dateArgs){
    var geom = geomArgs[0];
    var data = hxlProxyToJSON(dataArgs[0]);
    var date_udpate = hxlProxyToJSON(dateArgs[0]);
    generateDate(date_udpate);
    generate3W(data, geom);
});