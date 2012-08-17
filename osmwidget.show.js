//debug('192.168.88.158:8080');
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

    $('.button').button();
    
 

    var directionsShown = false;
    $("#directions").click(function () {
        $("#directionsPanel").toggle();
        $("#directionsCompact").toggle();
        directionsShown = !directionsShown;
        audios.init();
    });

    var compactMode = false;
    $("#directionsCompact").click(function() {
        compactMode = !compactMode;
    });



    $("#map").width($(window).width());    
    $("#map").height($(window).height());
    var map = new L.Map('map');

    if (params.lon) params.lng = params.lon;

    map.setView(new L.LatLng(params.lat, params.lng), params.zoom);

    switchLayer(map, Layers[params.map]);
    $("#mapLayer").val(params.map);
    $("#mapLayer").change(function (e) {
        var whichLayer = $(this).val();
        switchLayer(map, Layers[whichLayer]);
    });



    // AUDIO
    
    var audios = (function() {

        var self = {}, isInit = false;

        var init = self.init = function() {
            if (isInit) return;
            initAudio = false;

            //var audios = ['turn-left','turn-right', 'turn-slight-left', 'turn-slight-right', 'keep-straight', 'goal-reached'];
            var audios = ['climb-the-ramp'
        ,'goal-reached'
        ,'keep-left'
        ,'keep-right'
        ,'keep-straight'
        ,'merge-left'
        ,'merge-right'
        ,'take-exit-left'
        ,'take-exit-right'
        ,'turn-left'
        ,'turn-right'
        ,'turn-sharp-left'
        ,'turn-sharp-right'
        ,'turn-slight-left'
        ,'turn-slight-right'];
            audios.forEach(function(item, i) {
                var a = $("<audio />").attr('data-text', item).attr('preload', 'auto');
                $("<source />")
                .attr('src', 'audio/' + item + '.mp3')
                .attr('type', 'audio/mpeg')
                .appendTo(a);
            $("<source />")
                .attr('src', 'audio/' + item + '.ogg')
                .attr('type', 'audio/ogg')
                .appendTo(a);
            a.appendTo("#audio");
            });
        }
        var audioMap = {
            "icon-dirs-end_sm":"goal-reached"
                ,"rs_fork_left2_sm":"keep-left"
                ,"rs_fork_right2_sm":"keep-right"
                ,"rs_gr_exitright_sm":"take-exit-right"
                ,"rs_gr_exitleft_sm":"take-exit-left"
                ,"rs_left_sm":"turn-left"
                ,"rs_merge_left_sm":"merge-left"
                ,"rs_merge_right_sm":"merge-right"
                ,"rs_ramp_sm":"climb-the-ramp"
                ,"rs_right_sm":"turn-right"
                ,"rs_sharp_left_sm":"turn-sharp-left"
                ,"rs_sharp_right_sm":"turn-sharp-right"
                ,"rs_slight_left_sm":"turn-slight-left"
                ,"rs_slight_right_sm":"turn-slight-right"
                ,"rs_straight_sm":"keep-straight"
        };

        var playIcon = self.playIcon = function(icon) {
             var audio = audioMap[icon];
             var which = $('#audio > audio[data-text="' + audio + '"]');
             try {
                 // workaround for the default android 4 browser
                 if (navigator.userAgent.indexOf('Android 4') > -1
                         && navigator.userAgent.indexOf('WebKit') > -1)
                     which[0].loop = true;
                 which[0].currentTime = 0;
                 which[0].play();
             } catch (e) {}
        }
        
        return self;
    }());




    var myMarker = null, autocenter = false;

    var checkCenterMap = function() {
        if (myMarker && autocenter) { 
            map.setView(myMarker.getLatLng(), map.getZoom());
            autocenter = true; // otherwise move triggers and autocenter resets.
        }
    }

    var createMyMarker = function(lat, lng) {
        myMarker = new L.Marker(new L.LatLng(lat, lng), {draggable:true});
        myMarker.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + 'home.png'}));
        map.addLayer(myMarker);
        myMarker.on('dragstart', function() {
            updateMyMarker = false; 
        });
        myMarker.on('drag', function() {
            var ll = myMarker.getLatLng();
            ll.ts = new Date().getTime();
            speedMeasurer.push(ll);
        });
        myMarker.on('dragend', function() {
            checkCenterMap();
        });


        myMarker.on(tevents.menu, menu({
            "Follow my location": function() {
                if (lastKnownPosition)
                    myMarker.setLatLng(new L.LatLng(lastKnownPosition.lat, lastKnownPosition.lng));
                updateMyMarker = true;
            },
            "Autocenter map": function() {
                autocenter = true;
            }
        }));
    }



    var targetMarker = null;
    var createTarget = function(lat, lng) {
        targetLocation = new L.LatLng(lat, lng);
        targetMarker = new L.Marker(targetLocation, {draggable:true});
        targetMarker.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + 'regroup.png'}));
        map.addLayer(targetMarker);
        targetMarker.on(tevents.menu, menu({
            "Reset location": function() {
                targetMarker.setLatLng(targetLocation);
            }
        }));

    }
    if ("target" in params) { 
        var markerArray = params.target.split(","),
            markerLat = markerArray[0],
                      markerLng = markerArray[1];
        createTarget(markerLat, markerLng);
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



    var mapMenu = menu({
        "Set my location": function(e) {
            if (!myMarker) createMyMarker(e.latlng.lat, e.latlng.lng);
            else myMarker.setLatLng(e.latlng);
            checkCenterMap();
            updateMyMarker = false;
        },
        "Set target here": function(e) {
            if (!targetMarker) createTarget(e.latlng.lat, e.latlng.lng);
            else targetMarker.setLatLng(e.latlng);
        }
    });
    if (tevents.menu == 'longclick') 
        mapLongPress(map, mapMenu); 
    else
        map.on("contextmenu", mapMenu); 

    map.on('movestart', function() { 
        autocenter = false; 
    });



    var lastPoly, lastRequest = 0, lastLeg = null, lastDist = null;
    var timers = 0, audioPlaying = false;
    
    setInterval(function() {
        ++timers;


        // Request directions updates only if directions is clicked
        if (!directionsShown || !myMarker || !targetMarker) return;

        var srcLoc = myMarker.getLatLng();
        var dstLoc = targetMarker.getLatLng();

        if (lastLeg) {

            // Update directions panel with distances and colors
            var minll = closestLatLngPoly(srcLoc, lastLeg);
            var id = minll.segment + 1;            
            $("#directionsPanel tr").css({color: 'inherit'}).show();
            var done = $("#directionsPanel tr:lt(" + id + ")");
            done.css({color: '#00aa00'});
            if (compactMode) done.hide();
            var current = $("#directionsPanel tr:eq(" + id + ")");
            current.css({color: '#0033FF'});
            if (compactMode) $("#directionsPanel tr:gt(" + (id + 1) + ")").hide();
            var distCell = $("#directionsPanel tr:eq(" + id + ") td.distance");
            var curDist = lastLeg[id].distanceTo(srcLoc);
            
            // Play audio if necessary
            if (lastDist && timers % 2 == 1) {
                //var timeRemaining = curDist / ((lastDist - curDist) / 2);
                var timeRemaining = curDist / speedMeasurer.get();
                //console.log(timeRemaining)
                if (timeRemaining < 5 && lastDist - curDist > 0.001 && !audioPlaying) {
                    audioPlaying = true;                   
                    setTimeout(function() { audioPlaying = false; }, 3500);                    
                    if (window.speak) {
                        var audioText = $("#directionsPanel tr:eq(" + id + ") td.text").text();
                        console.log("Play audio:", audioText);
                        speak.play(audioText, {amplitude: 100, wordgap: 0, pitch:100, speed:160, noWorker:true}, function() {
                            console.log("play audio ended");
                            audioPlaying = false;
                        });
                    } 
                    else {
                        var srcImg = current.find("td:eq(0) img").attr('src');
                        var imgseg = srcImg.split('/').pop().split('.').shift();
                        audios.playIcon(imgseg);
                    }
                }
                lastDist = null;
            }

            lastDist = curDist;
            //console.log(curDist);
            distCell.text(Convert.toDistance(curDist / 1000));
        }

       
        if (lastPoly) {
            var minll = closestLatLngPoly(srcLoc, lastPoly.getLatLngs());
            // dont request if we're still on the last route.
            if (minll.distance < 100) return; 
        }            
        // requests at least 5 seconds apart
        if ((new Date().getTime() - lastRequest) < 5000) return;

        // Request update
        /*
           callback=e&outFormat=json&routeType=shortest&timeType=1&enhancedNarrative=false
           &shapeFormat=raw&generalize=200&locale=en_GB&unit=m
           &from=38.89403,-77.075555&to=38.84457,-77.078222
           &drivingStyle=2&highwayEfficiency=21.0
           */
        lastRequest = new Date().getTime();
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
                if (response.route && response.route.legs && response.route.legs.length) {
                    var lastItem = null;
                    response.route.legs[0].maneuvers.forEach(function (item) {
                        var row = $('<tr />').addClass('point');
                        $('<img />').attr('src', item.iconUrl).appendTo($('<td/>').appendTo(row));
                        var textCell = $('<td />').addClass('text');
                        textCell.html(item.narrative);

                        textCell.appendTo(row);

                        var distCell = $('<td />').addClass('distance');
                        if (lastItem) {
                            distCell.html(Convert.toDistance(lastItem.distance))
                        }
                        lastItem = item;
                        distCell.appendTo(row);
                        row.appendTo($("#directionsPanel > table"));
                    });
                    lastLeg = response.route.legs[0].maneuvers.map(function(m) {
                        return new L.LatLng(m.startPoint.lat, m.startPoint.lng);
                    });
                }
                if (response.route && response.route.shape && response.route.shape.shapePoints) {
                    var latLngs = [], sp = response.route.shape.shapePoints;
                    for (var k = 0; k < sp.length; k += 2) {
                        latLngs.push(new L.LatLng(sp[k], sp[k + 1]));
                    }
                    if (lastPoly) map.removeLayer(lastPoly);
                    lastPoly = new L.Polyline(latLngs);
                    map.addLayer(lastPoly);
                }
            });

    }, 1000);


    var speedMeasurer = (function() {
        var self = {};
        var locs = [];
        var push = self.push = function(loc) {
            locs.push(loc);
            while (locs.length && loc.ts - locs[0].ts > 5000) locs.shift();
        }
        var get = self.get = function() {
            var l2 = locs[locs.length - 1], l1 = locs[0];
            return l2.distanceTo(l1) / ((l2.ts - l1.ts) / 1000);
        } 
        return self;
    }());
    // Request repeated location updates.
    var updateMyMarker = true, lastKnownPosition = null;
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function (position) {
            lastKnownPosition = {lat: position.coords.latitude, lng: position.coords.longitude};
            if (!updateMyMarker) return;
            var latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
            if (!myMarker) 
                createMyMarker(position.coords.latitude, position.coords.longitude);
            else
                myMarker.setLatLng(latlng);
            latlng.ts = new Date().getTime();
            speedMeasurer.push(latlng);
            checkCenterMap();
                                            
        }, null, {enableHighAccuracy:true});
    }

});
