/** @format */

document.addEventListener("DOMContentLoaded", function () {
	var images = [
		"/assets/img/splash-screen/bg-splash-post-00.webp",
		"/assets/img/splash-screen/bg-splash-post-01.webp",
		"/assets/img/splash-screen/bg-splash-post-02.webp",
		"/assets/img/splash-screen/bg-splash-post-03.webp",
		"/assets/img/splash-screen/bg-splash-post-04.webp",
		"/assets/img/splash-screen/bg-splash-post-05.webp",
		"/assets/img/splash-screen/bg-splash-post-06.webp",
		// Add more image paths here
	];

	// Generate a random index each time the page is loaded
	var randomIndex = Math.floor(Math.random() * images.length);
	var randomImage = images[randomIndex];

	// Add a cache-busting parameter to the URL
	var timestamp = new Date().getTime();
	var imageUrl =
		randomImage + "?cache=" + timestamp + "&random=" + Math.random();

	var masthead = document.querySelector(".masthead");
	masthead.style.backgroundImage = "url(" + imageUrl + ")";
});
