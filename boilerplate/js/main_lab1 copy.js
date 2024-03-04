
// Add a title above the map container
var mapTitle = document.createElement('h1');
mapTitle.innerHTML = 'Police Forces Per 100000 Population-Eastern side of the United States';
document.body.insertBefore(mapTitle, document.getElementById('map'));


// Add additional text to help tell the story
var mapStory = document.createElement('div');
mapStory.innerHTML = '<p>This map illustrates police forces per 100000 population in every states, the cities dotted sizes are reprensented for each states in the eastern side of the United States.With this data, we can see many states are lack in police compared to each others.Washington DC is the only one that has sufficient police forces to the population.</p>';
document.body.appendChild(mapStory);

// Add a section below the map to cite data sources
var dataSources = document.createElement('div');
dataSources.innerHTML = '<p>Data Sources: Police forces data from the US bureau Database.</p>';
document.body.appendChild(dataSources);

// Declare map variable globally so all functions have access
var map;
var minValue;
var dataStats = {}; // Add dataStats variable

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
}

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
}

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

    document.querySelector('#reverse').insertAdjacentHTML('beforeend', "<img src='img/reverse.jpg' width='20px'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend', "<img src='img/forward.jpg' width='20px'>");

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
            createLegend(processData(json)); // Call createLegend function here with updated attributes
        });
}
// Function to create the legend
function createLegend(attributes) {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // Create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            // Initialize the legend HTML content
            container.innerHTML = '<p class="temporalLegend">Police per 100000 population in <span class="year">2011</span></p>';

            // Step 1: Start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="130px" height="130px">';

            // Step 2: Loop through each circle name (min, max, mean) to create circles and text elements
            var circles = ["max", "mean", "min"];
            for (var i = 0; i < circles.length; i++) {
                // Step 3: Calculate the radius and position of each circle based on the dataset min, max, and mean values
                var radius = calcPropRadius(dataStats[circles[i]]);
                var cy = 130 - radius;

                // Step 4: Assign each circle element a center and radius based on the calculated values
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '" cy="' + cy + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="65"/>';

                // Step 5: Add text labels for each circle
                var textY = i * 20 + 20;
                svg += '<text id="' + circles[i] + '-text" x="65" y="' + textY + '">' + Math.round(dataStats[circles[i]] * 100) / 100 + " polices" + '</text>';
            }

            // Close svg string
            svg += "</svg>";

            // Add attribute legend svg to container
            container.innerHTML += svg;

            return container;
        }
    });

    // Add legend control to map
    map.addControl(new LegendControl());
}
//rotating map compass



// Call createMap function when the DOM content is loaded
document.addEventListener('DOMContentLoaded', createMap);