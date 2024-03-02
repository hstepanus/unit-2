// Declare map variable globally so all functions have access
var map;
var minValue;

// Function to create the map
function createMap() {
    // Create the map
    map = L.map('map', {
        center: [0, 0],
        zoom: 2
    });

    // Add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    // Call getData function
    getData();
};

// Function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {
    var attribute = attributes[0];
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    var attValue = Number(feature.properties[attribute]);
    options.radius = calcPropRadius(attValue);

    return L.circleMarker(latlng, options);
}

// Function to calculate the minimum value
function calculateMinValue(data) {
    var allValues = [];
    for (var city of data.features) {
        for (var year = 2011; year <= 2017; year += 1) {
            var value = city.properties["Pop_" + String(year)];
            allValues.push(value);
        }
    }
    minValue = Math.min(...allValues);
}

// Function to calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    var minRadius = 5;
    var radius = 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRadius;
    return radius;
};

// Function to create proportional symbols on the map
function createPropSymbols(data) {
    var attributes = processData(data);
    L.geoJson(data, {
        pointToLayer: function(feature, latlng) {
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);

    createSequenceControls(attributes);
}

// Function to create sequence controls (range input and buttons)
function createSequenceControls(attributes) {
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend', slider);

    document.querySelector(".range-slider").max = attributes.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend', '<button class="step" id="forward">Forward</button>');

    document.querySelector('#reverse').insertAdjacentHTML('beforeend', "<img src='img/reverse.jpg' width='45px'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend', "<img src='img/forward.jpg' width='45px'>");

    document.querySelectorAll('.step').forEach(function(step) {
        step.addEventListener("click", function() {
            var index = document.querySelector('.range-slider').value;
            if (step.id == 'forward') {
                index = (index < attributes.length - 1) ? ++index : 0;
            } else if (step.id == 'reverse') {
                index = (index > 0) ? --index : attributes.length - 1;
            }
            document.querySelector('.range-slider').value = index;
            updatePropSymbols(attributes[index]);
        });
    });

    document.querySelector('.range-slider').addEventListener('input', function() {
        var index = this.value;
        updatePropSymbols(attributes[index]);
    });
}

// Function to update proportional symbols based on the selected attribute
function updatePropSymbols(attribute) {
    map.eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties[attribute]) {
            var props = layer.feature.properties;
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            var popupContent = "<p><b>City:</b> " + props.City + "</p>";
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Police per 100000 people in " + year + ":</b> " + props[attribute] + " polices</p>";
            layer.bindPopup(popupContent);
        }
    });
}

// Function to process data and extract attributes
function processData(data) {
    var attributes = [];
    var properties = data.features[0].properties;
    for (var attribute in properties) {
        if (attribute.indexOf("Pop") > -1) {
            attributes.push(attribute);
        }
    }
    return attributes;
}

// Function to load GeoJSON data
function getData() {
    fetch("data/police_per_100000pop.geojson")
        .then(function(response) {
            return response.json();
        })
        .then(function(json) {
            calculateMinValue(json);
            createPropSymbols(json);
        });
}

// Call createMap function when the DOM content is loaded
document.addEventListener('DOMContentLoaded', createMap);