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
