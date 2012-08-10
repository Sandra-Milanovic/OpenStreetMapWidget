(function($) {
    $(document).ready(function() {

    $('a[href^="http://sandra-milanovic.github.com/OpenStreetMapWidget/show.html"]')
      .each(function(i, item) {
        console.log(item);
        var w = $(item).attr('data-width'), h = $(item).attr('data-height');
        var dw = $(item).parent().width();
        var dh = Math.round(dw * 3 / 4)
        var iframe = $('<iframe />').attr({
            'src': $(item).attr('href'),
            'width':  w?w:dw,
            'height': h?h:dh
        });
        $(item).replaceWith(iframe);
    });

    });
}(jQuery));
