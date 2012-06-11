/**
 * Created with IntelliJ IDEA.
 * User: sandra
 * Date: 6/11/12
 * Time: 6:26 PM
 * To change this template use File | Settings | File Templates.
 */

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