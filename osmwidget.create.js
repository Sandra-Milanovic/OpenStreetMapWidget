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
})

$(document).ready(function () {

    $('a.button').button();

    $("#dialog").dialog({
        autoOpen:false,
        bgIframe:true,
        title:"Embed map",
        width:Math.min(500, $(window).width() * 0.9),
        height:Math.min(270, $(window).height() * 0.9)
    });
    $("#introScreen").dialog({
        modal:true,
        autoOpen:true,
        bgIframe:true,
        title:"Welcome to osmwidget",
        width:Math.min(640, $(window).width() * 0.9),
        height:Math.min(480, $(window).height() * 0.9)
    });
    $("#map").width($(window).width());
    $("#map").height($(window).height());

    var map = new L.Map('map');
    var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:'Copyright (C) OpenStreetMap.org',
        maxZoom:18
    });
    map.addLayer(layer);
    map.setView(new L.LatLng(41.99477, 21.42785), 5);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            map.setView(
                new L.LatLng(position.coords.latitude, position.coords.longitude),
                14);
        });
    }

    var placeMark = null;
    // var placeMark2 = null;

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

    // Monkey-patch L.Marker to support right-click events
    var originalFunction = L.Marker.prototype.on;
    L.Marker.prototype.on = function (ev, fn) {
        if (ev == 'contextmenu') $(this._icon).bind('contextmenu', fn)
        else originalFunction.apply(this, arguments);
    };


    /* Editor */

    var placementMode = false;
    map.on("click", function (e) {
        if (placementMode) {

            if (placeMark) {
                map.removeLayer(placeMark);
            }
            placeMark = new L.Marker(e.latlng, {draggable:true});
            map.addLayer(placeMark);
            placementMode = false;
            $("#placeButton").css({"background-color":"#ccc"});
            placeMark.on("dragend", function (e) {
                // console.log(placeMark);
            });
            placeMark.on("dblclick", function (e) {
                console.log(placeMark);
                //map.removeLayer(placeMark);
            });
            placeMark.on("contextmenu", function () {
                alert("Hello rightclick!");
            });
        }
    });
    $("#placeButton").click(function () {
        placementMode = !placementMode;
        if (placementMode) {
            $("#placeButton").css("background-color", "#dd8");
        }
        else {
            $("#placeButton").css("background-color", "#ccc");
        }
    });
    var dialogVisible = false;


    $("#sendSms").click(function() {
        var l = $("#dialog input.shortLink").val();
        var url = 'sms:SENDTO?body=' + encodeURIComponent(l);
        window.location = url;
        return false;
    });

    $("#sendEmail").click(function() {
        var l = $("#dialog input.shortLink").val();
        var url = 'mailto:EMAIL?subject=Location&body=' + encodeURIComponent(l);
        window.location = url;
        return false;
    });

    $("#generateLink").click(function () {
        console.log(placeMark);
        $("#dialog").dialog({modal:true});
        $("#dialog").dialog('open');
        var hostPart = window.location.toString().split("#")[0];
        hostPart = hostPart.substr(0, hostPart.lastIndexOf('/'));

        var mapPosition = map.getCenter();
        var mapZoom = map.getZoom();
        var link = hostPart + "/show.html?" + putParams({
            lat:mapPosition.lat,
            lng:mapPosition.lng,
            zoom:mapZoom
        });

        if (placeMark != undefined) {
            var markerLatLng = placeMark.getLatLng();
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