var map = {
	_handle: null,
	_window: null,
	_markers: [],
	addMarker: function(content, loc) {
		if (!loc) return;
		loc = new google.maps.LatLng(loc.lat, loc.lon);
		var marker = new google.maps.Marker({
	        position: loc,
	        map: this._handle,
	        title: name
	    });
		var that = this;
		google.maps.event.addListener(marker, 'click', function(e) {
			if (that._window) {
				that._window.setMap(null);
				that._window.close();
			}
			that._window = new google.maps.InfoWindow({
				maxWidth: $(window).width() - 75,
				map: that._handle,
				position: marker.getPosition(),
				content: content
			});
		});
		this._markers.push(marker);
	},
	center: function(loc) {
		var coords = new google.maps.LatLng(loc.lat, loc.lon);
		if (!this._handle) {
		   	this._handle = new google.maps.Map(document.getElementById("map-view"),
			    {
			      center: coords,
			      zoom: 14,
			      mapTypeId: google.maps.MapTypeId.ROADMAP
			    }
		    );
		} else {
			this._markers.forEach(function(marker) {
				marker.setMap(null);
			});
			this._markers = [];
			this._handle.setCenter(coords);
		}
	}
};

