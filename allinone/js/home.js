(function(){

document.__consolePolyfill = document.__consolePolyfill || {};
console.time = console.time || function(name) {
	document.__consolePolyfill[name] = new Date().getTime()
}
console.timeEnd = console.timeEnd || function(name) {
	var t = (new Date().getTime() - document.__consolePolyfill[name]) / 1000
	console.log('timed', name, t);
	return t;
}

console.log('starting load');
console.time('load');
var pageHref = location.href.replace(/#.*/, '');

var currentLocation = {lat:29.948697,lon:-90.104522}; //New Orleans
var mode = 'default'; // can be 'default', 'search', 'map', or 'favorites'
var updateFilters;

startWatchingLocation(function(loc){ return currentLocation = loc });
extendHandlebars();
$.when(gettingEvents(), pageInitializing()).done(function(allEvents){

	initToggles();
	var  $filters   	= initFilters()
		,eventTemplate 	= Handlebars.compile($("#event-template").html())
		,$events 	= $('#events-list')
		;
	updateFilters = function() {
		return runCurrentFilter(allEvents);
	};
		
	$events.html(_.reduce(_.map(allEvents,eventTemplate), add2, '') );
	$events.find('a.favorite').favoriteMarker({
		events: allEvents
	});
	_.defer(function(){		
		//GM - OK, so in order for this widget to initialize correctly
		//it HAS to be visible at the time of initialization to calculate content vs container height
		//SOOOO wait for the current event loop to finish (thanks jqm)
		//then do all this. Because of reasons
		// $events.find('.event-body')
		// 	.filter(hasTextContents)
		// 	.seeMoreCollapsible();
		updateFilters();
		console.timeEnd('load');
		console.log('ended load');
	});
	$filters.on('change', updateFilters);
	$("#search").keydown(_.debounce(updateFilters, 250));
	_.delay(scrollToHash, 2000);
	setupInfoPopup();
	$('#title').click(function() {
		//TODO - GM - reset to default state somehow
	});
});

//////////////////////////////////////////////////////
// Filters
/////////////////////////////////////////////////////
function runCurrentFilter(allEvents) {
	var  $noResults = $('#no-results')
		,$events = $('#events-list')
		,events = filterEvents(allEvents)
		;
	if (mode == 'map') return events;
	
	$noResults.toggle(_.any(events.length));
	$events.toggle(!_.any(events.length));
	$events.children('.event').hide();
	_.each(events, function(ev) { $('#'+ev._id ).show() }); //shockingly, this actually preforms significantly better than a comma-separated id list
	return events;
}

function filterEvents(allEvents) {
	var nowSeconds = new Date().getTime() - 1000*60*60;
	var results = _.chain(allEvents).filter(function(ev) {
		return ev.time >= nowSeconds;
	});
	if (mode =='favorite') {
		results = results.filter(function(ev) {
			return getLocalStorage('favorites:'+ev._id);
		});
	} else if (mode == 'search') {
		results = results.filter(filterSearch($('#search').val()));
	} else if (mode == 'default') {
		var selVal = function(name) { return $('#'+name+'-filter').val() };
		results = results
			.filter(filterRanking(selVal('ranking')))
			.filter(filterDay(selVal('day')))
			.filter(filterDistance(selVal('distance')));
	} else if (mode == 'map') {
		results = results.filter(filterDay(new String(new Date().getTime())));
	}
	return results.sortBy('time').value();
}

function filterSearch(keywords) {
	if (!keywords || !keywords.trim()) return fn(true);
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

function resize() {
	$("#map-view").height($(window).height() - $("#map-view").offset().top);
}

$(window).resize(resize);

$.widget('codemkrs.toggleAreaTab', {
    options: {
         target: null
    }
    ,_create: function() {
        this.element.toggle(this.onOff(true), this.onOff(false));
    }
    ,onOff: function(swtch) {return _.bind(function(){
    	var selectedMode = this.element.attr('mode')
    		,$mapview = $("#map-view")
			,$listview = $("#list-view")
		;
        this.element.toggleClass('toggled', swtch);
        $(this.options.target)[swtch?'slideDown':'slideUp']();
        if(swtch) this._trigger('collapse');
        mode = swtch ? selectedMode : 'default';
    	if (selectedMode == 'map') {
    		$mapview[swtch?'show':'hide']();
    		$listview[swtch?'hide':'show']();
			var events = updateFilters();
    		if (swtch) {
    			map.center(currentLocation);
				_(events).each(function(ev) {
					map.addMarker("<b>" + ev.eventName + "</b><br />" + ev.venue + ", " + new Date(ev.time).toFormat('H:MI PP'), ev.location);
				});
    			resize();
    		}
    	} else {
			updateFilters();
    		$mapview.hide();
    		$listview.show();
    	}
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
	var  gettingFromLocal
		,eventsUrl = 'events.json?'+$.param({_:new Date().getTime()})
		;
	if(!featureEnabled('nocache') )
		gettingFromLocal = gettingFromLocalStorage()

	var utcMillisecondsOffset = 1000*60*60*(parseInt(new Date().getUTCOffset(), 10)/100); //TODO - GM - this drops the minutes component
	// (ms/sec)*(sec/min)*(min/hr)*(hr offset)

	return gettingFromLocal || $.getJSON(eventsUrl).pipe(function massageData(allEvents){
		window.originalEvents = $.extend(true, [], allEvents);
		return _.map(allEvents, function(ev) {
			ev.time = ev.time*1000+utcMillisecondsOffset;					//unix seconds to milliseconds + timezone offset
			ev._date = new Date(ev.time).toFormat('YYYY-MM-DD');			
			ev._id = _.string.slugify(ev.time +'-'+ev.eventName);
			return ev;
		})
	}).done(function storeEvents(allEvents){
		setLocalStorage('lastEvents',{
			 lastRun: new Date().getTime()
			,events: allEvents
		});
	});

	function gettingFromLocalStorage() {
		var  store = getLocalStorage('lastEvents')
			,lastRun = store && store.lastRun && new Date(store.lastRun)
			;
		if(!store || !store.events || !lastRun)
			return null;
		if(lastRun >= new Date().add({hours: -6}))	//happened more recently than 6 hours ago
			return $.Deferred(resolveDeferred(store.events));
		return null;
	}
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
			return getLocalStorage(key) == true;	//GM - oh yeah, totally necessary
		if(isFavorite == true)
 			setLocalStorage(key, 1);
 		else
 			localStorage.removeItem(key);
		this._tagElement(isFavorite);
		if (!isFavorite && mode == 'favorite') {
			$("#" + this._eventId).slideUp(function() {
				updateFilters();
			});
		}
	},
	_tagElement: function(isFavorite) {
 		this.element.toggleClass('ico-star-2', isFavorite).toggleClass('ico-star', !isFavorite);	
	}
});

$.widget('codemkrs.seeMoreCollapsible',{
	_create: function() {
		this._showHideElement(false);
		this.element.addClass('collapsed');
		if(this.element.height() >= this.contentsHeight())
			return this.element.removeClass('collapsed');
		this.$collapser = $('<div class="ico collapser ico-double-angle-up">')
			.insertAfter(this.element);
		this.$collapser.toggle(this.showMore(true), this.showMore(false));
		this.showMore(false)();
	}
	,_showHideElement: function(swtch) {
		this.element.css('max-height', swtch? '':'4.8em');		
	}
	,contentsHeight: function() {
		var childrenHeights = this.element.children().map(function(){return $(this).height() });
		return _.reduce(childrenHeights, add2, 0);
	}
	,showMore: function(swtch) { return _.bind(function(){
		this._showHideElement(swtch);
		this.$collapser.toggleClass('ico-double-angle-down ico-double-angle-up');
	}, this) }

});
///////////////////////////////////////////////////
function scrollToHash() {
	if(!location.hash || !~location.hash.indexOf('#!') ) return;
	var $event = $('#'+location.hash.replace(/^#!/, '')).show()
	$('html, body').animate({
    	scrollTop: $event.offset().top-100
	});
}
///////////////////////////////////////////////////
function setupInfoPopup() {
	//TODO - GM - OMFG hacky but popups are all crazy but apparently the poup thing is awful
	
	$('#events-list').on('click', '.info-popup-trigger', function(){
		try {
			$(':mobile-popup').popup('destroy').remove();
		} catch(e) { }
		var  html = $(this).closest('.event')
					.find('.event-links-container')
					.html()
			,fix = {position: 'fixed',top: 0, bottom: 0, right: 0, left: 0 }
			,$background = $('<div>').css($.extend({
				 opacity: .3
				,'background-color': 'black'
				,'z-index': 1000
			}, fix)).appendTo('body')
			,$popup = $('<div class="ui-popup ui-overlay-shadow ui-corner-all">').html(html)
				.css({
					 position: 'fixed'
					,'z-index': 1000
					,'background-color': 'lavenderBlush'
					,top: '30%', left: '30%'
				}).appendTo('body')
			;

		$background.click(function(){
			$background.remove();
			$popup.remove();
		});
	});
}
///////////////////////////////////////////////////
function extendHandlebars() {
	Handlebars.registerHelper('html', truthyOr('', function(html) {
	  	return new Handlebars.SafeString(html);
	}));
	Handlebars.registerHelper('infoButton', function() {
		if(!_.any(this.links)) return ''
		var target = '#'+'eventlinks-'+this._id;
	  	return new Handlebars.SafeString('<a class="ico ico-info info-popup-trigger"></a>');
	});
	Handlebars.registerHelper('time', truthyOr('', function(timestamp) {
		if (!timestamp) return '';
		var date = new Date(timestamp);
		var theDateF = 'H:MI PP';
		var now = new Date();
		if (timestamp > now.getTime()+1000*60*60*24*7) theDateF = 'M/D, ' + theDateF;
		if (date.getDay() != now.getDay()) theDateF = 'DDD ' + theDateF;
	  	return date.toFormat(theDateF);
	}));
	Handlebars.registerHelper('eventImage', function() {
		if(!this.image) return '';
	  	return new Handlebars.SafeString('<img src="'+this.image.src+'" alt="'+this.eventName+'" class="event-image"/>');
	});
	Handlebars.registerHelper('eventLink', truthyOr('', function(link) {
		var linkTypes = {
			venue: 'More info about this venue',
			artist: link.text || 'More info about this artist',
			gcal: 'View this event on Google Calendar',
			artist_tip: 'Leave this artist a tip',
		};
	  	return new Handlebars.SafeString([
	  		 '<a href="'+link.link+'">'
	  		,'<span class="icon '+link.type+'"></span>'
	  		,'<span class="link-name">'
	  			,linkTypes[link.type]
	  		,'</span></a>'
	  	].join(''));
	}));
	Handlebars.registerHelper('favoriteEvent', function() {
	  	return new Handlebars.SafeString('<a class="favorite ico ico-star" href="javascript:void(0)" data-eventidentifier="'+this._id+'"></a>');
	});
	Handlebars.registerHelper('mapLink', function() {
		if(!this.location || !this.location.lat || !this.location.lon) return '';
		var  locStr = ''+this.location.lat+','+this.location.lon
			,link = 'https://maps.google.com/?'+$.param({ z:16, q:((this.venue||'').replace("@", "at")+'@'+locStr) })
			; 
	  	return new Handlebars.SafeString('<a href="'+link+'" target="_blank"  class="ico ico-map-pin-fill"></a>');
	});

	Handlebars.registerHelper('twitterButton', function() {
		var query = {
			hashtags: 'nola,codemkrs',
			tw_p: 'tweet_button',
			url: 'http://gigsguru.com/#!' + this._id,
			original_referer: 'http://gigsguru.com/',
			text: this.eventName
		};
	  	return new Handlebars.SafeString('<a href="https://twitter.com/intent/tweet?' + $.param(query) + '" target="_blank" class="ico ico-twitter-old"></a>');
	});
}
//////////////////////////////////////////////////
function hasTextContents() {
	return !!this.innerText.trim();
}
function add2(x, y) { return x+y }
function truthyOr(def, fn) { return function(x){return x ? fn.apply(this, arguments) : def }}
function fn(val) { return function fn() { return val } }
function resolveDeferred(val) { return function resolvedDeferred(d) { d.resolve(val) } }

function getLocalStorage(key) {
	var v = localStorage[key];
	if(!v) return v;
	try { return JSON.parse(v) } catch(e) {}
	return  null; 
}
function setLocalStorage(key, obj) {
	localStorage[key] = JSON.stringify(obj);
}
function featureEnabled(feature) {
	return !!~(location.search||'').indexOf(feature);
}
})();