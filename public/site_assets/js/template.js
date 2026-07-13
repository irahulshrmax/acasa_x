"use strict";

function syncPosition(el) {
	var current = this.currentItem;
	var thumbnail_slider  = jQuery("#property-thumb-slider");
	thumbnail_slider
		.find(".owl-item")
		.removeClass("synced")
		.eq(current)
		.addClass("synced");
	if (thumbnail_slider.data("owlCarousel") !== undefined) {
		center(current)
	}
}
function center(number) {
	var thumbnail_slider  = jQuery("#property-thumb-slider");
	var thumbnail_slidervisible = thumbnail_slider.data("owlCarousel").owl.visibleItems;
	var num                     = number;
	var found                   = false;
	for (var i in thumbnail_slidervisible) {
		if (num === thumbnail_slidervisible[i]) {
			var found = true;
		}
	}

	if (found === false) {
		if (num > thumbnail_slidervisible[thumbnail_slidervisible.length - 1]) {
			thumbnail_slider.trigger("owl.goTo", num - thumbnail_slidervisible.length + 2)
		} else {
			if (num - 1 === -1) {
				num = 0;
			}
			thumbnail_slider.trigger("owl.goTo", num);
		}
	} else if (num === thumbnail_slidervisible[thumbnail_slidervisible.length - 1]) {
		thumbnail_slider.trigger("owl.goTo", thumbnail_slidervisible[1])
	} else if (num === thumbnail_slidervisible[0]) {
		thumbnail_slider.trigger("owl.goTo", num - 1)
	}

}


jQuery(document).ready(function () {

	// Go Up
	jQuery('#go-up').on('click', function () {
		jQuery('body,html').animate({
			scrollTop: 0
		}, 1000);
	});

	new WOW().init();

	// Enable forms by ajax
	jQuery('#login-form-butt, #register-form-butt').magnificPopup({
		type: 'ajax',
		removalDelay: 600,
		mainClass: 'mfp-fade'
	}),

	// Clone the main menu to the mobile menu
	jQuery('#main-menu').clone().removeClass().appendTo('#mobile-menu-container');

	// Enable Menu menu toggling
	jQuery('#main-menu-handle').on('click', function () {
		jQuery(this).toggleClass('active');
		jQuery('#mobile-menu-container').slideToggle(function () {
			jQuery(window).trigger('scroll').trigger('resize');
		});
	});

	// Enable Featured properties slider
	if (jQuery('#featured-properties .owl-carousel').length > 0) {
		jQuery("#featured-properties .owl-carousel").owlCarousel({
			items:             2,
			itemsDesktop:      [1200, 2],
			itemsDesktopSmall: [980, 1],
			itemsTablet:       [768, 1],
			itemsMobile:       [480, 1],
			navigation:        !1,
			pagination:        !0
		});
	}

	// Enable Top Agent slider
	if (jQuery('#top-agents .owl-carousel').length > 0) {
		jQuery("#top-agents .owl-carousel").owlCarousel({
			items:        4,
			itemsDesktop: [1200, 3],
			itemsDesktopSmall: [980, 2],
			itemsTablet:  [768, 1],
			itemsMobile:  [480, 1],
			navigation:   !1,
			pagination:   !0
		});
	}

	// Enable Clients slider
	if (jQuery('#our-partners .owl-carousel').length > 0) {
		jQuery("#our-partners .owl-carousel").owlCarousel({
			items:        4,
			itemsDesktop: [1200, 4],
			itemsTablet:  [980, 2],
			itemsMobile:  [480, 1],
			navigation:   !0,
			pagination:   !1
		});
	}

	if (jQuery.isFunction(jQuery.fn.select2)) {
		// Change all the select boxes to select2
		jQuery("select").select2();
	}

	// Enable Range Sliders
	if (jQuery('.range-slider').length > 0) {
		jQuery(".range-slider").ionRangeSlider({
			type:       'double',
			prefix:     "$",
			maxPostfix: "+",
			prettify:   false
		});
	}

	if (jQuery('.property-search-form .more-options').length > 0) {
		jQuery('.property-search-form .more-options').on('click', function (e) {
			e.preventDefault();
			if (jQuery(this).siblings('.advanced-search-sec').length > 0) {
				jQuery(this).siblings('.advanced-search-sec').slideToggle(function () {
					jQuery(window).trigger('resize.px.parallax');
				});
				jQuery(this).parents('.property-search-form').toggleClass('opened');
			} else {
				jQuery(this).parents('.main-search-sec').siblings('.advanced-search-sec').slideToggle(function () {
					jQuery(window).trigger('resize.px.parallax');
				});
				jQuery(this).parents('.property-search-form').toggleClass('opened');
			}

		});
	}

	if (jQuery("#main-slider").length > 0) {
		// Main Slider
		var mainSlider = jQuery("#main-slider");

		mainSlider.find('.items').each(function(){
			var imgContainer = jQuery(this).find('.img-container');
			imgContainer.css('background-image', 'url(' + imgContainer.data('bg-img') + ')');
		});

		mainSlider.owlCarousel({
			navigation:     !0,
			singleItem:     !0,
			addClassActive: !0,
			autoPlay:       !0,
			pagination:     !1,
		});
	}

	if (jQuery("#main-slider-fullscreen").length > 0) {
		// Main Slider
		var mainSlider = jQuery("#main-slider-fullscreen");

		mainSlider.find('.items').each(function(){
			var imgContainer = jQuery(this).find('.img-container');
			imgContainer.css('background-image', 'url(' + imgContainer.data('bg-img') + ')');
		});
		mainSlider.owlCarousel({
			navigation:     !1,
			singleItem:     !0,
			addClassActive: !0,
			autoPlay:       !0,
			pagination:     !0,
		});
	}

	if (jQuery("#property-compare-slider").length > 0) {
		// Compare Slider
		var compareSlider = jQuery("#property-compare-slider");
		compareSlider.owlCarousel({
			items:        3,
			itemsDesktop: [1200, 2],
			itemsTablet:  [980, 1],
			itemsMobile:  [480, 1],
			navigation:   !0,
			pagination:   !1
		});
	}


	if (jQuery("#property-slider-section").length > 0) {

		var main_image_slider = jQuery("#property-main-slider"),
			thumbnail_slider  = jQuery("#property-thumb-slider");

		main_image_slider.find('.items').each(function(){
			var imgContainer = jQuery(this).find('.img-container');
			imgContainer.css('background-image', 'url(' + imgContainer.data('bg-img') + ')');
		});

		thumbnail_slider.find('.items').each(function(){
			var imgContainer = jQuery(this).find('.img-container');
			imgContainer.css('background-image', 'url(' + imgContainer.data('bg-img') + ')');
		});

		main_image_slider.owlCarousel({
			addClassActive:        !0,
			singleItem:            true,
			slideSpeed:            1000,
			navigation:            false,
			pagination:            false,
			autoPlay:              true,
			afterAction:           syncPosition,
			responsiveRefreshRate: 200,
		});

		thumbnail_slider.owlCarousel({
			items:                 4,
			itemsDesktop:          [1199, 5],
			itemsDesktopSmall:     [979, 3],
			itemsTablet:           [768, 2],
			itemsMobile:           [479, 1],
			pagination:            false,
			responsiveRefreshRate: 100,
			afterInit:             function (el) {
				el.find(".owl-item").eq(0).addClass("synced");
			}
		});

		thumbnail_slider.on("click", ".owl-item", function (e) {
			e.preventDefault();
			var number = jQuery(this).data("owlItem");
			main_image_slider.trigger("owl.goTo", number);
		});

	}


	// Enable Google Map
	if (jQuery('#map').length > 0) {
		initialize();
	}

	// Enable Location auto complete
	if (jQuery('#location-search-box').length > 0 && jQuery('#map').length == 0) {
		var input        = document.getElementById('location-search-box');
		var autocomplete = new google.maps.places.Autocomplete(input);
	}

	//Fullscreen button activation
	if (jQuery('#fullscreen-btn').length > 0) {
		jQuery('#fullscreen-btn').on('click', function (e) {
			e.preventDefault();
			jQuery(this).toggleClass('active');
			jQuery('body').toggleClass('full-screen');
		});
	}

	if (jQuery.isFunction(jQuery.fn.isotope)) {
		var mainContainer = jQuery(".image-main-box");
		mainContainer.isotope({
			transitionDuration: "0.7s"
		});
		mainContainer.imagesLoaded(function () {
			mainContainer.isotope("layout");
			jQuery(".sort-section-container").on("click", "a", function (e) {
				e.preventDefault();
				jQuery(".sort-section-container a").removeClass("active");
				jQuery(this).addClass("active");
				var filterValue = jQuery(this).attr("data-filter");
				mainContainer.isotope({filter: filterValue});
				jQuery(window).trigger('resize.px.parallax');
			});
		});
	}

	if (jQuery.isFunction(jQuery.fn.magnificPopup)) {
		jQuery('.image-main-box:not(.portfolio)').magnificPopup({
			delegate:     '.more-details',
			type:         'image',
			removalDelay: 600,
			mainClass:    'mfp-fade',
			gallery:      {
				enabled:            true,
				navigateByImgClick: true,
				preload:            [0, 1] // Will preload 0 - before current, and 1 after the current image
			},
			image:        {
				titleSrc: 'data-title',
				tError:   '<a href="%url%">The image #%curr%</a> could not be loaded.'
			}
		});
	}

	// FAQ section
	if (jQuery('.faq-box').length > 0) {
		jQuery('.faq-box').on('click', '.title', function () {
			jQuery(this).next('.content').slideToggle(function () {
				jQuery(window).trigger('resize.px.parallax');
			}).parent().toggleClass('opened');
		});
	}

	// Make Number Thousand separated
	jQuery('.number-field').on('keyup', function (event) {
		// skip for arrow keys
		if (event.which >= 37 && event.which <= 40) return;
		// format number
		jQuery(this).val(function (index, value) {
			return value
				.replace(/\D/g, "")
				.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		});
	});

	//Enable neighborhood buttons
	function enableByButtons() {
		jQuery('.neighborhood-row .btn-container').on('click', 'button', function () {
			jQuery(this).parent().siblings('.neighbor-by').val(jQuery(this).data('value'));
			jQuery(this).addClass('active').siblings('button').removeClass('active');
		});
	}
	if (jQuery('.neighborhood-row').length > 0) {

		enableByButtons();
		// Add new neighborhood
		jQuery('.add-neighborhood-btn').on('click', function () {
			var neighboorPattern = jQuery('#neighborhood-pattern').clone().attr('id', '');
			jQuery('.neighborhood-container').append(neighboorPattern);
			jQuery(window).trigger('resize.px.parallax');
			enableByButtons();
		});
	}

	if (jQuery('body.compare').length > 0) {
		var boxesHeight = 0;
		jQuery(".neighborhood").each(function () {
			var currBoxHeight = jQuery(this).height();
			if (currBoxHeight > boxesHeight) {
				boxesHeight = currBoxHeight
			}
		});
		jQuery(".neighborhood").height(boxesHeight);
	}
});

jQuery(window).scroll(function () {
	"use strict";
	var haderSec = jQuery("body, #main-header");
	jQuery(document).scrollTop() > 30 ? haderSec.addClass("sticky") : haderSec.removeClass("sticky");
})