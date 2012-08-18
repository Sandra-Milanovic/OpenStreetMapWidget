
/**
 * Creates URL parameters from an object
 * @param obj the object
 * @return the url string
 */
var putParams = function (obj) {
    var arrayStr = [];
    for (key in obj) {
        arrayStr.push(key + "=" + obj[key]);
    }
    return arrayStr.join("&");
}

// A link shortener function, using the bitly link shortening API

/**
 * Shorten a link using bitly
 * @param longURL the url to shorten
 * @param callback callback(shortenedUrl) to call when done
 */

var getShortLink = function (longURL, callback) {
    $.get("https://api-ssl.bitly.com/v3/shorten", {
        access_token:"9e6943f1fa1d50b25cd1cca6e5437a9ab5f2a1a7",
        longUrl:longURL
    }, function (data) {
        callback(data.data.url);
    });
};

$(window).resize(function () {
    $("#map").width($(window).width());
    $("#map").height($(window).height());
});

$(document).ready(function () {

    //debug("192.168.178.30:8080");


    $('a.button').button();

    var defaultWidth = Math.min(500,$(window).width()*0.9);

    $("#dialog").dialog({
        autoOpen:false,
        bgIframe:true,
        title:"Embed map",
        width:defaultWidth
    });


    $("#editPlacemark").dialog({
        autoOpen:false,
        bgIframe:true,
        title:"Edit placemark",
        width:defaultWidth
    });

    $("#editPoly").dialog({
        autoOpen:false,
        bgIframe:true,
        title:"Edit polyline info",
        width:Math.min(240, defaultWidth)
    });


    icons.list.sort();
    var editPlacemark = function (pm) {
        $("#editPlacemark").dialog('open');
        $("#editPlacemark .text").val(pm.text);
        $("#editPlacemark .iconval").val(pm.icon);
        var iconList = $("#editPlacemark .icons");
        iconList.html("");

        if (L.Browser.touch) {
            $("#editPlacemark .scroll").css({height:'auto'});
            $("#editPlacemark .save-alt").button();
            $("#editPlacemark .save-alt").show();
        }
        else {
            $("#editPlacemark .scroll").css({'overflow':'auto'});
            $("#editPlacemark .save-alt").hide();
        }

        icons.list.forEach(function (ico) {
            var icoDiv = $("<div />")
                .addClass('icon')
                .text(ico.split('.')[0])
                .css('background-image', 'url(' + icons.urlPrefix + ico + ')')
                .attr('data-icon', ico)
                .appendTo(iconList);
            if (ico == pm.icon) icoDiv.addClass('active');
            icoDiv.bind('click', function () {
                $("#editPlacemark .icons .icon").removeClass('active');
                icoDiv.addClass('active');
                $("#editPlacemark .iconval").val(icoDiv.attr('data-icon'));
            })
        });
        var saveFn = function () {
            pm.text = $("#editPlacemark .text").val();
            pm.icon = $("#editPlacemark .iconval").val();
            pm.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + pm.icon}));
            pm.on(tevents.menu, pm.pmMenu);
            $("#editPlacemark").dialog('close');
        };
        $("#editPlacemark").dialog('option', 'buttons', {Save:saveFn});
        $("#editPlacemark .save-alt").unbind('click').bind('click', saveFn);
    };

    var placemarks = [];
    var createPlacemark = function (latlng, opt) {
        opt = $.extend({
            icon:'places-unvisited.png',
            text:""
        }, opt);
        var m = new L.Marker(latlng, {draggable:true});
        map.addLayer(m);
        m.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + opt.icon}));
        m.pmMenu = menu({
            "Remove placemark":function () {
                placemarks.splice(placemarks.indexOf(m), 1);
                map.removeLayer(m);
            },
            "Edit info":function () {
                editPlacemark(m);
            }
        });
        m.on(tevents.menu, m.pmMenu);

        m.icon = opt.icon;
        m.text = opt.text;

        placemarks.push(m);
        editPlacemark(m);
        return m;
    };


    $("#map").width($(window).width());
    $("#map").height($(window).height());


    var map = new L.Map('map');
    map.setView(new L.LatLng(41.99477, 21.42785), 5);

    switchLayer(map, Layers.standard);
    window.whichLayer = "standard";
    $("#mapLayer").change(function (e) {
        window.whichLayer = $(this).val();
        switchLayer(map, Layers[whichLayer]);

    });

    osmTooltip(osmw.help.initialBeforeLocation);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latlng = new L.LatLng(position.coords.latitude, position.coords.longitude);
            setTarget(latlng);
            map.setView(latlng, 14);
            osmTooltip(osmw.help.initial);
        });
    } else {
        osmTooltip(osmw.help.initialNoLocation);
    }


    // var placeMark2 = null;


    /* Editor */



    var polyline = {};
    polyline.all = [];
    polyline.current = null;
    polyline.create = function (latlng) {
        var self = {},
            markers = [],
            position = 0,
            direction = 1,
            poly = null,
            type = "Polyline",
            style = {
                stroke:true,
                color: "#0000FF",
                fill: false,
                fillColor:"#0000FF"
            }
            
        var makeMarker = function (latlng) {
            var polyMark = new L.Marker(latlng, {draggable:true});
            polyMark.setIcon(new PolyIcon({iconUrl:'polymarker.png'}));
            map.addLayer(polyMark);

            var polyMarkMenu = menu({
                "Stop drawing": function() {
                    osmTooltip(osmw.help.afterTargetPlaced);
                    mode = 'default';
                },
                "Remove point":function () {
                    self.remove(polyMark);
                },
                "Draw before":function () {
                    position = markers.indexOf(polyMark);
                    direction = 0;
                    mode = 'polyedit'
                },
                "Draw after":function () {
                    position = markers.indexOf(polyMark);
                    direction = 1;
                    mode = 'polyedit'
                },
                "Fill and line":function () {
                    $("#editPoly").dialog('open');
                    var pickers = $("#editPoly .color-picker"); 
                    $("#editPoly .stroke").val(style.color);
                    $("#editPoly .fill").val(style.fillColor);
                    $("#editPoly .cbFill").val(style.fill);

                    pickers.miniColors({letterCase: 'uppercase'});
                    $("#editPoly").dialog('option', 'buttons', {
                        Save:function() {
                            style.color     = $("#editPoly .stroke").val();
                            style.fill      = $("#editPoly .cbFill").is(":checked");
                            style.fillColor = $("#editPoly .fill").val();
                            setStyle(style);     
                            $("#editPoly").dialog('close');
                        }
                    });
                }
            });
            polyMark.on(tevents.menu, polyMarkMenu);
            polyMark.on('dragend', updatePoly);
            return polyMark;
        };

        var updatePoly = function () {
            var latlngs = markers.map(function (m) {
                return m.getLatLng();
            });
            if (!poly && markers.length > 1) {
                poly = new L[type](latlngs, style);
                map.addLayer(poly);
            }
            else if (poly && markers.length <= 1) {
                map.removeLayer(poly);
            }
            if (markers.length > 1) {
                poly.setLatLngs(latlngs);
            }
        };

        var setStyle = self.setStyle = function (s) {
            style = s;
            type = style.fill ? 'Polygon' : 'Polyline';
            if (poly) map.removeLayer(poly);
            poly = null;
            updatePoly();
        };
        var getStyle = self.getStyle = function() {
            return style;
        }

        self.draw = function (latlng) {
            position += direction;
            markers.splice(position, 0, makeMarker(latlng));
            updatePoly();
        };

        self.remove = function (m) {
            if (m == null) {
                markers.forEach(function (m) {
                    map.removeLayer(m);
                });
                map.removeLayer(poly);
                polyline.all.splice(polyline.all.indexOf(self), 1);
            }
            markers.splice(markers.indexOf(m), 1);
            map.removeLayer(m);
            updatePoly();
        };
        self.markers = function () {
            return markers;
        };
        self.draw(latlng);

        var toString = self.toString = function() {
            var latlngsString = markers.map(function(m) { return latLngCoder.encode(m.getLatLng()) }).join("");
            var polyString = latlngsString + ";" + style.color.substring(1) + ";" + (style.fill ? style.fillColor.substring(1) : '');
            return polyString;
        }

        return self;
    };


    var mode = 'default';
    var modes = {
        'default':{
            mapclick:function () {

            },
            mapmenu:menu({
                "Mark place":function (e) {
                    createPlacemark(e.latlng);
                },
                "Start drawing":function (e) {
                    polyline.current = polyline.create(e.latlng);
                    polyline.all.push(polyline.current);
                    mode = 'polyedit';
                    osmTooltip(osmw.help.startDrawing);                    
                },
                "Put target here": function(e) {
                    setTarget(e.latlng);
                }
            })
        },
        placement:{
            mapclick:function (e) {
                setTarget(e.latlng);
                mode = 'default';
                osmTooltip(osmw.help.afterTargetPlaced);
            }
        },
        polyedit:{
            mapclick:function (e) {
                polyline.current.draw(e.latlng);
            },
            mapmenu:menu({
                "Stop drawing":function (e) {
                    osmTooltip(osmw.help.afterTargetPlaced);
                    mode = 'default';
                }
            })
        }
    };

    var actionBind = function (action) {
        return function () {
            if (modes[mode].hasOwnProperty(action)) {
                modes[mode][action].apply(this, arguments);
            }
            else {
                modes['default'][action].apply(this, arguments);
            }
        };
    };
    map.on("click", function() {
        if ($("body > div.menu-closer").length) return;
        actionBind('mapclick').apply(this, arguments);
    });


    if (tevents.menu == 'longclick') 
        mapLongPress(map, actionBind('mapmenu'));
    else
        map.on("contextmenu", actionBind('mapmenu'));



    var MarkerIcon = L.Icon.extend({
        iconUrl:icons.urlPrefix + 'home.png',
        iconSize:new L.Point(32, 38),
        iconAnchor:new L.Point(16, 38),
        popupAnchor:new L.Point(16, -48)
    });

    var PolyIcon = L.Icon.extend({
        iconUrl:'polymarker.png',
        iconSize:new L.Point(16, 16),
        iconAnchor:new L.Point(-8, -8),
        popupAnchor:new L.Point(8, 8)
    });


    var targetMarker = null;
    var setTarget = function (latlng) {
        if (targetMarker) {
            map.removeLayer(targetMarker);
        }
        targetMarker = new L.Marker(latlng, {draggable:true});
        targetMarker.setIcon(new MarkerIcon({iconUrl:icons.urlPrefix + 'regroup.png'}));
        map.addLayer(targetMarker);
        placementMode = false;

    };


    // Place button and placement mode switcher
    $("#placeButton").bind('click', function () {
        mode = (mode == 'placement' ? 'default' : 'placement');
        if (mode == 'placement') {
            if (targetMarker) map.removeLayer(targetMarker);
            osmTooltip(osmw.help.afterTarget);
        }
        else {
            $("#placeButton").css("background-color", "#ccc");
            osmTooltip(osmw.help.beforeTarget);
        }
    });

    // Send link by SMS. Recipient issue on some Android 2.3 phones
    $("#sendSms").bind('click', function () {
        var l = $("#dialog input.shortLink").val();
        var url = 'sms:123456?body=' + encodeURIComponent(l);
        window.location = url;
        return false;
    });

    // Send link by email
    $("#sendEmail").bind('click', function () {
        var l = $("#dialog input.shortLink").val();
        var url = 'mailto:?subject=Location&body=' + encodeURIComponent(l);
        window.location = url;
        return false;
    });

    /* Generating the link with the map parameters.
     setTimeout is used with the goal to change the focus from the textbox.
     to prevent virtual keyboards from popping out */
    $("#generateLink").bind('click', function () {
        $("#dialog").dialog({modal:true});
        $("#dialog").dialog('open');

        setTimeout(function () {
            $("#dialog a").focus();
        }, 15);
        var hostPart = window.location.toString().split("#")[0];
        hostPart = hostPart.substr(0, hostPart.lastIndexOf('/'));

        var mapPosition = map.getCenter();
        var mapZoom = map.getZoom();

        var x = new L.Marker();
        var pmString = placemarks.map(function (pm) {
            return latLngCoder.encode(pm.getLatLng()) + ";" + pm.icon + ";" + pm.text;
        }).join(",");

        var polysString = polyline.all.map(function(pl) { return pl.toString(); }).join(",");

        var paramsObj = {
            lat:mapPosition.lat.toFixed(5),
            lon:mapPosition.lng.toFixed(5),
            zoom:mapZoom,
            map:window.whichLayer,
            target: targetMarker != undefined ? (targetMarker.getLatLng().lat.toFixed(5) + "," + targetMarker.getLatLng().lng.toFixed(5)) : null,
            polys: polysString,
            places:pmString
        }
       
        // Optimize URL 
        for (var key in paramsObj) if (paramsObj.hasOwnProperty(key)) 
            if (!paramsObj[key] || paramsObj[key].length < 1)
                delete paramsObj[key];
        

        var link = hostPart + "/show.html?" + putParams(paramsObj);

        //if (targetMarker != undefined) {
            //var markerLatLng = targetMarker.getLatLng();
            //link += "&" + putParams({target:markerLatLng.lat.toFixed(5) + "," + markerLatLng.lng.toFixed(5)})
        //}

        $("#dialog a").attr("href", link);
        $("#dialog input.shortLink").val(link);


        var dim = {w:480, h:420};
        dim.update = function () {
            var embedIframe = ['<iframe src="', link, '" width="', dim.w, '" height="', dim.h, '"></iframe>'];
            $("#dialog #iframe").val(embedIframe.join(""));
        };
        dim.update();


        $('input.iframe-dimensions').change(function () {
            dim[$(this).attr('name')] = $(this).val();
            dim.update();
        });

        // in html: <input type="text" name="w" value="480" class="iframe-dimensions"> <input type="text" name="h" value="420" class="iframe-dimensions">

        getShortLink(link, function (short) {
            $("#dialog a.shortLink").attr('href', short);
            $("#dialog input.shortLink").val(short);
        });
    });

});
