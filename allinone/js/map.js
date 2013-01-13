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
  setLocation: function(loc) {
    if(loc) {
      if(!this._locmarker) {
        this._locmarker =  new google.maps.Marker({
          clickable: false,
          icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
            new google.maps.Size(22,22),
            new google.maps.Point(0,18),
            new google.maps.Point(11,11)),
            shadow: null,
          zIndex: 999,
          map: this._handle
        });
      }
      var coords = new google.maps.LatLng(loc.lat, loc.lon);
      this._locmarker.setPosition(coords);
    }
  },
	center: function(loc) {
		var coords = new google.maps.LatLng(loc.lat, loc.lon);
		if (!this._handle) {
		   	this._handle = new google.maps.Map(document.getElementById("map-view"),
			    {
			      center: coords,
			      zoom: 14,
            mapTypeControl: false,
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

