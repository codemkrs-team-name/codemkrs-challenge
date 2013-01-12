(function(){
window.allEvents = _.map(_.range(35), function(i) {
	return {
		 eventName: "Here is some event "+i
		,venue: "Venue "+_.random(10)
		,location: null
		,time: new Date(1358014168714).add({hours: _.random(72)}).getTime()
		,image: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRSHHZb6Dt0Sssbz0nzT-MUvgwmtf11T2DzVkDC1ONsO2z62num'
		,price: null
		,description: "<p>Now that there is the Tec-9, a crappy spray gun from South Miami. This gun is advertised as the most popular gun in American crime. Do you believe that shit? It actually says that in the little book that comes with it: the most popular gun in American crime. Like they're actually proud of that shit.  </p>"
		,source: '<a href="http://cheezburger.com/6924526080">This guy\'s blog</a>'
		,ranking: _.random(1)||null
		,links: [
			{
			 	 type: ['music', 'gcal', 'info'][_.random(2)]
			 	,text: "Text "+i
				,link: 'https://play.google.com/music/listen?u=1'
			}
		]
	};
});


window.codemkrs = function() {
	extendHandlebars();
	initToggles();
	initFilters();

	var  eventTemplate 	= Handlebars.compile($("#event-template").html())
		,$events 	= $('#events-list')
		,allEvents 	= window.allEvents 		//todo JSON get
		;
	$events
		.html(_.reduce(_.map(allEvents,eventTemplate), add2, '') )
		.trigger('create');

};

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

function initFilters() {
	var  $day = $('#day-filter')
		,days = _.map(_.range(3), function(d) { return new Date().add({days: d}) })
		;
	$day.html(
		_.map(days, function(d) {
			return '<option value='+d.getTime()+'>'+d.toFormat('DDD MMM D')+'</option>'
		}).join('')
	).find('option:first').prop('selected', true).trigger('change');
}

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
function extendHandlebars() {
	Handlebars.registerHelper('html', function(html) {
	  return new Handlebars.SafeString(html);
	});
	Handlebars.registerHelper('time', truthyOr('', function(timestamp) {
	  return !timestamp ? '' : new Date(timestamp).toFormat('H:MM PP');
	}));
	Handlebars.registerHelper('eventImage', truthyOr('', function() {
	  return new Handlebars.SafeString('<img src="'+this.image+'" alt="'+this.eventName+'" class="event-image"/>');
	}));
	Handlebars.registerHelper('eventLink', truthyOr('', function(link) {
	  return new Handlebars.SafeString('<a href="'+link.link+'"><span class="icon '+link.type+'"></span><span class="link-name">'+link.text+'</span></a>');
	}));

}

function add2(x, y) { return x+y }
function truthyOr(def, fn) { return function(x){return x ? fn.apply(this, arguments) : def }}

})();