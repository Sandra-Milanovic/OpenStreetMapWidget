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
        console.log(data);
        callback(data.data.url);
    });
}

$(window).resize(function () {
    $("#map").width($(window).width());
    $("#map").height($(window).height());
});

$(document).ready(function () {
    //debug();


    $('a.button').button();

    $("#dialog").dialog({
        autoOpen:false,
        bgIframe:true,
        title:"Embed map",
        width:Math.min(500, $(window).width() * 0.9)
    });
    $("#introScreen").dialog({
        modal:true,
        autoOpen:false,
        bgIframe:true,
        title:"Welcome to osmwidget",
        width:Math.min(640, $(window).width() * 0.9)
    });

    $("#openPlacemarkEditor").bind('click', function () {
        $("#introScreen").dialog('close');
    });

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


    // var Editor = (function () {
    //     var self = {};
    //     self.defaultMode = {
    //         init:function () {
    //         },
    //         onClickMap:function () {
    //         }
    //     };
    //     self.targetMode = {
    //         init:function () {
    //         }

    //     }
    //     self.currentMode = self.defaultMode;
    //     self.setMode = function (m) {
    //         self.currentMode = m;
    //         m.init();
    //     }
    // }());

    var targetMarker = null;
    // var placeMark2 = null;


    /* Editor */

    var placementMode = false;

    var setTarget = function (latlng) {
        if (targetMarker) {
            map.removeLayer(targetMarker);
        }

        var TargetIcon = L.Icon.extend({
            iconUrl:'home.png',
            iconSize:new L.Point(32, 38),
            iconAnchor:new L.Point(16, 38),
            popupAnchor:new L.Point(16, -48)
        });

        targetMarker = new L.Marker(latlng, {draggable:true});
        targetMarker.setIcon(new TargetIcon('target.png'));
        map.addLayer(targetMarker);
        placementMode = false;
        targetMarker.on("dblclick", function (e) {
            map.removeLayer(targetMarker);
            targetMarker = null;
        });
        var targetMenu = menu({
            "Hello":function () {
                alert("Hi");
            },
            "Good bye":function () {
                alert("Bye bye");
            }
        });
        targetMarker.on("contextmenu", targetMenu);
        targetMarker.on("longclick", targetMenu);
    };

    map.on("click", function (e) {
        if (placementMode) {
            setTarget(e.latlng);
            placementMode = false;
            osmTooltip(osmw.help.afterTargetPlaced);
        }
    });

    // Place button and placement mode switcher
    $("#placeButton").bind('click', function () {

        placementMode = !placementMode;


        if (placementMode) {
            if (targetMarker) map.removeLayer(targetMarker);
            osmTooltip(osmw.help.afterTarget);
        }
        else {
            $("#placeButton").css("background-color", "#ccc");
            osmTooltip(osmw.help.beforeTarget);
        }
    });
    var dialogVisible = false;

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
        console.log(targetMarker);
        $("#dialog").dialog({modal:true});
        $("#dialog").dialog('open');

        setTimeout(function () {
            $("#dialog a").focus();
        }, 15);
        var hostPart = window.location.toString().split("#")[0];
        hostPart = hostPart.substr(0, hostPart.lastIndexOf('/'));

        var mapPosition = map.getCenter();
        var mapZoom = map.getZoom();
        var link = hostPart + "/show.html?" + putParams({
            lat:mapPosition.lat.toFixed(5),
            lng:mapPosition.lng.toFixed(5),
            zoom:mapZoom,
            map:window.whichLayer
        });

        if (targetMarker != undefined) {
            var markerLatLng = targetMarker.getLatLng();
            link += "&" + putParams({target:markerLatLng.lat.toFixed(5) + "," + markerLatLng.lng.toFixed(5)})
        }

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