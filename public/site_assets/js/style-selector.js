"use strict";
jQuery(document).ready(function () {
	var body          = jQuery('body'),
		mainCSS       = jQuery('#main-style-file-css'),
		demoSwitcher =
			'<div class="demo-styler">' +
				'<div class="handle"><i class="fa fa-cog"></i></div>' +
				'<div class="demo-setting-container">' +
					'<div class="preset-container">' +
						'<div class="title">Choose a color</div>' +
							'<ul class="clearfix">' +
								'<li class="active"><a class="preset-color-1" data-preset-id="0" href="#" >Color 1</a></li>' +
								'<li><a class="preset-color-2" data-preset-id="1" href="#" >Color 2</a></li>' +
								'<li><a class="preset-color-3" data-preset-id="2" href="#" >Color 3</a></li>' +
								'<li><a class="preset-color-4" data-preset-id="3" href="#" >Color 4</a></li>' +
							'</ul>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>';
	body.append(demoSwitcher);

	var styleSelector = jQuery('.demo-styler'),
		preset        = styleSelector.find('.preset-container'),
		presetBox	  = preset.find('a');

	styleSelector.on('click', '.handle', function () {
		styleSelector.toggleClass('active');
	});

	presetBox.on('click', function (e) {
		e.preventDefault();
		presetBox.children('ul').removeClass('loading');
		var $this = jQuery(this),
			b     = $this.data("preset-id"),
			d     = preset.find(".active").children('a').data("preset-id");

		$this.parents('ul').addClass('loading');

		if ("0" == d) var e = mainCSS.attr("href").replace("style", "style-" + b);
		else if ("0" == b) e = mainCSS.attr("href").replace("style-" + d, "style");
		else var e = mainCSS.attr("href").replace("style-" + d, "style-" + b);
		jQuery.ajax({
				url: e
			})
			.done(function () {
				mainCSS.attr("href", e);
				preset.children('ul').removeClass('loading');
			});
		preset.find('li').removeClass("active");
		$this.parent().addClass("active");
	});
});




