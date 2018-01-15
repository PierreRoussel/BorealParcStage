(function($){
  $(function(){

    $('.button-collapse').sideNav();
    $('.parallax').parallax();
    $('.scrollspy').scrollSpy();

  }); // end of document ready
})(jQuery); // end of jQuery name space

jQuery(document).ready(function($){
	//open interest point description
	$('.cd-single-point').children('a').mouseover(function() {
		$(this).parent('li').addClass('is-open');
		}).mouseout(function() {
		$(this).parent('li').removeClass('is-open');
	});
	//close interest point description
	$('.cd-close-info').on('click', function(event){
		event.preventDefault();
		$(this).parents('.cd-single-point').eq(0).removeClass('is-open').addClass('visited');
	});
});

