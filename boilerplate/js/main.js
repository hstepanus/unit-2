// declare map var in global scope
var map;

// function to instantiate the Leaflet map
function createMap() {
    // create the map
    map = L.map('map', {
        center: [20, 0],
        zoom: 2
    });

    // add OSM base tilelayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // call getData function
    getData();
}

// function to retrieve the data and place it on the map
function getData() {
    // load the data
    fetch("data/Eastcoast_cities.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            // create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                pointToLayer: function(feature, latlng) {
                    // create marker options
                    var geojsonMarkerOptions = {
                        radius: 8,
                        fillColor: "#ff7800",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    };
                    // return a CircleMarker for each feature
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            }).addTo(map);
        })
        .catch(function(error) {
            console.error('Error fetching GeoJSON data:', error);
        });
}

document.addEventListener('DOMContentLoaded', createMap);