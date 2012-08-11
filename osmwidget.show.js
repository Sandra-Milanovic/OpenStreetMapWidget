//show.html?lat=lat&lngr=lng&zoom=zoom&target=lat,lng
var getParams = function () {
    var params = {};
    var paramArray = window.location.search.substr(1).split("&");
    for (var k = 0; k < paramArray.length; ++k) {
        var single = paramArray[k].split("=");
        params[single[0]] = single[1]
    }
    return params;
};

$(window).resize(function () {
    $("#map").width($(window).width());
    $("#map").height($(window).height());
})

$(document).ready(function () {
    var MarkerIcon = L.Icon.extend({
        iconUrl:icons.urlPrefix + 'home.png',
        iconSize:new L.Point(32, 38),
        iconAnchor:new L.Point(16, 38),
        popupAnchor:new L.Point(16, -48)
    });

    var params = getParams();

    if ("target" in params) {
        var markerArray = params.target.split(","),
            markerLat = markerArray[0],
            markerLng = markerArray[1];
    }
    $('.button').button();

    $("#directions").click(function () {
        $("#directionsPanel").toggle();
    });
    $("#map").width($(window).width())
    ;
    $("#map").height($(window).height());
    var map = new L.Map('map');
    map.setView(new L.LatLng(params.lat, params.lng), params.zoom);

    switchLayer(map, Layers[params.map]);
    $("#mapLayer").val(params.map);
    $("#mapLayer").change(function (e) {
        var whichLayer = $(this).val();
        switchLayer(map, Layers[whichLayer]);
    });


    var targetMarker = null, myMarker = null;

    var createMyMarker = function(lat, lng) {
        myMarker = new L.Marker(new L.LatLng(lat, lng), {draggable:true});
        myMarker.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + 'home.png'}));
        map.addLayer(myMarker);
        myMarker.on('dragstart', function() {
            updateMyMarker = false; 
        });
        myMarker.on(tevents.menu, menu({
            "Follow my location": function() {
                if (lastKnownPosition)
                    myMarker.setLatLng(new L.LatLng(lastKnownPosition.lat, lastKnownPosition.lng));
                updateMyMarker = true;
            }
        }));
    }

    if ("target" in params) {


        targetLocation = new L.LatLng(markerLat, markerLng);
        targetMarker = new L.Marker(targetLocation, {draggable:true});
        targetMarker.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + 'regroup.png'}));
        map.addLayer(targetMarker);
        targetMarker.on(tevents.menu, menu({
            "Reset location": function() {
                targetMarker.setLatLng(targetLocation);
            }
        }));
    }

    if ("places" in params) {
        params.places.split(",").forEach(function (pStr) {
            var pArr = pStr.split(';');
            var ll = latLngCoder.decode(pArr[0]);
            var iconUrl = pArr[1];
            var text = decodeURIComponent(pArr[2]);
            var place = new L.Marker(new L.LatLng(ll.lat, ll.lng), {draggable:false});
            place.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + iconUrl}));
            place.bindPopup(text);
            map.addLayer(place);
        })
    }

    if ("polys" in params) {
        params.polys.split(",").forEach(function(polyStr) {
            var pArr = polyStr.split(";");
            var latlngs = [], latlngsStr = pArr[0];
            for (var k = 0; k < latlngsStr.length; k += 10) {
                var ll = latLngCoder.decode(latlngsStr.substring(k,k+10));
                latlngs.push(new L.LatLng(ll.lat, ll.lng));
            }
            var style = {
                color: '#' + pArr[1],
                fill: pArr[2] && pArr[2].length > 0,
                fillColor: pArr[2] && pArr[2].length > 0 ? '#' + pArr[2] : null
            };
            var type = style.fillColor ? 'Polygon' : 'Polyline';
            map.addLayer(new L[type](latlngs, style));
        });
    }

    var lastPoly, lastRequest = 0;
    // Request directions updates every 60 seconds
    setInterval(function() {

        if (!myMarker || !targetMarker || (new Date().getTime() - lastRequest) < 60000) return;
        lastRequest = new Date().getTime();

        var srcLoc = myMarker.getLatLng();
        var dstLoc = targetMarker.getLatLng();
        /*
           callback=e&outFormat=json&routeType=shortest&timeType=1&enhancedNarrative=false
           &shapeFormat=raw&generalize=200&locale=en_GB&unit=m
           &from=38.89403,-77.075555&to=38.84457,-77.078222
           &drivingStyle=2&highwayEfficiency=21.0
           */
        $.getJSON('http://open.mapquestapi.com/directions/v0/route?callback=?', {
            outFormat:'json',
            routeType:'shortest', // make options for this
            timeType:1, // options
            enhancedNarrative:true,
            narrativeType:'microformat',
            shapeFormat:'raw',
            generalize:200,
            locale:'en_GB',
            unit:'m',
            from:[srcLoc.lat, srcLoc.lng].join(','),
            to:[dstLoc.lat, dstLoc.lng].join(','),
            drivingStyle:2, // not sure if options
            highwayEfficiency:21.0 // also not sure if options
            }, function (response) {
                console.log(response);
                $("#directionsPanel").html("");
                $("<table />").appendTo("#directionsPanel");
                response.route.legs[0].maneuvers.forEach(function (item) {
                    var row = $('<tr />').addClass('point');
                    $('<img />').attr('src', item.iconUrl).appendTo($('<td/>').appendTo(row));
                    var textCell = $('<td />').addClass('text');
                    textCell.html(item.narrative);

                    textCell.appendTo(row);

                    var distCell = $('<td />').addClass('distance');
                    distCell.html(Convert.toDistance(item.distance))
                    distCell.appendTo(row);

                row.appendTo($("#directionsPanel"));
                });
                var latLngs = [], sp = response.route.shape.shapePoints;
                for (var k = 0; k < sp.length; k += 2) {
                    latLngs.push(new L.LatLng(sp[k], sp[k + 1]));
                }
                if (lastPoly) map.removeLayer(lastPoly);
                lastPoly = new L.Polyline(latLngs);
                map.addLayer(lastPoly);
            });

    }, 1000);

    // Request repeated updates.
    var updateMyMarker = true, lastKnownPosition = null;
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function (position) {
            lastKnownPosition = {lat: position.coords.latitude, lng: position.coords.longitude};
            if (!updateMyMarker) return;
            if (!myMarker) 
                createMyMarker(position.coords.latitude, position.coords.longitude);
            else
                myMarker.setLatLng(new L.LatLng(position.coords.latitude, position.coords.longitude));
                                            
        }, null, {enableHighAccuracy:true});
    }

});
