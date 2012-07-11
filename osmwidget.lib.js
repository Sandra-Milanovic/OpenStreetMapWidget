/**
 * Created with IntelliJ IDEA.
 * User: sandra
 * Date: 6/11/12
 * Time: 6:26 PM
 * To change this template use File | Settings | File Templates.
 */




window.menu = function (menu) {

    return function (e) {
        var menuDiv = $("<div />").addClass('menu').addClass('ui-widget-content');
        // a transparent div sized full-screen
        // that closes the menu when touched or pressed.
        // This enables us to close the menu when we click/touch outside of it.
        var closerDiv = $("<div />").addClass('menu-closer')
            .css({width:$(window).width(), height:$(window).height()})
            .bind('mousedown touchstart',function () {
                menuDiv.remove();
                closerDiv.remove();
            }).appendTo('body');

        // get the menu on top of everything
        menuDiv.appendTo('body');
        var lastItem;
        for (var key in menu) {
            lastItem = $("<div/>").addClass('item').appendTo(menuDiv)
                .bind('click',function () {
                    menuDiv.remove();
                    closerDiv.remove();
                    menu[key].apply(this, [e])
                }).text(key);
        }
        lastItem.css({'border-bottom':'none'});

        var isTouch = e && e.originalEvent && e.originalEvent.touches;

        var menuPos;
        if (isTouch) {
            // position the menu on the middle of the screen
            menuPos = {
                left:($(window).width() - menuDiv.width()) / 2,
                top:($(window).height() - menuDiv.height()) / 2
            };

        } else {
            // position the menu at the clicking/touching point,
            // but retract it if it goes off-screen.
            menuPos = { left:e.pageX, top:e.pageY };
            if (menuPos.left + menuDiv.width() > $(window).width())
                menuPos.left = $(window).width() - menuDiv.width();
            if (menuPos.top + menuDiv.height() > $(window).height())
                menuPos.top = $(window).height() - menuDiv.height();
        }
        menuDiv.css(menuPos);

        e.preventDefault();
        e.stopPropagation();
    };
};

//bla.on('contextmenu longclick', menu({
//    "Delete": function(e) {  },
//    "Reset": function(e) {  }
//}));


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
    "initialBeforeLocation":'Looking for your location. You can set the target using "Set Target" instead',
    "initial":'Target placed at your location. "Set Target" to change it, "Share Map" to share it.',
    "beforeTarget":'"Set Target" to change the target location.',
    "afterTarget":'Click or tap anywhere on the map to set the target there',
    "afterTargetPlaced":'"Share Map" to share this target, "Set Target" to change target'
};

(function () {
    var layer;
    window.switchLayer = function (map, l) {
        if (layer) map.removeLayer(layer);
        layer = new L.TileLayer(l.tiles, l.options);
        map.addLayer(layer);
    };

}());


window.Convert = {
    toDistance:function (d) {
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

var extractXY = function (event) {
    var e = event && event.originalEvent && event.originalEvent.touches ?
        event.originalEvent.touches[0] : event;
    return {x:e.pageX, y:e.pageY};
};

// Monkey-patch L.Marker to support right-click and long click events
(function () {
    var originalMarkerOn = L.Marker.prototype.on;
    L.Marker.prototype.on = function (ev, fn) {
        var marker = this;
        if (ev == 'contextmenu') $(this._icon).bind('contextmenu', function (e) {
            fn.call(marker, e)
        });
        else if (ev == 'longclick') {
            var t, startPos;
            $(this._icon).bind('mousedown touchstart', function (e) {

                if (!t && e.button != 2) {
                    startPos = extractXY(e);
                    t = setTimeout(function () {
                        fn.call(marker, e);
                        t = null;
                    }, 650);
                }
            });
            $(this._icon).bind('mousemove touchmove', function (e) {
                if (t && startPos) {
                    var pos = extractXY(e);
                    if (Math.abs(pos.x - startPos.x) + Math.abs(pos.y - startPos.y) > 15) {
                        clearTimeout(t);
                        t = null;
                    }
                }
            });
            $(this._icon).bind('mouseup touchend mouseout', function (e) {
                if (t) {
                    clearTimeout(t);
                    t = null;
                }
            });
        }
        else originalMarkerOn.apply(this, arguments);
    };
}());
