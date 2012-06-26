//show.html?lat=lat&lngr=lng&zoom=zoom&marker=lat,lng
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
    var params = getParams();
    if ("marker" in params) {
        var markerArray = params.marker.split(","),
                markerLat = markerArray[0],
                markerLng = markerArray[1];
    }

    $("#map").width($(window).width());
    $("#map").height($(window).height());
    var map = new L.Map('map');
    var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:'Copyright (C) OpenStreetMap.org',
        maxZoom:18
    });
    $("#map").width($(window).width());
    $("#map").height($(window).height());
    map.addLayer(layer);
    map.setView(new L.LatLng(params.lat, params.lng), params.zoom);

    var markerLocation = null;
    if ("marker" in params) {
        markerLocation = new L.LatLng(markerLat, markerLng);
        var marker = new L.Marker(markerLocation);
        map.addLayer(marker);
    }


    var myMarker = null, lastRouteRequest = 0, lastPoly;
    // Request repeated updates.
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function (position) {
            if (myMarker) map.removeLayer(myMarker);
            myMarker = new L.Marker(new L.LatLng(position.coords.latitude, position.coords.longitude))
            var CustomIcon = L.Icon.extend({
                iconUrl:'home.png',
                iconSize:new L.Point(32, 38),
                iconAnchor:new L.Point(16, 38),
                popupAnchor:new L.Point(16, -48)
            });
            myMarker.setIcon(new CustomIcon('home.png'));
            map.addLayer(myMarker);
            if (markerLocation && new Date().getTime() - lastRouteRequest > 60000) {

                $.getJSON('http://open.mapquestapi.com/directions/v0/route?callback=?', {
                    outFormat:'json',
                    routeType:'shortest', // make options for this
                    timeType:1, // options
                    enhancedNarrative:false,
                    shapeFormat:'raw',
                    generalize:200,
                    locale:'en_GB',
                    unit:'m',
                    from:[position.coords.latitude, position.coords.longitude].join(','),
                    to:[markerLocation.lat, markerLocation.lng].join(','),
                    drivingStyle:2, // not sure if options
                    highwayEfficiency:21.0 // also not sure if options
                }, function (response) {
                    console.log(response);
                    var latLngs = [], sp = response.route.shape.shapePoints;
                    for (var k = 0; k < sp.length; k += 2) {
                        latLngs.push(new L.LatLng(sp[k], sp[k + 1]));
                    }
                    if (lastPoly) map.removeLayer(lastPoly);
                    lastPoly = new L.Polyline(latLngs);
                    map.addLayer(lastPoly);
                });
                /*
                 callback=e&outFormat=json&routeType=shortest&timeType=1&enhancedNarrative=false
                 &shapeFormat=raw&generalize=200&locale=en_GB&unit=m
                 &from=38.89403,-77.075555&to=38.84457,-77.078222
                 &drivingStyle=2&highwayEfficiency=21.0
                 */
            }
        }, null, {enableHighAccuracy:true});
    }

});