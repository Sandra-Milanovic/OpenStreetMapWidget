[OpenStreetMapWidget](http://sandra-milanovic.github.com/OpenStreetMapWidget/)
===============

This is a website project which allows users to edit and share an openstreetmap 
map by sending an sms / email or embeding the map on their website or blog.

Features :

 * Ability to specify a target - a single-location with the ability to get directions
 * Ability to mark additional places, edit their description and set their icon
 * Ability to draw lines and polygons on the map and set their coloring

The initial plan of the project was focused on embeding a map: the
plan was to provide wordpress and drupal plugins. The final version only
provides a basic wordpress plugin. 

Instead, I decided to switch focus to sharing the map on smartphones.
As smartphones become more ubiquitous, the availability of easy-to-share
maps that don't require any external applications to be shown or shared
(just a modern browser) seems more important than ever. 

Hopefully this project might just be able to bring a change in the way people 
explain the location of places to eachother. No more confusing references
to other potentially unknown places: instead, a plan hyperlink to a map providing
turn by turn voice directions can be sent with just 3 simple clicks.

This project was possible thanks to [OpenStreetMap](http://openstreetmap.org), 
[MapQuest OpenDirections](http://developer.mapquest.com/web/products/open/directions-service), 
[Leaflet](http://leaflet.cloudmade.com/) and [google-maps-icons](http://code.google.com/p/google-maps-icons/)
and [Bitly](https://bitly.com/)

Some notes:

* The app works without a backend server. All maps are encoded within the URL. 
  In this sense Bitly also acts a database. This should also help with
  privacy concerns (your location isn't really stored anywhere)

* Voice directions sounds are pre-made with a espeak and played back using HTML5 audio. 
  A builder script is included in the audio dir. Though an espeak port to JS is 
  also included, it doesn't work on smartphones and its not presently in use.

* Usability could be improved by adding more guidance (for example explaining the 
  availabilitt of advanced rightclick/longpress actions would help)

Check out the [demonstration](http://sandra-milanovic.github.com/OpenStreetMapWidget/)

Or check out the page on the [openstreetmap wiki](http://wiki.openstreetmap.org/wiki/Google_Summer_of_Code/2012/OSM_widget_constructor)
