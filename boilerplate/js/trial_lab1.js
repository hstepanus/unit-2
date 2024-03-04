// Add a title above the map container
var mapTitle = document.createElement('h1');
mapTitle.innerHTML = 'Police Forces Per 100000 Population-Eastern side of the United States';
document.body.insertBefore(mapTitle, document.getElementById('map'));

// Add additional text to help tell the story
var mapStory = document.createElement('div');
mapStory.innerHTML = '<p>This map illustrates police forces per 100000 population in every state. The sizes of the dotted cities represent the police forces for each state in the eastern side of the United States. With this data, we can see that many states lack police compared to others. Washington DC is the only one that has sufficient police forces relative to its population.</p>';
document.body.appendChild(mapStory);

// Add a section below the map to cite data sources
var dataSources = document.createElement('div');
dataSources.innerHTML = '<p>Data Sources: Police forces data from the US Bureau Database.Compass by Stefano Cudini </p>';
document.body.appendChild(dataSources);

// Declare map variable globally so all functions have access
var map;
var minValue;
var dataStats = {}; // Add dataStats variable

// Function to create the map
function createMap() {
    // Create the map
    map = L.map('map', {
        center: [10, -20],
        zoom: 2
    });

    // Add OSM base tilelayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

    var layer = L.circleMarker(latlng, options);

    // Bind popup to the layer
    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>";
    var year = attribute.split("_")[1];
    popupContent += "<p><b>Police per 100000 people in " + year + ":</b> " + feature.properties[attribute] + " police</p>";
    layer.bindPopup(popupContent);

    return layer;
}

// Function to calculate the minimum value
function calculateMinValue(data) {
    var allValues = [];
    for (var city of data.features) {
        for (var year = 2011; year <= 2017; year += 1) {
            var value = city.properties["Pop_" + year];
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
    calculateMinValue(data);
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
    document.querySelector("#map").insertAdjacentHTML('afterend', slider);

    document.querySelector(".range-slider").max = attributes.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    document.querySelector('#map').insertAdjacentHTML('afterend', '<button class="step" id="reverse"></button>');
    document.querySelector('#map').insertAdjacentHTML('afterend', '<button class="step" id="forward"></button>');

    document.querySelector('#reverse').insertAdjacentHTML('beforeend', "<img src='img/reverse.jpg' width='0.5px'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend', "<img src='img/forward.jpg' width='0.5px'>");

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

            // Create popup content
            var popupContent = "<p><b>City:</b> " + props.City + "</p>";
            var year = attribute.split("_")[1];
            popupContent += "<p><b>Police per 100000 people in " + year + ":</b> " + props[attribute] + " police</p>";

            // Bind popup to the layer
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

// Function to create the legend
function createLegend(attributes) {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function() {
            // Create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            // Get the minimum, mean, and maximum values
            var minValue = dataStats.min;
            var meanValue = dataStats.mean;
            var maxValue = dataStats.max;

            // Create the HTML structure for the legend
            var legendHTML = '<p class="temporalLegend">Police force</p>';
            legendHTML += '<svg id="attribute-legend" width="130px" height="130px">';
            legendHTML += '<circle class="legend-circle" id="min" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="65" cy="100" r="5"/>';
            legendHTML += '<text id="min-text" x="70" y="97">' + minValue + '</text>';
            legendHTML += '<circle class="legend-circle" id="mean" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="65" cy="65" r="10"/>';
            legendHTML += '<text id="mean-text" x="70" y="67">' + meanValue + '</text>';
            legendHTML += '<circle class="legend-circle" id="max" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="65" cy="30" r="15"/>';
            legendHTML += '<text id="max-text" x="70" y="32">' + maxValue + '</text>';
            legendHTML += '</svg>';

            // Insert the legend HTML into the control container
            container.innerHTML = legendHTML;

            return container;
        }
    });

    map.addControl(new LegendControl());
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
            calcStats(json);  
            createLegend(processData(json)); // Call createLegend function here with updated attributes and dataStats
        });
}

// Line 1: variables we want to access from multiple functions  
var map;  
var dataStats = {};  

function calcStats(data) {
    // Create empty array to store all data values
    var allValues = [];
    // Loop through each city
    for (var city of data.features) {
        // Loop through each year
        for (var year = 2011; year <= 2017; year += 1) {
            // Get population for current year
            var value = city.properties["Pop_" + String(year)];
            // Ensure the value is a number and not NaN
            if (!isNaN(value) && value !== null && value !== undefined) {
                // Add value to array
                allValues.push(value);
            }
        }
    }
    // Get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    // Calculate meanValue
    var sum = allValues.reduce(function(a, b) { return a + b; }, 0); // Ensure initial value of sum is 0
    dataStats.mean = "393.5"
}
/*
 */
(function (factory) {
    if(typeof define === 'function' && define.amd) {
    //AMD
        define(['leaflet'], factory);
    } else if(typeof module !== 'undefined') {
    // Node/CommonJS
        module.exports = factory(require('leaflet'));
    } else {
    // Browser globals
        if(typeof window.L === 'undefined')
            throw 'Leaflet must be loaded first';
        factory(window.L);
    }
})(function (L) {

L.Control.Compass = L.Control.extend({

	includes: L.version[0] =='1' ? L.Evented.prototype : L.Mixin.Events,
	
	//
	options: {
		position: 'topright',	//position of control inside map
		autoActive: false,		//activate control at startup
		showDigit: false,		//show angle value bottom compass
		textErr: '',			//error message on alert notification
		callErr: null,			//function that run on compass error activating
		angleOffset: 2			//min angle deviation before rotate
		/* big angleOffset is need for device have noise in orientation sensor */
	},

	initialize: function(options) {
		if(options && options.style)
			options.style = L.Util.extend({}, this.options.style, options.style);
		L.Util.setOptions(this, options);
		this._errorFunc = this.options.callErr || this.showAlert;
		this._isActive = false;//global state of compass
		this._currentAngle = null;	//store last angle
	},

	onAdd: function (map) {

		var self = this;

		this._map = map;

		var container = L.DomUtil.create('div', 'leaflet-compass');

		this._button = L.DomUtil.create('span', 'compass-button', container);
		this._button.href = '#';

		this._icon = L.DomUtil.create('div', 'compass-icon', this._button);
		this._digit = L.DomUtil.create('span', 'compass-digit', this._button);

		this._alert = L.DomUtil.create('div', 'compass-alert', container);
		this._alert.style.display = 'none';

		L.DomEvent
			.on(this._button, 'click', L.DomEvent.stop, this)
			.on(this._button, 'click', this._switchCompass, this);

		L.DomEvent.on(window, 'compassneedscalibration', function(e) {
			self.showAlert('Your compass needs calibrating! Wave your device in a figure-eight motion');
		}, this);

		if(this.options.autoActive)
			this.activate(true);

		return container;
	},

	onRemove: function(map) {

		this.deactivate();

		L.DomEvent
			.off(this._button, 'click', L.DomEvent.stop, this)
			.off(this._button, 'click', this._switchCompass, this);
	},

	_switchCompass: function() {
		if(this._isActive)
			this.deactivate();
		else
			this.activate();
	},

  _rotateHandler: function(e) {

    var self = this, angle;

    if(!this._isActive) return false;

    if(e.webkitCompassHeading) {  //iphone
      angle = 360 - e.webkitCompassHeading;
      this._compassIphone = true;
    }
    else if(e.alpha)  {   //android
      angle = e.alpha-180;
      this._compassAndroid = true;
    }
    else {
      this._errorCompass({message: 'Orientation angle not found'});
    }

    angle = Math.round(angle);

    if(angle % this.options.angleOffset === 0)
      self.setAngle(angle);
  },

  _errorCompass: function(e) {
    this.deactivate();
    this._errorFunc.call(this, this.options.textErr || e.message);
  },

  _rotateElement: function(e) {
    var ang = this._currentAngle;
    //DEBUG e = this._map.getContainer();
    //
    e.style.webkitTransform = "rotate("+ ang +"deg)";
    e.style.MozTransform = "rotate("+ ang +"deg)";
    e.style.transform = "rotate("+ ang +"deg)";
  },

  setAngle: function(angle) {

    if(this.options.showDigit && !isNaN(parseFloat(angle)) && isFinite(angle)) {

      this._digit.innerHTML = (-angle)+'°';
    }

    this._currentAngle = angle;
    this._rotateElement( this._icon );

    this.fire('compass:rotated', {angle: angle});
  },

	getAngle: function() {	//get last angle
		return this._currentAngle;
	},

	_activate: function () {
		this._isActive = true;

		L.DomEvent.on(window, 'deviceorientation', this._rotateHandler, this);

		L.DomUtil.addClass(this._button, 'active');
	},

	activate: function (isAutoActivation) {
		if (typeof(DeviceOrientationEvent) !== 'undefined' &&
		    typeof(DeviceOrientationEvent.requestPermission) === 'function') {
			/* iPhoneOS, must ask interactively */
			var that = this;
			DeviceOrientationEvent.requestPermission().then(function (permission) {
				if (permission === 'granted')
					that._activate();
				else if (isAutoActivation !== true)
					alert('Cannot activate compass: permission ' + permission);
			    }, function (reason) {
				if (isAutoActivation !== true)
					alert('Error activating compass: ' + reason);
			    });
		} else {
			this._activate();
    }
	},

	deactivate: function() {

		this.setAngle(0);

		this._isActive = false;

		L.DomEvent.off(window, 'deviceorientation', this._rotateHandler, this);

		L.DomUtil.removeClass(this._button, 'active');

		this.fire('compass:disabled');
	},

	showAlert: function(text) {
		this._alert.style.display = 'block';
		this._alert.innerHTML = text;
		var that = this;
		clearTimeout(this.timerAlert);
		this.timerAlert = setTimeout(function() {
			that._alert.style.display = 'none';
		}, 5000);
	}
});

L.control.compass = function (options) {
	return new L.Control.Compass(options);
};

return L.Control.Compass;

});
    
// Call createMap function when the DOM content is loaded
document.addEventListener('DOMContentLoaded', createMap);
