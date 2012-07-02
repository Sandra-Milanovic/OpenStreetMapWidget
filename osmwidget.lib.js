/**
 * Created with IntelliJ IDEA.
 * User: sandra
 * Date: 6/11/12
 * Time: 6:26 PM
 * To change this template use File | Settings | File Templates.
 */



window.Layers = {
    'standard':{
        tiles:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options:{
            attribution:'Copyright (C) OpenStreetMap.org',
            maxZoom:18
        }
    },
    'cycle':{
        tiles:'http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
        options:{
            attribution:'Copyright (C) OpenCycleMap.org',
            maxZoom:18
        }
    },
    'transport':{
        tiles:'http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png',
        options:{
            attribution:'Copyright (C) OpenStreetMap.org',
            maxZoom:18
        }
    },
    'mapquest':{
        tiles:'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
        options:{
            attribution:'Copyright (C) MapQuest',
            maxZoom:18,
            subdomains:['1', '2', '3']
        }
    }
};

window.latLngCoder = (function (map) {
    map = map ? map : "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
    var self = {};
    var encodenum = function (num, len) {
        var enc = [];
        while (num > 0) {
            enc.unshift(map[num % map.length]);
            num = Math.floor(num / map.length);
        }
        while (len && enc.length < len--) enc.unshift("0");
        return enc.join("");
    }
    var decodenum = function (code) {
        var dec = 0;
        for (var k = 0; k < code.length; ++k) {
            dec *= map.length;
            dec += map.indexOf(code[k]);
        }
        return dec;
    };

    /**
     * Encode a latlng object
     * @param c {lat:123.456789,lng:123.456789}
     * @return  "1234512345"
     */
    self.encode = function (c) {
        return encodenum(Math.round(c.lat * 1000000), 5) + encodenum(Math.round(c.lng * 1000000), 5);
    };

    /**
     * Same as encode, only reversed
     * @param c encode string
     * @return object with lat and lng
     */
    self.decode = function (c) {
        console.log(decodenum(c.substr(0, 5)));
        return {lat:decodenum(c.substr(0, 5)) / 1000000, lng:decodenum(c.substr(5)) / 1000000};
    };
    return self;

}());
window.osmw = {};

window.osmw.help = {
    "initialNoLocation":'Cannot find your location. Use "Set Target" to set the target location',
    "initialBeforeLocation": 'Looking for your location. You can set the target using "Set Target" instead',
    "initial": 'Target placed at your location. "Set Target" to change it, "Share Map" to share it.',
    "beforeTarget":'"Set Target" to change the target location.',
    "afterTarget":'Click or tap anywhere on the map to set the target there',
    "afterTargetPlaced":'"Share Map" to share this target, "Set Target" to change target'
};

(function() {
    var layer;
    window.switchLayer = function (map, l) {
        if (layer) map.removeLayer(layer);
        layer = new L.TileLayer(l.tiles, l.options);
        map.addLayer(layer);
    };

}());



window.Convert = {
    toDistance: function(d) {
        return d.toFixed(2) + ' km';
    }
}

osmTooltip = (function () {

    var tooltip = null;
    var init = function () {
        tooltip = $("<div />").hide()
            .addClass('ui-widget-content').addClass('tooltip')
            .appendTo('body');
        tooltip.bind('touchend mouseup', function () {
            tooltip.hide();
        });
    }

    return function (text) {
        if (!tooltip) init();
        if (!text) tooltip.hide();
        else {
            tooltip.text(text).show();
        }
    }
}());


