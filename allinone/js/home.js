<<<<<<< HEAD
<<<<<<< HEAD
(function(){

var currentLocation = null;

startWatchingLocation(function(loc){ return currentLocation = loc });
extendHandlebars();
$.when(gettingEvents(), pageInitializing()).done(function(allEvents){

	initToggles();
	var  eventTemplate 	= Handlebars.compile($("#event-template").html())
		,$filters   	= initFilters()
		,updateFilters = function() { runCurrentFilter(allEvents, eventTemplate) };
		;
		
	updateFilters();
	$filters.on('change', updateFilters);
	$("#search").keydown(_.debounce(updateFilters, 500));
	$("#search").blur(updateFilters);
});

//////////////////////////////////////////////////////
// Filters
/////////////////////////////////////////////////////
function filterSearch(keywords) {
	return function(ev) {
		if (_.isString(keywords) && _.isEmpty(keywords.trim())) {
			return true;
		}
		keywords = _.string.slugify(keywords).split('-');
		var nameKeywords = _.string.slugify(ev.eventName).split('-');
		var venueKeywords = _.string.slugify(ev.venue).split('-');
		var eventKeywords = _.union(nameKeywords, venueKeywords).join('-');
		var matches = _.filter(keywords, function(keyword) {
			return _.string.include(eventKeywords, keyword);
		});
		if (matches.length == keywords.length) {
			console.log(keywords + " matches " + eventKeywords);
		}
		return matches.length == keywords.length;
	}
}

function runCurrentFilter(allEvents, eventTemplate) {
	var  $events 	= $('#events-list')
		,selVal		= function(name) { return $('#'+name+'-filter').val() }
		,events = _.chain(allEvents)
				.filter(filterRanking(selVal('ranking')))
				.filter(filterDay(selVal('day')))
				.filter(filterDistance(selVal('distance')))
				.filter(filterSearch($('#search').val()))
				.sortBy('time')
				.value()
		;
	$events
		.html(_.reduce(_.map(events,eventTemplate), add2, '') )
		.trigger('create');
}

function initFilters() {
	var  $day = $('#day-filter')
		,days = _.map(_.range(3), function(d) { return new Date().add({days: d}) })
		;
	$day.html(
		_.map(days, function(d) {
			return '<option value='+d.getTime()+'>'+d.toFormat('DDD MMM D')+'</option>'
		}).join('')
	).find('option:first').prop('selected', true).trigger('change');
	return $('#filters-area select');
}

function filterRanking(ranking) { 
	ranking = +ranking;
	return function(ev) {
		return !ranking || ev.ranking >= ranking;
	}
}""
function filterDay(daytime) { 
	var day = new Date(parseInt(daytime, 10)).getDay();
	return function(ev) { 
		return day == new Date(ev.time).getDay()
	}
}
function filterDistance(distance) { return function(ev) {
	if(!currentLocation || !ev.location)
		return true;
	return distance <= haversineDistance(currentLocation, ev.location);
}}
//////////////////////////////////////////////////////
// Toggle Buttons
/////////////////////////////////////////////////////
$.widget('codemkrs.toggleAreaTab', {
    options: {
         target: null
    }
    ,_create: function() {
        this.element.toggle(this.onOff(true), this.onOff(false));
    }
    ,onOff: function(swtch) {return _.bind(function(){
        this.element.toggleClass('toggled', swtch);
        $(this.options.target)[swtch?'slideDown':'slideUp']();
        if(swtch) this._trigger('collapse');
    }, this) }
});

function initToggles() {
    $('[data-toggletarget]').each(function() {
        $(this).toggleAreaTab({
             target: $(this).data('toggletarget')
        	,collapse: function() {
        		$(':codemkrs-toggleAreaTab').not(this).each(function(){
        			$(this).removeClass('toggled');
        			$($(this).toggleAreaTab('option', 'target')).slideUp();
        		});
        	}
        });
    });	
}
///////////////////////////////////////////////////

function gettingEvents() {
	return $.getJSON('events.json').pipe(stubAmmendEvents);

	//  $.Deferred(function(d){
	// 	d.resolve( _.map(_.range(35), function(i) {
	// 		return {
	// 			 eventName: "Here is some event "+i
	// 			,venue: "Venue "+_.random(10)
	// 			,location: null
	// 			,time: new Date(1358014168714).add({hours: _.random(72)}).getTime()
	// 			,image: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRSHHZb6Dt0Sssbz0nzT-MUvgwmtf11T2DzVkDC1ONsO2z62num'
	// 			,price: null
	// 			,description: "<p>Now that there is the Tec-9, a crappy spray gun from South Miami. This gun is advertised as the most popular gun in American crime. Do you believe that shit? It actually says that in the little book that comes with it: the most popular gun in American crime. Like they're actually proud of that shit.  </p>"
	// 			,source: '<a href="http://cheezburger.com/6924526080">This guy\'s blog</a>'
	// 			,ranking: _.random(1)||null
	// 			,links: [
	// 				{
	// 				 	 type: ['music', 'gcal', 'info'][_.random(2)]
	// 				 	,text: "Text "+i
	// 					,link: 'https://play.google.com/music/listen?u=1'
	// 				}
	// 			]
	// 		};
	// 	}) );
	// });
}
function stubAmmendEvents(allEvents){
	return _.map(allEvents, function(ev) {
		ev.time = new Date().add({hours: _.random(72)}).getTime();
		return ev;
	})
}
///////////////////////////////////////////////////

function pageInitializing() {
	return $.Deferred(function(d){
		$(document).on('pageinit', function() { d.resolve() });
	});
}

//////////////////////////////////////////////////

function startWatchingLocation(callback) {
	if(!navigator || !navigator.geolocation) return;
	navigator.geolocation.watchPosition(update);  // GM - No work in browser sad face
	function update(position){
		callback({lat: position.coords.latitude, lon: position.coords.longitude});
	}
}
function haversineDistance(a, b) {
	var  dLat 	= (b.lat-a.lat).toRad()
		,dLon 	= (b.lon-a.lon).toRad()
		,alat 	= a.lat.toRad()
		,blat 	= b.lat.toRad()
		,a 		= Math.sin(dLat/2) * Math.sin(dLat/2) +
	    		  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(alat) * Math.cos(blat) 
		,c 		= 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) 
		;
		return c * 6371; // km
}

///////////////////////////////////////////////////
function extendHandlebars() {
	Handlebars.registerHelper('html', truthyOr('', function(html) {
	  return new Handlebars.SafeString(html);
	}));
	Handlebars.registerHelper('time', truthyOr('', function(timestamp) {
	  return !timestamp ? '' : new Date(timestamp).toFormat('H:MM PP');
	}));
	Handlebars.registerHelper('eventImage', function() {
		if(!this.image) return '';
	  	return new Handlebars.SafeString('<img src="'+this.image.src+'" alt="'+this.eventName+'" class="event-image"/>');
	});
	Handlebars.registerHelper('eventLink', truthyOr('', function(link) {
	  return new Handlebars.SafeString('<a href="'+link.link+'"><span class="icon '+link.type+'"></span><span class="link-name">'+link.text+'</span></a>');
	}));

}

function add2(x, y) { return x+y }
function truthyOr(def, fn) { return function(x){return x ? fn.apply(this, arguments) : def }}

=======
=======
>>>>>>> fixing the shit i broke
(function(){

var currentLocation = null;

startWatchingLocation(function(loc){ return currentLocation = loc });
extendHandlebars();
$.when(gettingEvents(), pageInitializing()).done(function(allEvents){

<<<<<<< HEAD
	var  eventTemplate 	= Handlebars.compile($("#event-template").html())
		,$filters   	= initFilters() 
		;
	initToggles();
	runCurrentFilter(allEvents, eventTemplate);
	$filters.on('change', function() { runCurrentFilter(allEvents, eventTemplate) });

});

console && console.log("Gigs Guru: Live and Tight");

//////////////////////////////////////////////////////
// Filters
/////////////////////////////////////////////////////
=======
	initToggles();
	var  eventTemplate 	= Handlebars.compile($("#event-template").html())
		,$filters   	= initFilters()
		,updateFilters = function() { runCurrentFilter(allEvents, eventTemplate) };
		;
		
	updateFilters();
	$filters.on('change', updateFilters);
	$("#search").keydown(_.debounce(updateFilters, 500));
	$("#search").blur(updateFilters);
});

//////////////////////////////////////////////////////
// Filters
/////////////////////////////////////////////////////
function filterSearch(keywords) {
	return function(ev) {
		if (_.isString(keywords) && _.isEmpty(keywords.trim())) {
			return true;
		}
		keywords = _.string.slugify(keywords).split('-');
		var nameKeywords = _.string.slugify(ev.eventName).split('-');
		var venueKeywords = _.string.slugify(ev.venue).split('-');
		var eventKeywords = _.union(nameKeywords, venueKeywords).join('-');
		var matches = _.filter(keywords, function(keyword) {
			return _.string.include(eventKeywords, keyword);
		});
		if (matches.length == keywords.length) {
			console.log(keywords + " matches " + eventKeywords);
		}
		return matches.length == keywords.length;
	}
}

>>>>>>> fixing the shit i broke
function runCurrentFilter(allEvents, eventTemplate) {
	var  $events 	= $('#events-list')
		,selVal		= function(name) { return $('#'+name+'-filter').val() }
		,events = _.chain(allEvents)
				.filter(filterRanking(selVal('ranking')))
				.filter(filterDay(selVal('day')))
				.filter(filterDistance(selVal('distance')))
<<<<<<< HEAD
=======
				.filter(filterSearch($('#search').val()))
>>>>>>> fixing the shit i broke
				.sortBy('time')
				.value()
		;
	$events.html(_.reduce(_.map(events,eventTemplate), add2, '') );
	$events.find('a.favorite').favoriteMarker({
		events: allEvents
	});
	$events.trigger('create');

}

function initFilters() {
	var  $day = $('#day-filter')
		,days = _.map(_.range(3), function(d) { return new Date().add({days: d}) })
		;
	$day.html(
		_.map(days, function(d) {
			return '<option value='+d.getTime()+'>'+d.toFormat('DDD MMM D')+'</option>'
		}).join('')
	).find('option:first').prop('selected', true).trigger('change');
	return $('#filters-area select');
}

$.widget('codemkrs.favoriteMarker', {
	options: {
		events: []
	}
	,_create: function() {
		this._eventId = this.element.data('eventidentifier');
		this._tagElement(this.favorite());
		this.element.click(_.bind(function(){
			this.favorite(!this.favorite());
		}, this));
	}
	,favorite: function(isFavorite) {
		var  x
			,key = 'favorites:'+this._eventId
			;
		if(_.isUndefined(isFavorite))
			return (x = localStorage[key]) ? JSON.parse(x) : false;
		localStorage[key] = JSON.stringify(isFavorite == true);
		this._tagElement(isFavorite);
	},
	_tagElement: function(isFavorite) {
 		this.element.toggleClass('selected', isFavorite);		
	}
});

function filterRanking(ranking) { 
	ranking = +ranking;
	return function(ev) {
		return !ranking || ev.ranking >= ranking;
	}
}
function filterDay(daytime) { 
	var day = new Date(parseInt(daytime, 10)).getDay();
	return function(ev) { 
		return day == new Date(ev.time).getDay()
	}
}
function filterDistance(distance) { return function(ev) {
	if(!currentLocation || !ev.location)
		return true;
	return distance >= haversineDistance(currentLocation, ev.location);
}}
//////////////////////////////////////////////////////
// Toggle Buttons
/////////////////////////////////////////////////////
$.widget('codemkrs.toggleAreaTab', {
    options: {
         target: null
    }
    ,_create: function() {
        this.element.toggle(this.onOff(true), this.onOff(false));
    }
    ,onOff: function(swtch) {return _.bind(function(){
        this.element.toggleClass('toggled', swtch);
        $(this.options.target)[swtch?'slideDown':'slideUp']();
        if(swtch) this._trigger('collapse');
    }, this) }
});

function initToggles() {
    $('[data-toggletarget]').each(function() {
        $(this).toggleAreaTab({
             target: $(this).data('toggletarget')
        	,collapse: function() {
        		$(':codemkrs-toggleAreaTab').not(this).each(function(){
        			$(this).removeClass('toggled');
        			$($(this).toggleAreaTab('option', 'target')).slideUp();
        		});
        	}
        });
    });	
}
///////////////////////////////////////////////////

function gettingEvents() {
	return $.getJSON('events.json').pipe(function massageData(allEvents){
		return _.map(allEvents, function(ev) {
			ev.ranking = _.random(1);
			ev.time = ev.time*1000;			//unix seconds to milliseconds
			ev._id = ev.time +'-'+ev.eventName;
			return ev;
		})
	});
}
///////////////////////////////////////////////////

function pageInitializing() {
	return $.Deferred(function(d){
		$(document).on('pageinit', function() { d.resolve() });
	});
}

//////////////////////////////////////////////////

function startWatchingLocation(callback) {
	if(!navigator || !navigator.geolocation) return;
	navigator.geolocation.watchPosition(update);  // GM - No work in browser sad face
	function update(position){
		callback({lat: position.coords.latitude, lon: position.coords.longitude});
	}
}

function haversineDistance(a,b) {
	var  R = 3963.2 // Radius of the earth in mi
		,dLat = deg2rad(b.lat-a.lat)
		,dLon = deg2rad(b.lon-a.lon) 
		,f = 	Math.sin(dLat/2) * Math.sin(dLat/2) +
    			Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(b.lat)) * 
    			Math.sin(dLon/2) * Math.sin(dLon/2)
  		,c = 2 * Math.atan2(Math.sqrt(f), Math.sqrt(1-f)); 
  return d = R * c; // Distance in mi
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}
///////////////////////////////////////////////////
function extendHandlebars() {
	Handlebars.registerHelper('html', truthyOr('', function(html) {
	  	return new Handlebars.SafeString(html);
	}));
	Handlebars.registerHelper('time', truthyOr('', function(timestamp) {
	  	return !timestamp ? '' : new Date(timestamp).toFormat('H:MM PP');
	}));
	Handlebars.registerHelper('eventImage', function() {
		if(!this.image) return '';
	  	return new Handlebars.SafeString('<img src="'+this.image.src+'" alt="'+this.eventName+'" class="event-image"/>');
	});
	Handlebars.registerHelper('eventLink', truthyOr('', function(link) {
	  	return new Handlebars.SafeString('<a href="'+link.link+'"><span class="icon '+link.type+'"></span><span class="link-name">'+link.text+'</span></a>');
	}));
	Handlebars.registerHelper('favoriteEvent', function() {
	  	return new Handlebars.SafeString('<a class="favorite" href="javascript:void(0)" data-eventidentifier="'+this._id+'">F</a>');
	});
}

function add2(x, y) { return x+y }
function truthyOr(def, fn) { return function(x){return x ? fn.apply(this, arguments) : def }}

<<<<<<< HEAD
>>>>>>> 093716fbc6413aa69bd97b1fe25ab845565a6803
=======
>>>>>>> fixing the shit i broke
})();