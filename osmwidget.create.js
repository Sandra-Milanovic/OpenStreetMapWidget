var putParams = function (obj) {
    var arrayStr = [];
    for (key in obj) {
        arrayStr.push(key + "=" + obj[key]);
    }
    return arrayStr.join("&");
}

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
    $("#mapLayer").change(function (e) {
        var whichLayer = $(this).val();
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


    var Editor = (function () {
        var self = {};
        self.defaultMode = {
            init:function () {
            },
            onClickMap:function () {
            }
        };
        self.targetMode = {
            init:function () {
            }

        }
        self.currentMode = self.defaultMode;
        self.setMode = function (m) {
            self.currentMode = m;
            m.init();
        }
    }());

    var targetMarker = null;
    // var placeMark2 = null;


    // Monkey-patch L.Marker to support right-click events
    var originalFunction = L.Marker.prototype.on;
    L.Marker.prototype.on = function (ev, fn) {
        if (ev == 'contextmenu') $(this._icon).bind('contextmenu', fn)
        else originalFunction.apply(this, arguments);
    };


    /* Editor */

    var placementMode = false;

    var setTarget = function (latlng) {
        if (targetMarker) {
            map.removeLayer(targetMarker);
        }
        targetMarker = new L.Marker(latlng, {draggable:true});
        map.addLayer(targetMarker);
        placementMode = false;
        targetMarker.on("dblclick", function (e) {
            map.removeLayer(targetMarker);
            targetMarker = null;
        });
        targetMarker.on("contextmenu", function () {

        });
    }

    map.on("click", function (e) {
        if (placementMode) {
            setTarget(e.latlng);
            placementMode = false;
            osmTooltip(osmw.help.afterTargetPlaced);
        }
    });
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


    $("#sendSms").bind('click', function () {
        var l = $("#dialog input.shortLink").val();
        var url = 'sms:123456?body=' + encodeURIComponent(l);
        window.location = url;
        return false;
    });

    $("#sendEmail").bind('click', function () {
        var l = $("#dialog input.shortLink").val();
        var url = 'mailto:?subject=Location&body=' + encodeURIComponent(l);
        window.location = url;
        return false;
    });

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
            lat:mapPosition.lat,
            lng:mapPosition.lng,
            zoom:mapZoom
        });

        if (targetMarker != undefined) {
            var markerLatLng = targetMarker.getLatLng();
            link += "&" + putParams({marker:markerLatLng.lat + "," + markerLatLng.lng})
        }

        var embedIframe = ['<iframe src="', link, '" width="480" height="420"></iframe>'];
        $("#dialog a").attr("href", link);
        $("#dialog input.shortLink").val(link);
        $("#dialog #iframe").val(embedIframe.join(""));

        getShortLink(link, function (short) {
            $("#dialog a.shortLink").attr('href', short);
            $("#dialog input.shortLink").val(short);
        });
    });


});