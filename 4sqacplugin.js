(function ($) {

    $.foursquareAutocomplete = function (element, options) {
        this.options = {};

        element.data('foursquareAutocomplete', this);

        this.init = function (element, options) {
            this.options = $.extend({}, $.foursquareAutocomplete.defaultOptions, options);
            this.options = $.metadata ? $.extend({}, this.options, element.metadata()) : this.options;
            updateElement(element, this.options);
        };
        this.init(element, options);
        this.select = function (event, ui) {
        };
        
    };
    $.fn.foursquareAutocomplete = function (options) {
        return this.each(function () {
            (new $.foursquareAutocomplete($(this), options));
        });
    };

    function updateElement(element, options) {
        element.autocomplete({
            source: function (request, response) {
				var total = 5;
                $.ajax({
                    url: "https://api.foursquare.com/v2/venues/suggestcompletion",
                    dataType: "jsonp",
					async: false,
                    data: {
                        ll: options.latitude + "," + options.longitude,
                        v: "20120214",
                        oauth_token: options.oauth_token,
                        query: request.term,
						limit: total
                    },
                    success: function (data) {
						// Check to see if there was success
						if (data.meta.code != 200)
						{
							element.removeClass("ui-autocomplete-loading")
							options.onError(data.meta.code, data.meta.errorType, data.meta.errorDetail);
							return false;
						}
						var checkinsCounts = new Array();
                    	$.map(data.response.minivenues, function (itemv, i) {
							$.ajax({
								url: "https://api.foursquare.com/v2/venues/"+itemv.id+"",
								async: false,
								dataType: "jsonp",
								data: {
									oauth_token: options.oauth_token,
								},
								success: function (_data) {
										// Check to see if there was success
										if (_data.meta.code != 200)
										{
											element.removeClass("ui-autocomplete-loading")
											options.onError(_data.meta.code, _data.meta.errorType, _data.meta.errorDetail);
											return false;
										}
										checkinsCounts[i] = _data.response.venue.stats.usersCount;
										total--;
										if (0 == total) {
											response($.map(data.response.minivenues, function (item, i) {
												return {
													name: item.name,
													id: item.id,
													address: (item.location.address == undefined ? "" : item.location.address),
													cityLine: (item.location.city == undefined ? "" : item.location.city + ", ") + (item.location.state == undefined ? "" : item.location.state + " ") + (item.location.postalCode == undefined ? "" : item.location.postalCode),
													photo: (item.category == undefined ? "" : item.category.icon.prefix + "32" + item.category.icon.name), 
													full: item,
													count: checkinsCounts[i]
												};
											}));
										}
								},
								error: function (header, status, errorThrown) {
									  options.onAjaxError(header, status, errorThrown);
								}
							});
						});
                    },
                    error: function (header, status, errorThrown) {
                    	  options.onAjaxError(header, status, errorThrown);
                    }
                });
            },
            minLength: options.minLength,
            select: function (event, ui) {
                element.val(ui.item.name);
                options.search(event, ui);
                return false;
            },
            open: function () {
                $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
            },
            close: function () {
                $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
            }
        })
            .data("autocomplete")._renderItem = function (ul, item) {
                return $("<li></li>")
                    .data("item.autocomplete", item)
                    .append("<a>" + getAutocompleteText(item) + "</a>")
                    .appendTo(ul);
            };

    };

    $.foursquareAutocomplete.defaultOptions = {
        'latitude': 1.3667,
        'longitude': 103.8,
        'oauth_token': "NPA5QH05PHWROYJZVTJU2FNEGV3IAC4LH1TBGS3FN2P4MHJP",
        'minLength': 1,
        'select': function (event, ui) {},
        'onError': function (errorCode, errorType, errorDetail) {},
        'onAjaxError' : function (header, status, errorThrown) {}
    };
    

    /// Builds out the <select> portion of autocomplete control
    function getAutocompleteText(item) {
        var text = "<div>";
        text += "<div class='categoryIconContainer'><img src='" + (item.photo == "&nbsp;" ? "" : item.photo) + "' /></div>";
        text += "<div class='autocomplete-name'>" + item.name + "</div>";
        if (item.address == "&nbsp;" && item.cityLine == "&nbsp;")
            text += "<div class='autocomplete-detail'>&nbsp;</div>";
        if (item.address != "&nbsp;")
            text += "<div class='autocomplete-detail'>" + item.address + "</div>";
        if (item.cityLine != "&nbsp;")
            text += "<div class='autocomplete-detail'>" + item.cityLine + "</div>";
        text += "<div class='autocomplete-detail'>" + item.count + " People been here before</div>";
        text += "</div>";
		console.log(text);
        return text;
    }
})(jQuery);
