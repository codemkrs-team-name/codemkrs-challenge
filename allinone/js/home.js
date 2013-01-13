(function(){

extendHandlebars();
initToggles();
$.when(gettingEvents(), pageInitializing()).done(function(allEvents){

	var  eventTemplate 	= Handlebars.compile($("#event-template").html())
		,$filters   	= initFilters() 
		;
	runCurrentFilter(allEvents, eventTemplate);
	$filters.on('change', function() { runCurrentFilter(allEvents, eventTemplate) });

});


//////////////////////////////////////////////////////
// Filters
/////////////////////////////////////////////////////
function runCurrentFilter(allEvents, eventTemplate) {
	var  $events 	= $('#events-list')
		,selVal		= function(name) { return $('#'+name+'-filter').val() }
		,events = _.chain(allEvents)
				.filter(filterRanking(selVal('ranking')))
				.filter(filterDay(selVal('day')))
				.filter(filterDistance(selVal('distance')))
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
}
function filterDay(daytime) { 
	var day = new Date(parseInt(daytime, 10)).getDay();
	return function(ev) { 
		return day == new Date(ev.time).getDay()
	}
}
function filterDistance(distance) { return function(ev) {
	return true; //Implement this
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
	return $.getJSON('/events.json').pipe(stubAmmendEvents);

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

})();