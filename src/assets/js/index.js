document.addEventListener('DOMContentLoaded', () => {
	/**
	 * Remove preload
	 */
	document.getElementsByTagName("BODY")[0].classList.remove('preload');

	/**
	 * IE support for object-fit
	 */
	objectFitImages();

});


$( ".toggle-mini-cart" ).click(function() {
    event.preventDefault();
    $( ".cart-mini-holder" ).toggleClass("open");
    // $( "body" ).toggleClass("mobile-nav-toggle");
});
