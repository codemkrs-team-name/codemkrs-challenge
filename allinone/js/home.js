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
function runCurrentFilter(allEvents, eventTemplate) {
	var  $events 	= $('#events-list')
		,$search 	= $('#search')
		,selVal		= function(name) { return $('#'+name+'-filter').val() }
		,events = _.chain(allEvents)
				.filter(filterRanking(selVal('ranking')))
				.filter(filterDay(selVal('day')))
				.filter(filterDistance(selVal('distance')))
				.filter(filterSearch($search.is(':visible') && $search.val()))
				.sortBy('time')
				.value()
		;
	$events.html(_.reduce(_.map(events,eventTemplate), add2, '') );
	$events.find('a.favorite').favoriteMarker({
		events: allEvents
	});
	$events.find('.event-body')
		.filter(hasTextContents)
		.seeMoreCollapsible()
	$(':mobile-button').trigger('create')
}

function filterSearch(keywords) {
	if (!keywords || !keywords.trim())
		return _.identity;
	keywords = _.string.slugify(keywords).split('-');
	return function(ev) {
		var nameKeywords = _.string.slugify(ev.eventName).split('-');
		var venueKeywords = _.string.slugify(ev.venue).split('-');
		var eventKeywords = _.union(nameKeywords, venueKeywords).join('-');
		var matches = _.filter(keywords, function(keyword) {
			return _.string.include(eventKeywords, keyword);
		});
		return matches.length == keywords.length;
	}
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
}
function filterDay(daytime) { 
	var date = new Date(parseInt(daytime, 10)).toFormat('YYYY-MM-DD');
	return function(ev) { 
		return date == ev._date;
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
			ev.time = ev.time*1000;			//unix seconds to milliseconds
			ev._date = new Date(ev.time).toFormat('YYYY-MM-DD');			//unix seconds to milliseconds
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

////////////////////////////////////////////////////
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
			return +localStorage[key] == true;	//GM - oh yeah, totally necessary
		if(isFavorite == true)
 			localStorage[key] = '1';
 		else
 			localStorage.removeItem(key);
		this._tagElement(isFavorite);
	},
	_tagElement: function(isFavorite) {
 		this.element.toggleClass('selected', isFavorite);		
	}
});

$.widget('codemkrs.seeMoreCollapsible',{
	_create: function() {
		this.element.addClass('collapsed');
		this.$collapser = $('<div class="ico collapser ico-double-angle-up">').html('U')
			.insertAfter(this.element);
		this.$collapser.toggle(this.showMore(true), this.showMore(false));
	}
	,showMore: function(swtch) { return _.bind(function(){
		this.element[swtch?'slideDown': 'slideUp']();
	}, this) }

});
///////////////////////////////////////////////////
function extendHandlebars() {
	Handlebars.registerHelper('html', truthyOr('', function(html) {
	  	return new Handlebars.SafeString(html);
	}));
	Handlebars.registerHelper('time', truthyOr('', function(timestamp) {
		if (!timestamp) return '';
		var date = new Date(timestamp);
		var dateFormat = 'H:MI PP';
		if (date.getDay() != ((new Date()).getDay())) dateFormat = 'DDD ' + dateFormat;
	  	return date.toFormat(dateFormat);
	}));
	Handlebars.registerHelper('eventImage', function() {
		if(!this.image) return '';
	  	return new Handlebars.SafeString('<img src="'+this.image.src+'" alt="'+this.eventName+'" class="event-image"/>');
	});
	Handlebars.registerHelper('eventLink', truthyOr('', function(link) {
	  	return new Handlebars.SafeString('<a href="'+link.link+'"><span class="icon '+link.type+'"></span><span class="link-name">'+(link.text||link.type)+'</span></a>');
	}));
	Handlebars.registerHelper('favoriteEvent', function() {
	  	return new Handlebars.SafeString('<a class="favorite" href="javascript:void(0)" data-eventidentifier="'+this._id+'">F</a>');
	});
}
//////////////////////////////////////////////////
function hasTextContents() {
	return !!this.innerText.trim();
}
function add2(x, y) { return x+y }
function truthyOr(def, fn) { return function(x){return x ? fn.apply(this, arguments) : def }}

})();