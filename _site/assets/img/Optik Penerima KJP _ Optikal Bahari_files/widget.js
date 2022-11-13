(function(window, document){"use strict";// Localize jQuery variables
var $sk_reviews_grid_holder;
var env_urls = skGetEnvironmentUrls('google-reviews');
var app_url = env_urls.app_url;
var sk_app_url = env_urls.sk_app_url;
var app_backend_url = env_urls.app_backend_url;
var sk_api_url = env_urls.sk_api_url;
var app_file_server_url = env_urls.app_file_server_url;
var data_storage;
var data_bio;
var last_key = 0;
var current_position = 0;
var original_data;
var additional_error_messages = [];
// loading animation
var el = document.getElementsByClassName('sk-ww-google-reviews')[0];

if(el==undefined){
    var el = document.getElementsByClassName('dsm-ww-fb-page-reviews')[0];
    el.className = "sk-ww-google-reviews";
}

el.innerHTML = "<div class='first_loading_animation' style='text-align:center; width:100%;'><img src='" + app_url + "images/ripple.svg' class='loading-img' style='width:auto !important;' /></div>";
loadCssFile(app_url + "libs/magnific-popup/magnific-popup.css");
loadCssFile(app_url + "google-reviews/styles.css?v="+(new Date().getTime()));
loadCssFile("https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");

// load css file
function loadCssFile(filename){

    var fileref=document.createElement("link");
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", filename);

    if(typeof fileref!="undefined"){
        document.getElementsByTagName("head")[0].appendChild(fileref)
    }
}

/******** Load jQuery if not present *********/
if (window.jQuery === undefined) {
     var script_tag = document.createElement('script');
     script_tag.setAttribute("type","text/javascript");
     script_tag.setAttribute("src", "https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js");
     if (script_tag.readyState) {
       script_tag.onreadystatechange = function () { // For old versions of IE
           if (this.readyState == 'complete' || this.readyState == 'loaded') {
               scriptLoadHandler();
           }
       };
     } else {
       script_tag.onload = scriptLoadHandler;
     }
     // Try to find the head, otherwise default to the documentElement
     (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
 } else {
     // The jQuery version on the window is the one we want to use
     jQuery = window.jQuery;
     scriptLoadHandler();
 }

 /******** Called once jQuery has loaded ******/
function scriptLoadHandler() {

    loadScript(app_url + "libs/magnific-popup/jquery.magnific-popup.js", function(){
         loadScript("https://unpkg.com/masonry-layout@4.2.0/dist/masonry.pkgd.min.js", function(){
            loadScript(app_url + "libs/swiper/swiper.min.js", function(){
                loadScript(app_url + "libs/js/moment2.29.4.js", function(){
                    loadScript(app_url + "libs/js/moment-timezone.js", function(){
                        // Restore $ and window.jQuery to their previous values and store the
                        // new jQuery in our local jQuery variable
                        $ = jQuery = window.jQuery.noConflict(true);
                        var version = jQuery.fn.jquery;
                            version = version ? parseInt(version.charAt(0)) : 4;

                        if(version < 3 && !window.location.href.includes('urgentdoc')){
                            loadScript("https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js", function(){
                                // Call our main function
                                main(); 
                            });
                        }
                        else{
                            // Call our main function
                            main();
                        }
                    });
                });
            });
        });
    });
 
}function loadScript(url, callback){

	/* Load script from url and calls callback once it's loaded */
	var scriptTag = document.createElement('script');
	scriptTag.setAttribute("type", "text/javascript");
	scriptTag.setAttribute("src", url);

	if (typeof callback !== "undefined") {
		if (scriptTag.readyState) {
			/* For old versions of IE */
			scriptTag.onreadystatechange = function(){
				if (this.readyState === 'complete' || this.readyState === 'loaded') {
					callback();
				}
			};
		} else {
			scriptTag.onload = callback;
		}
	}
	(document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);
}

function getDsmEmbedId(sk_google_reviews){
    var embed_id = sk_google_reviews.attr('embed-id');
    if(embed_id==undefined){
        embed_id = sk_google_reviews.attr('data-embed-id');
    }

    return embed_id;
}

function getDsmSetting(sk_google_reviews, key){
    return sk_google_reviews.find("." + key).text();
}

function moderateData(sk_google_reviews,reviews){
    if(getDsmSetting(sk_google_reviews,'order_by') == 2){
        reviews.sort( () => Math.random() - 0.5);
    }
    return reviews;
}

function applyDateFormat(sk_facebook_feed, data_storage){

    var date_format = getDsmSetting(sk_facebook_feed,'date_format');
    var use_24_hour_clock = getDsmSetting(sk_facebook_feed,'use_24_hour_clock');
    var timezone = getDsmSetting(sk_facebook_feed,'timezone');
    var show_time_posted = getDsmSetting(sk_facebook_feed,'show_time_posted');

    var format = 'MMM D, YYYY';
    
    if (date_format == 'M d, Y') {
        format = 'MMM D, YYYY';
    }
    else if (date_format == 'jS M Y') {
        format = 'Do MMM YYYY';
    }
    else if (date_format == 'Y M jS') {
        format = 'YYYY MMM Do';
    }
    else if (date_format == 'Y-m-d') {
        format = 'YYYY-MM-D';
    }
    else if (date_format == 'm/d/Y') {
        format = 'MM/D/YYYY';
    }
    else if (date_format == 'd/m/Y') {
        format = 'D/MM/YYYY';
    }
    else if (date_format == 'd.m.Y') {
        format = 'D.MM.YYYY';
    }
    else if (date_format == 'd-m-Y') {
        format = 'D-MM-YYYY';
    }
    
    // time format
    if (use_24_hour_clock == 1 && show_time_posted == 1) {
        format = format + ' HH:mm';
    } 
    else if(show_time_posted == 1) {
        format = format + ' hh:mm A';
    }
    
    jQuery.each(data_storage,function(index, value){
        // format actual date
        if(data_storage[index] && data_storage[index].review_date_time){
            var date_time = data_storage[index].review_date_time;
            if (timezone) {
                data_storage[index].review_date_time = date_format == "time_ago" ? moment(date_time).fromNow() : moment(date_time).tz(timezone).format(format);
            }
            else {
                data_storage[index].review_date_time = date_format == "time_ago" ? moment(date_time).fromNow() : moment(date_time).format(format);
            }
        }
    });

    return data_storage;
}


function moderationTabFeature(data, sk_facebook_reviews) {

	var preapproved_albums = getDsmSetting(sk_facebook_reviews, 'preapproved_posts');
	var excluded_albums = getDsmSetting(sk_facebook_reviews, 'excluded_posts');

    var preapproved_posts = "do_not_show_anything";
    var excluded_posts = "";
    if (getDsmSetting(sk_facebook_reviews, 'turnon_preapproval_posts') == 1) {
        preapproved_posts = preapproved_albums;
    }

    if (excluded_albums != "") {
        excluded_posts = excluded_albums;
    }

    var new_posts_list = [];
    
    if(data && data){
       for (let item of data) {
            if (typeof item != 'undefined') {

                if (getDsmSetting(sk_facebook_reviews, 'turnon_preapproval_posts') == 1) {
                    if (preapproved_posts.indexOf(item.contributor_id) != -1) {

                        new_posts_list.push(item);
                    }
                }
                else {

                    if (getDsmSetting(sk_facebook_reviews, 'turnon_preapproval_posts') == 0 && excluded_posts.indexOf(item.contributor_id) != -1) {

                    }
                    else {
                        new_posts_list.push(item);
                    }
                }
            }
        }; 
    }



    return new_posts_list;
}

function showByRating(data, sk_facebook_reviews) {
	var show_5_star_rating = getDsmSetting(sk_facebook_reviews, 'show_5_star_rating') == 1 ? '5' : '';
    var show_4_star_rating = getDsmSetting(sk_facebook_reviews, 'show_4_star_rating') == 1 ? '4' : '';
    var show_3_star_rating = getDsmSetting(sk_facebook_reviews, 'show_3_star_rating') == 1 ? '3' : '';
    var show_2_star_rating = getDsmSetting(sk_facebook_reviews, 'show_2_star_rating') == 1 ? '2' : '';
    var show_1_star_rating = getDsmSetting(sk_facebook_reviews, 'show_1_star_rating') == 1 ? '1' : '';
    
    var ratings = show_5_star_rating +
                  show_4_star_rating +
                  show_3_star_rating +
                  show_2_star_rating +
                  show_1_star_rating;

    var new_posts_list = [];

        if(data){
            for (let item of data) {
                if (typeof item != 'undefined') { 
                    if (show_5_star_rating || 
                        show_4_star_rating ||
                        show_3_star_rating ||
                        show_2_star_rating || 
                        show_1_star_rating 
                        ) { 

                        item.rating = item.rating && item.rating == '5/5' ? '5' : item.rating;
                        item.rating = item.rating && item.rating == '4/5' ? '4' : item.rating;
                        item.rating = item.rating && item.rating == '3/5' ? '3' : item.rating;
                        item.rating = item.rating && item.rating == '2/5' ? '2' : item.rating;
                        item.rating = item.rating && item.rating == '1/5' ? '1' : item.rating;
                        if (ratings.indexOf(item.rating) != -1) { 
                            new_posts_list.push(item);
                        }
                    }
                }  
            }
        }
    
    return new_posts_list;
}

function showWithTextOnly(data, sk_facebook_reviews) {

    var show_rating_with_text_only = getDsmSetting(sk_facebook_reviews, 'show_rating_with_text_only');
    var new_posts_list = [];

        if(data){
            for (let item of data) {
                if (typeof item != 'undefined') { 
                    if (show_rating_with_text_only == 1) { 
                        if (item.review_text != "") { 
                            new_posts_list.push(item);
                        }
                    } 
                    else {
                        new_posts_list.push(item);
                    }  
                }  
            }
        }
    
    
    return new_posts_list;
}

function sortReviewsBy(data, sk_facebook_reviews) {

    var order_by = getDsmSetting(sk_facebook_reviews, 'order_by');
    var new_posts_list = [];
        if(data){
            switch(order_by) {
                case '0':
                    data.sort(function(a, b) {
                        return new Date(b.review_date_time).getTime() - new Date(a.review_date_time).getTime();
                    });
                  break;
                case '1':
                    data.sort(function(a, b) {
                        return b.rating - a.rating;
                    });
                  break;
                case '2':
                    data = shuffle(data);
                  break;
                case '3':
                    data.sort(function(a, b) {
                        return b.review_text.length - a.review_text.length;
                    });
                  break;
                default:
            }

            for (let item of data) { 
                if (typeof item != 'undefined') { 
                    new_posts_list.push(item);
                }
            }  
        }
    
    
    return new_posts_list;
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
function loadFeed(sk_google_reviews){
    var data = original_data;
    // settings
    var show_load_more_button=sk_google_reviews.find('.show_load_more_button').text();
    var show_average_rating=getDsmSetting(sk_google_reviews, "show_average_rating");

    // text settings
    var load_more_posts_text=sk_google_reviews.find('.load_more_posts_text').text();
    if(original_data.user_info && original_data.user_info.status == 0){
        sk_google_reviews.prepend(freeTrialEndedMessage(original_data.solution_info));
        sk_google_reviews.find('.loading-img').hide();
        sk_google_reviews.find('.first_loading_animation').hide();
        return;
    } else if(data.show_feed==false){
        sk_google_reviews.prepend(data.message);
        sk_google_reviews.find('.loading-img').hide();
        sk_google_reviews.find('.first_loading_animation').hide();
    }
    else if((data.message=="load failed" || data.message=="No Data Found") && !data.bio.place_id && !data.bio.name){
        var sk_error_message = data.instructions;

        sk_google_reviews.find(".first_loading_animation").hide();
        sk_google_reviews.html(sk_error_message);
    }
    if (data.free_trial_ended == 1) {
        sk_google_reviews.find('.loading-img').hide();
        sk_google_reviews.find('.first_loading_animation').hide();
        sk_google_reviews.append(data.message);
    }

    else if(data.bio && data.bio.place_id != "" && data.bio.place_id != undefined){
        var post_items="";

        if(data.reviews && data.reviews.length){
            data.reviews = moderateData(sk_google_reviews,data.reviews);
        }

        data_bio = data.bio;
        data_storage = data.reviews;
        data_storage = showByRating(data.reviews, sk_google_reviews);
        data_storage = moderationTabFeature(data_storage, sk_google_reviews);
        data_storage = showWithTextOnly(data_storage, sk_google_reviews);
        data_storage = sortReviewsBy(data_storage, sk_google_reviews);
        data_storage = applyDateFormat(sk_google_reviews, data_storage);

        if(getDsmSetting(sk_google_reviews, "layout") == 3){
            post_items+=loadSliderLayout(sk_google_reviews,data_storage);
        }
        else{

            post_items+="<div class='' style='display:block;overflow:hidden;'>";
                post_items+="<div class=' sk-ww-google-reviews-items'>";
                    post_items+="<div class='sk_reviews_grid'>";
                        post_items+="<div class='sk_reviews_grid-sizer'></div>";
                            if(show_average_rating==1){ 
                                post_items+=getAverageRating(sk_google_reviews,data_bio)
                            }
                            var enable_button = false;
                            last_key = parseInt(getDsmSetting(sk_google_reviews,'post_count')); 
                            for (var i = 0; i < last_key; i++) {
                                if(typeof data_storage[i] != 'undefined'){
                                    post_items+="<div class='sk_reviews_grid-item ' style='position:relative'>";
                                    if(data_storage[i].review_text.length < 1){
                                        var stars = "star";
                                        if(data_storage[i].rating > 1){
                                            stars = "stars";
                                        }
                                        data_storage[i].review_text = data_storage[i].reviewer_name + " gives " + data.bio.name + " a " + data_storage[i].rating + " " + stars + " rating."
                                    }
                                    post_items+=getFeedItem(data_storage[i], sk_google_reviews, data.bio);
                                post_items+="</div>"; // end sk_reviews_grid-item
                                }
                            }
                            if(data_storage.length > last_key){
                                enable_button = true;
                            }

                        post_items+="</div>";
                    post_items+="</div>";
                    post_items+="<div class='sk-below-button-container'>";
                    if(enable_button && show_load_more_button == 1){
                            post_items+="<button class='sk-google-reviews-load-more-posts'>";
                                post_items+=load_more_posts_text;
                            post_items+="</button>";
                    }
                    post_items+="</div>";
                post_items+="</div>";
            post_items+="</div>";
        }

        post_items += skGetBranding(sk_google_reviews, data.user_info);
        sk_google_reviews.append(post_items);


        if(getDsmSetting(sk_google_reviews,'layout') == 3){
            sk_google_reviews.find('.swiper-slide').each(function(index, value){
                if(jQuery(value).text() == ""){
                    jQuery(value).remove();

                }
            });

            skSliderLayoutSettings(sk_google_reviews);
        }

        // apply google data structure
        if(data.google_data_structure_json){
            data.google_data_structure_json = JSON.stringify(data.google_data_structure_json);
            jQuery('head').append("<script type='application/ld+json'>"+data.google_data_structure_json+"</script>");
        }
        

        applyCustomUi(jQuery, sk_google_reviews);

        applyMasonry();
        fixMasonry();
        addDescriptiveTagAttributes(sk_google_reviews);


        // set date translation
        sk_google_reviews.find('.sk_fb_date').each(function(index, value){
            var sk_fb_date = jQuery(this).text();
            if(sk_fb_date){
                sk_fb_date = makeFullMonthName(sk_fb_date)
                var translation = getDsmSetting(sk_google_reviews,'translation');
                var translated = getDayMonthTranslation(translation,sk_fb_date);
                jQuery(this).text(translated);
            } 
        });
    }
    else{
        var sk_error_message = errorMessage();
        sk_google_reviews.find(".first_loading_animation").hide();
        sk_google_reviews.append(sk_error_message);
    }

    if(data.user_info){
        sk_increaseView(data.user_info);
    }
}

function getAverageRating(sk_google_reviews,data){

    var google_place_name = data.name;
    if(google_place_name.trim().length < 1){
        google_place_name = getDsmSetting(sk_google_reviews, "place_name");
    }
    var post_items="<div class='sk_reviews_grid-item sk_reviews_badge_container'>";
         post_items+="<div class='sk_reviews_grid-content badge-content' style='padding:0;'>";
             post_items+="<div class='sk_reviews_badge'>";
                 post_items+="<a class='sk-google-reviews-badge-info' href='https://www.google.com/maps/search/?api=1&query=Google&query_place_id=" + data.place_id + "' target='_blank'>";
                     post_items+="<div class='sk_reviews_num_icon'>";
                         post_items+= data.overall_star_rating + " <i class='sk_fb_stars fa fa-star' aria-hidden='true'></i>";
                     post_items+="</div>";
                     post_items+="<div style='width:100%;' class='sk-badge-name'>";
                         post_items+="<div style='padding:5px 0;font-weight:bold;'>Google "+getDsmSetting(sk_google_reviews, "over_all_rating_text")+"</div>";
                         if(getDsmSetting(sk_google_reviews, "show_feed_title") == 1)
                            post_items+="<div class='sk-google-place-name'>" + google_place_name+"</div>";
                            post_items+="<div style='padding:5px 0;'>" + formatNumber(data.rating_count) + " "+getDsmSetting(sk_google_reviews, "reviews_text")+"";
                            
                            if(getDsmSetting(sk_google_reviews,'show_write_review_button') == 1){
                                post_items+=" <a href='https://search.google.com/local/writereview?placeid="+data.place_id+"' target='_blank;' class='sk-google-reviews-write-review-btn'>"+getDsmSetting(sk_google_reviews, "write_a_review_text")+"</a>";
                            }
                            
                        post_items+="</div>";
                     post_items+="</div>";
                 post_items+="</a>";
             post_items+="</div>";
         post_items+="</div>";
    post_items+="</div>";

    return post_items;
}

function getFeedItem(val, sk_google_reviews, bio){

    var show_owners_response    = getDsmSetting(sk_google_reviews,"show_owners_response");
    var show_image          = getDsmSetting(sk_google_reviews,"show_image");
    var character_limit          = getDsmSetting(sk_google_reviews,"character_limit");
    var see_more_text          = getDsmSetting(sk_google_reviews,"see_more_text");
        see_more_text = !see_more_text ? "See more" : see_more_text;
    var post_items="";

    var review_text = val.review_text;

    if(review_text && review_text.length - 1 > character_limit && character_limit != 0 && review_text.indexOf(" ", character_limit) != -1){ 
        review_text = review_text.substring(0,review_text.indexOf(" ", character_limit)) + " ...";
    }

    var view_on_google = sk_google_reviews.find('.custom_google_place_link').text().length > 0 ? sk_google_reviews.find('.custom_google_place_link').text() : val.reviewer_link;

    var first_character = val.reviewer_name.charAt(0);
    
    if(val.reviewer_photo_link && val.reviewer_photo_link.indexOf('=') != -1){
        var splitted_img_link = val.reviewer_photo_link.split('=');
            splitted_img_link = splitted_img_link[1];
        val.reviewer_photo_link = val.reviewer_photo_link.replace(splitted_img_link,'w40-h40-p-rp-mo-br40');
    }
    var profile_picture = val.reviewer_photo_link == "/images/cleardot.gif" ? "<div class='sk-ww-google-reviews-profile-replacer' >"+first_character+"</div>" : "<img src='" + val.reviewer_photo_link + "' alt='profile' />";
    
    post_items+="<div class='sk_reviews_grid-content'>";
        post_items+="<div class='sk-ww-google-reviews-content review-list'>";
        post_items+="<div class='sk-ww-google-reviews-content-container'>";
 
             post_items+="<div class='sk-ww-google-reviews-reviewer'>";

                 post_items+="<div class='sk-reviewer-pic'>";
                     post_items+="<a href='" + val.reviewer_contributor_link + "' target='_blank'>"+profile_picture+"</a>";
                 post_items+="</div>"; // END sk-reviewer-pic
                 var margin_top = "";
                 if (getDsmSetting(sk_google_reviews, "show_date") != 1) {
                    margin_top = "margin-top:10px;";
                 }
                 post_items+="<div class='sk-reviewer-name-action' style='"+margin_top+"'>";
                     post_items+="<a style='word-wrap: break-word;' href='" + val.reviewer_contributor_link + "' target='_blank'><strong>" + val.reviewer_name + "</strong></a> ";
                     
                     if (getDsmSetting(sk_google_reviews, "show_date") == 1) {
                        post_items+="<div class='sk_fb_date'>";
                            post_items+= val.review_date_time;
                        post_items+="</div>";
                     }
                 post_items+="</div>"; 
 
             post_items+="</div>";

             post_items+="<div class='google-reviews-item sk-ww-google-reviews-review-text' data-link='"+ val.reviewer_link +"'>";
                post_items+="<div class='sk-ww-google-reviews-review-text-content'>";
                // stars
                post_items+="<div class='sk_fb_stars'>";
                    for(var count=1; count<=val.rating; count++){
                        post_items+=" <i class='fa fa-star' aria-hidden='true'></i>";
                    }
                post_items+="</div>";
                // review text
                post_items+="<div>";
                post_items+= review_text;
                post_items+="</div>";
                if(review_text.length > character_limit && character_limit > 0)
                    post_items+= "<div><a href='#'>"+see_more_text+"</a></div>";
             post_items+="</div>";

             if(val.owners_response && show_owners_response == 1){
                 post_items+="<div class='sk-ww-google-reviews-owners-response-text'>";
                     post_items+="<strong>" + getDsmSetting(sk_google_reviews, "response_text") + "</strong> " + val.owners_response;
                 post_items+="</div>"; 
             }
 
             if(val.reviewer_images_link && show_image == 1)
             {
                 post_items+="<div class='google-reviews-item sk-ww-google-reviews-owners-response-image'>";
 
                     val.reviewer_images_link.forEach(function(element) {
                         post_items+="<img  src='" + element + "' class='media_link' />";
                     });
                 post_items+="</div>"; // END sk-ww-google-reviews-review-image
             }

            post_items+="</div>"; // END sk-ww-google-reviews-content
        post_items+="</div>";
            
            if(getDsmSetting(sk_google_reviews,'show_view_on_google_button') == 1){
                post_items+="<a target='_blank' href='" + val.reviewer_link + "' class='sk-google-review-button-more'>";
                    post_items+="<img class='sk-google-reviews-icon' src='" + app_url + "images/google_icon20.png'/> ";
                    post_items+=getDsmSetting(sk_google_reviews,"view_on_facebook_text");
                post_items+="</a>";
            }
        post_items+="</div>"; // END sk-ww-google-reviews-content
        
        //PUPUP
        post_items+="<div class='white-popup mfp-hide sk-review-popup'>";

            
             post_items+="<div class='sk-ww-google-reviews-reviewer'>";
 
                 post_items+="<div class='sk-reviewer-pic'>";
                     post_items+="<a href='" + val.reviewer_contributor_link + "' target='_blank'>"+profile_picture+"</a>";
                 post_items+="</div>"; // END sk-reviewer-pic
 
                 post_items+="<div class='sk-reviewer-name-action'>";
                     post_items+="<a  style='word-wrap: break-word;' href='" + val.reviewer_contributor_link + "' target='_blank'><strong>" + val.reviewer_name + "</strong></a> ";
                     post_items+="<label class='sk_review_text'>"+getDsmSetting(sk_google_reviews, "reviewed_text") + "</label> <a href='" + bio.link + "' target='_blank'>" + bio.name + "</a> ";
                     post_items+="<div class='sk_fb_stars'>";
                         for(var count=1; count<=val.rating; count++){
                             post_items+=" <i class='fa fa-star' aria-hidden='true'></i>";
                         }
                         if (getDsmSetting(sk_google_reviews, "show_date") == 1) {
                            post_items+= "<a class='sk_fb_date' href='https://www.google.com/maps/contrib/" + val.contributor_id + "/place/" + val.google_place_id + "/' target='_blank'> " + val.review_date_time + "</a> ";
                         }
                     post_items+="</div>"; // END sk_fb_stars
                 post_items+="</div>"; // END sk-reviewer-name-action
                 post_items+="<hr class='sk-separator'>"; 
             post_items+="</div>"; // END sk-ww-google-reviews-reviewer
 
             post_items+="<div class='sk-ww-google-reviews-review-text-popup'>";
                 post_items+= val.review_text;
             post_items+="</div>"; // END sk-ww-google-reviews-review-text
             if(val.owners_response && show_owners_response == 1){
                 post_items+="<div class='sk-ww-google-reviews-owners-response-text-popup'>";
                     post_items+="<strong>" + getDsmSetting(sk_google_reviews, "response_text") + "</strong> " + val.owners_response;
                 post_items+="</div>"; // END sk-ww-google-reviews-review-text
             }
 
             if(val.reviewer_images_link)
             {
                 var image_width = "100%";
                 if(val.reviewer_images_link.length == 2){
                    var image_width = "49%";
                 }else if(val.reviewer_images_link.length >= 3){
                    var image_width = "32%";
                 }
                 
                 post_items+="<div class='sk-ww-google-reviews-owners-response-image'>";
                    val.reviewer_images_link.forEach(function(element) {
                         post_items+="<a href='"+element+"' target='_blank'><img  style='width: " + image_width + "' src='" + element + "' class='media_link' /></a>";
                     });
                 post_items+="</div>"; // END sk-ww-google-reviews-review-image
             }
            if(getDsmSetting(sk_google_reviews,'show_view_on_google_button') == 1){
                post_items+="<div class='sk-google-review-button-container' >";
                    post_items+="<hr class='sk-separator'>"; 
                    post_items+="<a target='_blank' href='"+val.reviewer_link+"' class='sk-google-review-button-more'>";
                        post_items+="<img class='sk-google-reviews-icon' src='"+app_url+"images/google_icon20.png'/> <span>"+getDsmSetting(sk_google_reviews,"view_on_facebook_text")+"</span>";
                    post_items+="</a>";
                post_items+="</div>";
            }
             
        post_items+="</div>"; // END sk-ww-google-reviews-content
        
    post_items+="</div>"; // END sk_reviews_grid-content
 
    return post_items;
}
 
function errorMessage(){
    var sk_error_message="";
    sk_error_message+="<ul class='sk_error_message'>";
        sk_error_message+="<li>Our system is syncing with your Google reviews, please check back later.</li>";
        sk_error_message+="<li>It usually takes only a few minutes, but might take up to 24 hours. We appreciate your patience.</li>";
        sk_error_message+="<li>We will notify you via email once your Google reviews feed is ready.</li>";
        sk_error_message+="<li>If you think there is a problem, <a target='_blank' href='https://go.crisp.chat/chat/embed/?website_id=2e3a484e-b418-4643-8dd2-2355d8eddc6b'>chat with support here</a>. We will solve it for you.</li>";
    sk_error_message+="</ul>";
    return sk_error_message;
}

function requestFeedData(sk_google_reviews){
    var embed_id=getDsmEmbedId(sk_google_reviews);
    var json_url=app_file_server_url + embed_id + ".json?nocache=" + (new Date()).getTime();

    // get feed
    jQuery.getJSON(json_url, function(data){
        original_data = data;
        loadFeed(sk_google_reviews);
    }).fail(function(e){
        generateSolutionMessage(sk_google_reviews, embed_id);
    });
}function applyMasonry(){
    $sk_reviews_grid_holder = new Masonry('.sk_reviews_grid', {
         itemSelector: '.sk_reviews_grid-item',
         columnWidth: '.sk_reviews_grid-sizer',
         percentPosition: true,
         transitionDuration: 0
     });

    var sk_google_reviews = jQuery(".sk-ww-google-reviews");
 }
 
 function fixMasonry(){
 
     setTimeout(
         function() {
             applyMasonry();
         }, 500);
 
     setTimeout(
         function() {
             applyMasonry();
         }, 1000);
 
     // make sure
     setTimeout(
         function() {
             applyMasonry();
         }, 2000);
 
     setTimeout(
         function() {
             applyMasonry();
         }, 3000);
 
     setTimeout(
         function() {
             applyMasonry();
         }, 4000);
 
     setTimeout(
         function() {
             applyMasonry();
         }, 5000);
 
     setTimeout(
         function() {
             applyMasonry();
         }, 6000);
 
     setTimeout(
         function() {
             applyMasonry();
         }, 7000);
 
     setTimeout(
         function() {
             applyMasonry();
         }, 8000);
     setTimeout(
         function() {
             applyMasonry();
         }, 9000);

     setTimeout(
         function() {
             applyMasonry();
         }, 10000);
 }function loadSliderLayout(sk_google_reviews,data){
    var column_count = getDsmSetting(sk_google_reviews,'column_count');
    column_count = parseInt(column_count);
    if(jQuery(document).width() < 480){
        column_count = 1;
    }

    else if(jQuery(document).width() < 750){
        column_count = column_count > 2 ? 2 : column_count;
    }
    var post_items="";
        post_items+="<div class='sk-google-all-reviews'>";
            if((data.length>0 || getDsmSetting(sk_google_reviews,"show_average_rating") ==1) || column_count == 1){
                

                post_items+=  "<div id='sk_google_reviews_slider' class='swiper-container swiper-layout-slider'>";
                    post_items+="<button type='button' class='swiper-button-next ' style='pointer-events: all;'>";
                    post_items+="<i class='sk-arrow sk-arrow-right'></i>";
                post_items+="</button>";
                post_items+="<button type='button' class='swiper-button-prev' style='pointer-events: all;'>";
                    post_items+="<i class='sk-arrow sk-arrow-left'></i>";
                post_items+="</button>";
                    post_items+=  "<div class='swiper-wrapper'>";
                        var data_position = 0;
                        var data_slider = data;
                        var pages = Math.ceil(data_slider.length/column_count);
                        
                        if(pages < 1){
                            pages = 1;
                        } else if(getDsmSetting(sk_google_reviews,"show_average_rating") == 1 &&
                            (column_count == 1 || column_count == 2))
                        {
                            pages = pages + 1;
                        }

                        for(var slide = 1; slide <= pages; slide++){
                            post_items+=  "<div class='swiper-slide' >";
                                post_items+="<div class='sk_reviews_grid' >";
                                    post_items+="<div class='sk_reviews_grid-sizer'></div>";
                                    if(getDsmSetting(sk_google_reviews,"show_average_rating") ==1 && slide == 1){
                                        pages = pages%getDsmSetting(sk_google_reviews, 'column_count') == 0 ? pages + 1 : pages;
                                        post_items+=getAverageRating(sk_google_reviews,data_bio);
                                    }
                                    
                                    var slide_data = getPaginationResult(sk_google_reviews,data_slider,slide,column_count);
                                    jQuery.each(slide_data, function(key, val){
                                        data_position++;
                                        post_items += "<div class='sk_reviews_grid-item' data-position='"+data_position+"'>";
                                        if(typeof val != 'undefined')
                                        post_items+=getFeedItem(val, sk_google_reviews, data_bio);
                                        post_items += "</div>";
                                    });

                                post_items += "</div>";
                            post_items += "</div>";
                        }
                    post_items+=  "</div>";
                post_items+=  "</div>";    
            }
        post_items+="</div>";

    return post_items;
}

function getPaginationResult(sk_google_reviews, user_solutions, page, column_count){

    if(getDsmSetting(sk_google_reviews, "show_average_rating") == 1 && page == 1){
        column_count = parseInt(column_count) - 1;
    }

    var start = 0;
    var end = parseInt(column_count);
    var multiplicand = page - 1;
    var return_user_solutions = [];

    if(page != 1){
        start = multiplicand * end;
        if(getDsmSetting(sk_google_reviews, "show_average_rating") == 1){
            start = start - 1;
        }
        end = start + end;
    }
    if((end - 1) > user_solutions.length){
        end = user_solutions.length;
    }
    for(var i = start; i < end; i++){
        return_user_solutions.push(user_solutions[i]);
    }
    return return_user_solutions;
}


function skSliderLayoutSettings(sk_google_reviews){
    var autoplay = false;
    var loop = false;
    if(getDsmSetting(sk_google_reviews, "autoplay") == 1){
        var delay = getDsmSetting(sk_google_reviews, "delay") * 1500;
        autoplay = {delay: delay};
        loop = true;
    }
    
    var swiper = new Swiper('.swiper-layout-slider.swiper-container', {
        loop: loop,
        autoplay: autoplay,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },

    });
}

function hoverContent(sk_google_reviews){
    sk_google_reviews.find(".sk-ww-google-reviews-review-text")
        .mouseover(function(){
            var container_height = sk_google_reviews.find(".sk-ww-google-reviews-content").height();
            
            if(jQuery(this).height() < container_height ){

                jQuery(this).css({
                    "overflow-y":"auto",
                    "overflow-x" : "hidden"
                });
            }
        }).mouseout(function(){
            jQuery(this).css({
                 "overflow-y": "hidden"
            });
    });
}

function skLayoutSliderArrowUI(sk_google_reviews){


    var thisH = 0;
    var carousel_post_height = getDsmSetting(sk_google_reviews, "post_height");
    if(carousel_post_height == 0){
        carousel_post_height = 350;
    }

    carousel_post_height = parseInt(carousel_post_height) + parseInt(getDsmSetting(sk_google_reviews, "item_content_padding"));
    sk_google_reviews.find(".sk_reviews_badge,.google-reviews-item").css({
        "height" : "auto"
    });

    sk_google_reviews.find(".sk-ww-google-reviews-content").css({
        "height" : "100%"
    });

    // add 10 for spaces
    sk_google_reviews.find(".sk_reviews_grid-content").css({
        "height" : parseInt(carousel_post_height) + 10 +"px"
    });

    hoverContent(sk_google_reviews);

    sk_google_reviews.find(".sk-ww-google-reviews-review-text-content").css({
        "width" : sk_google_reviews.find(".sk-ww-google-reviews-content-container").width()-5+"px"
    });

    sk_google_reviews.find(".sk-ww-google-reviews-owners-response-text").css({
        "width" : sk_google_reviews.find(".sk-ww-google-reviews-content-container").width()-5+"px"
    });
    
    for(var i = 0; i < jQuery(".sk-ww-google-reviews-reviewer").length; i++){
        var padding_ = parseInt(getDsmSetting(sk_google_reviews, "item_content_padding"))+60;
        if(padding_ < 70){
            padding_ = 70;
        }
        jQuery(jQuery(".sk-ww-google-reviews-reviewer")[i]).parent().find(".sk-ww-google-reviews-review-text").css({
            "height" : parseInt(carousel_post_height)-(padding_+jQuery(jQuery(".sk-ww-google-reviews-reviewer")[i]).height())+"px",
            "overflow" : "hidden"
        });
    }

    var arrow_background_color = getDsmSetting(sk_google_reviews, "arrow_background_color");
    var arrow_color = getDsmSetting(sk_google_reviews, "arrow_color");
    var arrow_opacity = getDsmSetting(sk_google_reviews, "arrow_opacity");
    sk_google_reviews.find(".swiper-button-prev i,.swiper-button-next i")
        .mouseover(function(){
            jQuery(this).css({
              "opacity":"1",
              "border-color":arrow_background_color,
            });

        }).mouseout(function(){
            jQuery(this).css({
                "border-color": arrow_color,
                "opacity":arrow_opacity
            });
    });

    sk_google_reviews.find(".swiper-button-prev i,.swiper-button-next i").css({
        "border-color": arrow_color,
        "opacity":arrow_opacity,
        "color": arrow_color 
    });
    sk_google_reviews.find(".swiper-button-spinner").css({
        "color": arrow_color
    });



    // Get the height
    var feed_h = sk_google_reviews.find('.swiper-slide-active .sk_reviews_grid').innerHeight();
    if(feed_h == null){
        feed_h = sk_google_reviews.find('.sk_reviews_grid').innerHeight();
    }
    
    // Solution for image cutting
    sk_google_reviews.find(".swiper-wrapper,.swiper-slide,.swiper-layout-slider").css({
        "height":feed_h  +"px"
    });

    sk_google_reviews.css("width","100%"); 
    
    // position button to center
    var feed_h_2 = feed_h / 2;
    sk_google_reviews.find(".swiper-button-prev,.swiper-button-next").css({
        "top":feed_h_2 +"px"
    });

    sk_google_reviews.find(".swiper-slide-active").css({
        "width" : "99%"
    });
}
function hidePopUp(){
    if(jQuery.magnificPopup){
      jQuery.magnificPopup.close();
    }
}

function showPopUp(jQuery, content_src, clicked_element){

    jQuery('.sk_selected_reviews').removeClass('sk_selected_reviews');
    jQuery('.prev_sk_google_review').remove();
    jQuery('.next_sk_google_review').remove();
    clicked_element.addClass('sk_selected_reviews');
    hidePopUp();
    
    if(typeof jQuery.magnificPopup === "undefined")
        initManificPopupPlugin(jQuery);
        
    jQuery.magnificPopup.open({
        items: { src: content_src },
        'type' : 'inline',
        closeOnBgClick : true,
        callbacks: {
            open: function() { 
                jQuery('.mfp-container').css({ 'top' : 0 });
                jQuery('.mfp-content').css({ 'vertical-align' : 'inherit' });
                jQuery('.mfp-content a').css({ 'text-decoration' : 'none' });

                var layout = jQuery('.sk-ww-google-reviews .layout').text();
            
                var post_html="";
                if(layout == 3 || clicked_element.prev('.sk_reviews_grid-item').length > 0 && clicked_element.prev('.sk_reviews_grid-item').find('.sk-review-popup').length >0){
                    post_html+="<button class='prev_sk_google_review'>";
                        post_html+="<i class='fa fa-chevron-left sk_prt_4px' aria-hidden='true'></i>";
                    post_html+="</button>";
                }

                if(layout == 3 || clicked_element.next().length > 0){
                    post_html+="<button class='next_sk_google_review'>";
                        post_html+="<i class='fa fa-chevron-right sk_plt_4px' aria-hidden='true'></i>";
                    post_html+="</button>";
                }
                jQuery('.mfp-content').find(".mfp-close").remove();

                jQuery('.mfp-content').prepend('<button title="Close (Esc)" type="button" class="mfp-close" style="right: 0px;">×</button>');
                jQuery('.mfp-content').find(".mfp-close").css({
                    "right" : parseInt(jQuery('.mfp-content').find(".white-popup").css("marginRight"))-15+"px"
                });

                jQuery('.mfp-content').prepend(post_html);

                jQuery('.mfp-content').find(".next_sk_google_review").css({
                    "right" : parseInt(jQuery('.mfp-content').find(".white-popup").css("marginRight"))-30+"px"
                });

                jQuery('.mfp-content').find(".prev_sk_google_review").css({
                    "left" : parseInt(jQuery('.mfp-content').find(".white-popup").css("marginRight"))-30+"px"
                });

            },
            close: function() {
                hidePopUp();
            }
        }
    });
}
// make widget responsive
function makeResponsive(jQuery, sk_google_reviews){

    var sk_google_reviews_width = sk_google_reviews.width();
    var grid_sizer_item = 33.33;
    var column_count = getDsmSetting(sk_google_reviews, "column_count")
    /* smartphones, iPhone, portrait 480x320 phones */
    if(sk_google_reviews_width<=320){ grid_sizer_item=100; }
 
    /* portrait e-readers (Nook/Kindle), smaller tablets @ 600 or @ 640 wide. */
    else if(sk_google_reviews_width<=481){ grid_sizer_item=100; }
 
    /* portrait tablets, portrait iPad, landscape e-readers, landscape 800x480 or 854x480 phones */
      else if(sk_google_reviews_width<=641){ grid_sizer_item=50; }
 
    /* tablet, landscape iPad, lo-res laptops ands desktops */
    else if(sk_google_reviews_width<=930){
        if(getDsmSetting(sk_google_reviews, "column_count")==1){ grid_sizer_item=100; }
        else if(getDsmSetting(sk_google_reviews, "column_count")==2){ grid_sizer_item=50; }
        else{ grid_sizer_item=33.33 }
    }
 
    // follow the setting
    else{
        if(column_count==1){ grid_sizer_item=100; }
        else if(column_count==2){ grid_sizer_item=50; }
        else if(column_count==3){ grid_sizer_item=33.33; }
        else if(column_count==4){ grid_sizer_item=25; }
        else if(column_count==5){ grid_sizer_item=20; }
        else if(column_count==6){ grid_sizer_item=16.6; }
    }

    if(jQuery(document).width() > 480 && jQuery(document).width() < 900){
         if(column_count==4){ grid_sizer_item=50; }
    }
    if(jQuery(document).width() > 900){
        if(column_count==4){ grid_sizer_item=25; }
    }

    if(column_count == 1){
        grid_sizer_item = 100;
    }
 
    sk_google_reviews.find(".sk_reviews_grid-sizer,.sk_reviews_grid-item").css({
        "width" : grid_sizer_item + "%"
    });
    // set event height for slider and grid layout

        var imgs = sk_google_reviews.find('img');
        var len = imgs.length;
        if(getDsmSetting(sk_google_reviews,'layout')==3){
            skLayoutSliderArrowUI(sk_google_reviews);
        }
        else if (getDsmSetting(sk_google_reviews,'layout')==1) {
            setReviewsFeedHeight(sk_google_reviews,true);
        }
        if(len == 0 || imgs.prop('complete')){
            setTimeout(function(){
                if(getDsmSetting(sk_google_reviews,'layout')==3){
                    skLayoutSliderArrowUI(sk_google_reviews);
                }
                else if (getDsmSetting(sk_google_reviews,'layout')==1) {
                    setReviewsFeedHeight(sk_google_reviews,true);
                }
            },50);
        }
            
        var counter = 0;
        [].forEach.call( imgs, function( img ) {
            img.addEventListener( 'load', function() {
                counter++;  
                if ( counter+1 == len ) {
                    if(getDsmSetting(sk_google_reviews,'layout')==3){
                        skLayoutSliderArrowUI(sk_google_reviews);
                    }
                    else if (getDsmSetting(sk_google_reviews,'layout')==1) {
                        setReviewsFeedHeight(sk_google_reviews,true);
                    }
                }
            }, false );
        });

        
    
}

function setReviewsFeedHeight(sk_google_reviews,change){
    if(getDsmSetting(sk_google_reviews,'layout') == 1){
    


        var thisH = 0;
        var post_height = parseInt(getDsmSetting(sk_google_reviews, 'post_height'));
        if (!post_height || isNaN(post_height)) {
            post_height = 300;
        }
        post_height = post_height + parseInt(getDsmSetting(sk_google_reviews, "item_content_padding"));

        sk_google_reviews.find(".sk_reviews_badge,.google-reviews-item").css({
            "height" : "auto"
        });

        sk_google_reviews.find(".sk-ww-google-reviews-content").css({
            "height" : "100%"
        });

        // add 10 for spaces
        sk_google_reviews.find(".sk_reviews_grid-content").css({
            "height" : parseInt(post_height) + 10 +"px"
        });

        hoverContent(sk_google_reviews);

        sk_google_reviews.find(".sk-ww-google-reviews-review-text-content").css({
            "width" : sk_google_reviews.find(".sk-ww-google-reviews-content-container").width()-5+"px"
        });

        sk_google_reviews.find(".sk-ww-google-reviews-owners-response-text").css({
            "width" : sk_google_reviews.find(".sk-ww-google-reviews-content-container").width()-5+"px"
        });
        
        for(var i = 0; i < jQuery(".sk-ww-google-reviews-reviewer").length; i++){
            var padding_ = parseInt(getDsmSetting(sk_google_reviews, "item_content_padding"))+60;
            if(padding_ < 70){
                padding_ = 70;
            }
            jQuery(jQuery(".sk-ww-google-reviews-reviewer")[i]).parent().find(".sk-ww-google-reviews-review-text").css({
                "height" : parseInt(post_height)-(padding_+jQuery(jQuery(".sk-ww-google-reviews-reviewer")[i]).height())+"px",
                "overflow" : "hidden"
            });
        }
    }
 }function applyCustomUi(jQuery, sk_google_reviews){

     // hide 'loading animation' image
     sk_google_reviews.find(".loading-img").hide();
     sk_google_reviews.find(".first_loading_animation").hide();
 
     // container width
     sk_google_reviews.css({ 'width' : '100%' });
     
        var sk_google_reviews_width=sk_google_reviews.outerWidth(true).toFixed(2);
     // change height to normal
     sk_google_reviews.css({'height' : 'auto'});
 
    // identify column count
    var column_count=sk_google_reviews.find('.column_count').text();
    if(
         /* smartphones, iPhone, portrait 480x320 phones */
         sk_google_reviews_width<=320 ||
 
          /* portrait e-readers (Nook/Kindle), smaller tablets @ 600 or @ 640 wide. */
          sk_google_reviews_width<=481 ||
 
          /* portrait tablets, portrait iPad, landscape e-readers, landscape 800x480 or 854x480 phones */
          sk_google_reviews_width<=641
    ){

        if(column_count > 1){
            column_count=2;
        }
    }
     // size settings
     var border_size=0;
     var background_color="#555555";

     var space_between_images=parseFloat(sk_google_reviews.find('.space_between_images').text());
    var margin_between_images=parseFloat(parseFloat(space_between_images).toFixed(0) / 2) - parseFloat(1);

    var total_space_between_images=(parseFloat(space_between_images).toFixed(2)*parseFloat(column_count)) + parseFloat(space_between_images);
    var pic_width=(parseFloat(sk_google_reviews_width).toFixed(0)-parseFloat(total_space_between_images).toFixed(0)) / parseFloat(column_count).toFixed(0);
    

    // container width
    sk_google_reviews.css({ 'width' : '100%' });
    // var sk_google_reviews_width=sk_google_reviews.innerWidth();
    var sk_google_reviews_width=sk_google_reviews.outerWidth(true).toFixed(2);

    // change height to normal
    sk_google_reviews.css({'height' : 'auto'});

    var column_count=sk_google_reviews.find('.column_count').text();

    // size settings
    var border_size=0;
    var background_color="#555555";
    var space_between_images=parseFloat(sk_google_reviews.find('.space_between_images').text());
    var margin_between_images=parseFloat(parseFloat(space_between_images).toFixed(0) / 2) - parseFloat(1);

    var total_space_between_images=(parseFloat(space_between_images).toFixed(2)*parseFloat(column_count)) + parseFloat(space_between_images);
    var pic_width=(parseFloat(sk_google_reviews_width).toFixed(0)-parseFloat(total_space_between_images).toFixed(0)) / parseFloat(column_count).toFixed(0);




    // font & color settings
     var font_family=sk_google_reviews.find('.font_family').text();
     var details_bg_color=sk_google_reviews.find('.details_bg_color').text();
     var details_link_color=sk_google_reviews.find('.details_link_color').text();
     var details_link_hover_color=sk_google_reviews.find('.details_link_hover_color').text();
     var bold_font_color=sk_google_reviews.find('.bold_font_color').text();
     var item_bg_color=sk_google_reviews.find('.item_bg_color').text();
     var item_font_color=sk_google_reviews.find('.item_font_color').text();
     var badge_bg_color=sk_google_reviews.find('.badge_bg_color').text();
     var badge_font_color=sk_google_reviews.find('.badge_font_color').text();
     var button_bg_color=sk_google_reviews.find('.button_bg_color').text();
     var button_text_color=sk_google_reviews.find('.button_text_color').text();
     var button_hover_bg_color=sk_google_reviews.find('.button_hover_bg_color').text();
     var button_hover_text_color=sk_google_reviews.find('.button_hover_text_color').text();
 
 
     // apply font family
     sk_google_reviews.css({
         'font-family' : font_family,
         'background-color' : details_bg_color,
         'width' : sk_google_reviews_width
     });
 
     // pop up settings
     jQuery('.sk-pop-google-videos-post').css({
         'font-family' : font_family
     });
 
     // details link
     sk_google_reviews.find('.google-videos-user-root-container a, .sk-ww-google-reviews-content a').css({
         'color' : details_link_color
     });
 
     sk_google_reviews.find(".google-videos-user-root-container a, .sk-ww-google-reviews-content a").mouseover(function() {
         $(this).css({'color' : details_link_hover_color});
     }).mouseout(function() {
         $(this).css({'color' : details_link_color});
     });
 
     // bold_font_color
     sk_google_reviews.find('.sk-ww-google-reviews-owners-response-text strong').css({
         'color' : bold_font_color
     });
 
     sk_google_reviews.find('.sk-ww-google-reviews-review-text, .sk-ww-google-reviews-owners-response-text, .sk-ww-google-reviews-content label').css({
         'color' : item_font_color,
     });

     sk_google_reviews.find('.sk-review-popup').css({
         'color' : item_font_color,
         'font-family' : font_family
     });

     
 
     // details_font_size
     sk_google_reviews.find('.sk-ww-google-reviews-review-text, .sk-ww-google-reviews-owners-response-text, .sk-ww-google-reviews-reviewer, .sk_reviews_badge').css({
         'font-size': getDsmSetting(sk_google_reviews, "details_font_size") + "px"
     });
 
     // details_all_caps
     if(getDsmSetting(sk_google_reviews, "details_all_caps")==1){
         // convert all to upper case if 1
         sk_google_reviews.find('.sk-google-review-button-more, .sk-review-popup, .sk-ww-google-reviews-review-text, .sk-ww-google-reviews-owners-response-text, .sk-ww-google-reviews-reviewer, .sk_reviews_badge').css({
             'text-transform': 'uppercase'
         });
     }

     if(getDsmSetting(sk_google_reviews, "title_all_caps")==1){
         // convert all to upper case if 1
         sk_google_reviews.find('.sk-google-place-name').css({
             'text-transform': 'uppercase'
         });
     }else{
        sk_google_reviews.find('.sk-google-place-name').css({
             'text-transform': 'none'
         });
     }
 
     // item_content_padding
     sk_google_reviews.find(".sk-ww-google-reviews-content, .badge-content").css({
         'padding' : getDsmSetting(sk_google_reviews, "item_content_padding") + "px"
     });

     sk_google_reviews.find('.sk-ww-google-reviews-owners-response-image').css({
         'padding-bottom' : getDsmSetting(sk_google_reviews, "item_content_padding") + "px"
     });
 
     // badge_bg_color
     sk_google_reviews.find('.sk_reviews_num_icon').css({
         'background-color' : "transparent",
         'color' : badge_font_color,
     });
 
     // badge_bg_color - border
     sk_google_reviews.find('.sk_reviews_badge').css({
         'border-color' : badge_bg_color,
     });
 
     // buttons
     var margin_bottom_sk_ig_load_more_posts=space_between_images;
     if(margin_bottom_sk_ig_load_more_posts==0){
         margin_bottom_sk_ig_load_more_posts=5;
     }
     sk_google_reviews.find(".sk-google-reviews-load-more-posts").css({
         'margin-bottom' : margin_bottom_sk_ig_load_more_posts + 'px'
     });
     
    sk_google_reviews.find(".sk-below-button-container").css({
        "display": "block",
        "overflow": "hidden",
        "margin": "0",
        "padding": "4.5px",
    });
     sk_google_reviews.find(".google-videos-user-container, .sk-google-reviews-load-more-posts, .sk-google-reviews-bottom-follow-btn")
         .css({
             'background-color' : button_bg_color,
             'border-color' : button_bg_color,
             'color' : button_text_color
         });
 
     sk_google_reviews.find(".google-videos-user-container, .sk-google-reviews-load-more-posts, .sk-google-reviews-bottom-follow-btn")
         .mouseover(function(){
             $(this).css({
                 'background-color' : button_hover_bg_color,
                 'border-color' : button_hover_bg_color,
                 'color' : button_hover_text_color
             });
         }).mouseout(function(){
             $(this).css({
                 'background-color' : button_bg_color,
                 'border-color' : button_bg_color,
                 'color' : button_text_color
             });
         });
 
     // bottom buttons container
     var padding_sk_ig_bottom_btn_container=margin_between_images;
     if(padding_sk_ig_bottom_btn_container==0){
         padding_sk_ig_bottom_btn_container=5;
     }
     sk_google_reviews.find(".sk-google-reviews-bottom-btn-container").css({
         'padding' : padding_sk_ig_bottom_btn_container + 'px'
     });
 
     sk_google_reviews.find(".sk_fb_stars").css({
         'color' : getDsmSetting(sk_google_reviews, "star_color")
     });
 
     sk_google_reviews.find('.sk_reviews_badge a').css({
         'color' : getDsmSetting(sk_google_reviews, "item_font_color")
     });

     sk_google_reviews.find(".sk-google-reviews-write-review-btn").css({
        "color" : getDsmSetting(sk_google_reviews, "write_a_review_button_text_color"),
        "background-color" : getDsmSetting(sk_google_reviews, "write_a_review_button_background_color")
     });

     sk_google_reviews.find(".sk-google-reviews-write-review-btn").mouseover(function() {
         $(this).css({'color' : getDsmSetting(sk_google_reviews, "write_a_review_button_text_color")});
     }).mouseout(function() {
         $(this).css({'color' : getDsmSetting(sk_google_reviews, "write_a_review_button_text_color")});
     });

     sk_google_reviews.find(".sk_reviews_grid-content").css({
         'background-color' : item_bg_color,
         'color' : getDsmSetting(sk_google_reviews, "item_font_color"),
         'border-radius' : getDsmSetting(sk_google_reviews, "item_border_radius") + "px"
     });

     sk_google_reviews.find(".sk_reviews_grid-item").css({
         'cursor' : 'pointer'
     });
 
     makeResponsive(jQuery, sk_google_reviews);
 
     // if one column layout
     if(getDsmSetting(sk_google_reviews, "one_column_layout")==1){
         sk_google_reviews.find(".sk_reviews_grid-item").css({
             'width' : '100%'
         });
     }

     // if three column layout
     if(getDsmSetting(sk_google_reviews, "layout") == 3){
        skLayoutSliderArrowUI(sk_google_reviews);
     }
 
     sk_google_reviews.find('.badge-content').css({
         'background-color' : badge_bg_color,
         'color' : badge_font_color,
     });

     // watermark css
         jQuery('.sk_powered_by a').css({
             'background-color' : getDsmSetting(sk_google_reviews, "details_bg_color"),
             'color' : getDsmSetting(sk_google_reviews, "item_font_color"),
             'font-size' : getDsmSetting(sk_google_reviews, "details_font_size"),
         });
         sk_google_reviews.find('.sk_powered_by').css({ 'margin-bottom' : space_between_images + 'px' });

         sk_google_reviews.css({ 'height' : 'auto' });
 
     // apply custom css
    jQuery('head').append('<style type="text/css">' + getDsmSetting(sk_google_reviews, "custom_css")  + '</style>');
    
    var href = window.location.href;
    if(href && (href.indexOf('sunvalley') != -1 || href.indexOf('localtesting') != -1)){
        sk_google_reviews.closest('section').css('justify-content','unset');
        sk_google_reviews.closest('.content-wrapper').css('justify-content','unset');
        sk_google_reviews.closest('.content-wrapper').css('padding','0');
        sk_google_reviews.closest('.content').attr('style','width:80% !important;margin: 0 auto !important');
    }
    apply100PercentWidth(sk_google_reviews,sk_google_reviews_width);
    applyBadgeStyle(sk_google_reviews);
    applyPopUpColors(sk_google_reviews);

    if(getDsmSetting(sk_google_reviews, "links_clickable") == 0){
        sk_google_reviews.find('a').not('.tutorial_link, .sk-google-review-button-more').removeAttr("href");
    }

    
 }

 function applyBadgeStyle(sk_google_reviews){

    sk_google_reviews.find('.sk_reviews_badge_container .sk-badge-name').css({
        "background-color": "transparent",
        "color":getDsmSetting(sk_google_reviews, "badge_font_color")
    });

    sk_google_reviews.find('.sk_reviews_badge_container .sk-badge-name').find("div, .sk-google-reviews-badge-info").css({
        "background-color": "transparent",
        "color":getDsmSetting(sk_google_reviews, "badge_font_color")
    });
 }


function apply100PercentWidth(sk_google_reviews,sk_google_reviews_width)
 {
    var grid_item = sk_google_reviews.find('.sk_reviews_grid-item');
    var length    = grid_item.length;
    

    if(length > 1){
        sk_google_reviews.find(".sk-below-button-container").css({
         'width' : (sk_google_reviews_width > 640 ? sk_google_reviews_width -11 : sk_google_reviews_width)  +"px",
        });
    }
    if(length == 1)
    {
      grid_item.css('width','100%');
    }
 }

 function applyPopUpColors(sk_google_reviews){

    var pop_up_bg_color = getDsmSetting(sk_google_reviews, "pop_up_bg_color");
    var pop_up_font_color = getDsmSetting(sk_google_reviews, "pop_up_font_color");
    var pop_up_link_color = getDsmSetting(sk_google_reviews, "pop_up_link_color");
    sk_google_reviews.find('.sk-review-popup').css({
        'color':pop_up_font_color,
        'background':pop_up_bg_color
    });

    sk_google_reviews.find('.sk-review-popup a').css({
        'color':pop_up_link_color
    });
}function loadGoogleFont(font_family){
    // load google font
    var web_safe_fonts = [
        "Inherit", "Impact, Charcoal, sans-serif", "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
        "Century Gothic, sans-serif", "'Lucida Sans Unicode', 'Lucida Grande', sans-serif", "Verdana, Geneva, sans-serif",
        "Copperplate, 'Copperplate Gothic Light', fantasy", "'Courier New', Courier, monospace", "Georgia, Serif"
    ];
    if(font_family && !web_safe_fonts.includes(font_family)){ 
        loadCssFile("https://fonts.googleapis.com/css?family=" + font_family); 
    }    
}

function addDescriptiveTagAttributes(_sk){
    _sk.find('a').each(function(i,v){
        var title = jQuery(v).text();
        jQuery(v).attr('title',title);
    });
    _sk.find('img').each(function(i,v){
        var src = jQuery(v).attr('src');
        jQuery(v).attr('alt',src);
    });
}

function getClientId(){
    var _gaCookie = document.cookie.match(/(^|[;,]\s?)_ga=([^;,]*)/);
    if(_gaCookie) return _gaCookie[2].match(/\d+\.\d+$/)[0];
}

function getSkEmbedId(sk_class) {
    var embed_id = sk_class.attr('embed-id');
    if (embed_id == undefined) { embed_id = sk_class.attr('data-embed-id'); }
    return embed_id;
}

function getSkSetting(sk_class, key) {
    return sk_class.find("div." + key).text();
}

function setCookieSameSite() {
    document.cookie = "AC-C=ac-c;expires=Fri, 31 Dec 2025 23:59:59 GMT;path=/;HttpOnly;SameSite=Lax";
}

setCookieSameSite();

function getIEVersion() {
    var sAgent = window.navigator.userAgent;
    var Idx = sAgent.indexOf("MSIE");

    // If IE, return version number.
    if (Idx > 0)
        return parseInt(sAgent.substring(Idx + 5, sAgent.indexOf(".", Idx)));

    // If IE 11 then look for Updated user agent string.
    else if (!!navigator.userAgent.match(/Trident\/7\./))
        return 11;
    else
        return 0; //It is not IE
}

function isSafariBrowser() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
        if (ua.indexOf('chrome') > -1) {
            return 0; // Chrome
        } else {
            return 1; // Safari
        }
    }
}

if (getIEVersion() > 0 || isSafariBrowser() > 0) {
    /* Load script from url and calls callback once it's loaded */
    loadIEScript('https://cdn.jsdelivr.net/bluebird/3.5.0/bluebird.min.js');
    loadIEScript('https://cdnjs.cloudflare.com/ajax/libs/fetch/2.0.3/fetch.js');
}

function loadIEScript(url) {

    /* Load script from url and calls callback once it's loaded */
    var scriptTag = document.createElement('script');
    scriptTag.setAttribute("type", "text/javascript");
    scriptTag.setAttribute("src", url);

    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);
}

function kFormatter(num) {
    return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)
}

function sk_increaseView(user_info) {
    if (!user_info)
        return;

    // this function must always be trigger
    var update_views_url = "https://views.accentapi.com/add_view.php?user_id=0&embed_id=" + user_info.embed_id;
    if (app_url.includes("local") && sk_app_url) {
        update_views_url = sk_app_url + "views.accentapi.com/add_view.php?user_id=0&embed_id=" + user_info.embed_id;
    }

    jQuery.ajax(update_views_url);
    
}

function isTooDarkColor(hexcolor) {
    
    var r = parseInt(hexcolor.substr(1, 2), 16);
    var g = parseInt(hexcolor.substr(3, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    
    if (hexcolor.indexOf('rgb') != -1) {
        let rgbstr = hexcolor;
        let v = getRGB(rgbstr);
        r = v[0];
        g = v[1];
        b = v[2];
    }
    b = isNaN(b) ? 0 : b;
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    // Return new color if to dark, else return the original
    if (yiq < 60) {
    }
    else {
    }

    return yiq < 60 ? true : false;
}

function linkify(html) {
    var temp_text = html.split("https://www.").join("https://");
    temp_text = temp_text.split("www.").join("https://www.");
    
    var exp = /((href|src)=["']|)(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return temp_text.replace(exp, function () {
        return arguments[1] ?
            arguments[0] :
            "<a href=\"" + arguments[3] + "\">" + arguments[3] + "</a>"
    });
}

function skGetEnvironmentUrls(folder_name) {
    // auto detect live and dev version
    var scripts = document.getElementsByTagName("script");
    var scripts_length = scripts.length;
    var search_result = -1;
    var other_result = -1;
    var app_url = "https://widgets.sociablekit.com/";
    var app_backend_url = "https://api.accentapi.com/v1/";
    var app_file_server_url = "https://data.accentapi.com/feed/";
    var sk_app_url = "https://sociablekit.com/app/";
    var sk_api_url = "https://api.sociablekit.com/";

    for (var i = 0; i < scripts_length; i++) {
        var src_str = scripts[i].getAttribute('src');
        if (src_str != null) {
            var other_folder = "";
            if (folder_name == 'facebook-page-playlist') {
                other_folder = 'facebook-page-playlists';
            }
            else if (folder_name == 'linkedin-page-posts') {
                other_folder = 'linkedin-page-post';
            }
            else if (folder_name == 'linkedin-profile-posts') {
                other_folder = 'linkedin-profile-post';
            }
            else if (folder_name == 'facebook-hashtag-posts') {
                other_folder = 'facebook-hashtag-feed';
            }
            else if (folder_name == 'facebook-page-events') {
                other_folder = 'facebook-events';
            }
            else if (folder_name == 'facebook-page-posts') {
                other_folder = 'facebook-feed';
                if (document.querySelector(".sk-ww-facebook-feed")) {
                    var element = document.getElementsByClassName("sk-ww-facebook-feed")[0];
                    element.classList.add("sk-ww-facebook-page-posts");
                }
            }
            other_result = src_str.search(other_folder);
            search_result = src_str.search(folder_name);
            // app-dev found if greater than or equal to 1
            if (search_result >= 1 || other_result >= 1) {
                var src_arr = src_str.split(folder_name);
                app_url = src_arr[0];

                // replace if displaysocialmedia.com
                app_url = app_url.replace("displaysocialmedia.com", "sociablekit.com");
                // get app backend url
                if (app_url.search("local") >= 1) {
                    app_backend_url = "http://localhost:3000/v1/";
                    app_url = "https://localtesting.com/SociableKIT_Widgets/";
                    app_file_server_url = "https://localtesting.com/SociableKIT_FileServer/feed/";
                    sk_app_url = "https://localtesting.com/SociableKIT/";
                    sk_api_url = "http://127.0.0.1:8000/";
                }
                else {
                    app_url = "https://widgets.sociablekit.com/";
                }
            }
        }
    }

    return {
        "app_url": app_url,
        "app_backend_url": app_backend_url,
        "app_file_server_url": app_file_server_url,
        "sk_api_url": sk_api_url,
        "sk_app_url": sk_app_url
    };
}

function changeBackSlashToBR(text) {
    if (text) {

        for (var i = 1; i <= 10; i++) {
            text = text.replace('\n', '</br>');
        }
    }
    return text;
}

function sKGetScrollbarWidth() {

    // Creating invisible container
    var outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // forcing scrollbar to appear
    outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    var inner = document.createElement('div');
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    var scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
}
async function showUrlData(element, url,post_id, type="", show_thumbnail=1) {
    element.hide();

    var read_one_url = app_file_server_url.replace("feed", "url-tags") + post_id + ".json?nocache=" + (new Date()).getTime();
    fetch(read_one_url, { method: 'get' })
    .then(async response => {
        if (response.ok) {
            return response.json()
        }
        else{
            var free_data_url = app_file_server_url.replace("feed/", "get_fresh_url_tags.php") + '?post_id='+post_id+'&url='+url;
            response = await jQuery.ajax(free_data_url);
            displayUrlData(response, element, type, show_thumbnail);
            return response;
        }
    })
    .then(response => {
        if (response != undefined) {
            displayUrlData(response, element, type, show_thumbnail);
        }
    });
}

async function displayUrlData(response, element, type, show_thumbnail=1) {
    var meta_holder = jQuery(element);
    var html = "";
    if (!response || response.error) {
        if(meta_holder.html()){
            meta_holder.show();
        }
        return;
    }
    if (response.message && response.message == "Data not available. Please try again.") {
        return;
    }
    
    if (response.messages && response.messages.length > 0 && 
        response.messages[0] == "PDF files that are over 10Mb are not supported by Google Docs Viewer") {
        var data = response.url;
        if(response.url){
            data = response.url.replace("https://", "").split("/");
        }
        if(data.length > 0){
            if(data.length > 1){
                response.title = data[data.length - 1];
            }
            response.description = data[0].replace("www.", "");
        }
    }

    html += "<a href='" + response.url + "' link-only target='_blank'>";
        html += "<div class='sk-link-article-container' style='background: #eeeeee;color: black !important; font-weight: bold !important; border-radius: 2px; border: 1px solid #c3c3c3; box-sizing: border-box; word-wrap: break-word;'>";
            if (response.thumbnail_url && show_thumbnail == 1) {
                html += "<image alt='No alternative text description for this image' class='sk-link-article-image sk_post_img_link' onerror='this.style.display=\"none\"' src='" + response.thumbnail_url + "'/>";
            }

            if (response.title) {
                html += "<div class='sk-link-article-title' style='padding: 8px;'>" + response.title + "</div>";
            }
            if (type && type == 6) {
                if (response.description && response.description.length > 0) {
                    response.description = response.description.length > 140 ? response.description.substring(0, 140) + ' ...' : response.description;
                }
            }
            if(response.description && response.description.indexOf("[vc_row]") !== -1 && response.url){

                var pathArray = response.url.split( '/' );
                var protocol = pathArray[0];
                if(pathArray.length > 2){
                    var host = pathArray[2];
                    var url = protocol + '//' + host;
                    html+="<div class='sk-link-article-description' style='padding: 8px;color: grey;font-weight: 100;font-size: 14px;'>" + url + "</div>";
                }
            }
            else if (response.description) {
                html += "<div class='sk-link-article-description' style='padding: 8px;color: #000000;font-weight: 100;font-size: 14px;'>" + response.description + "</div>";
            }
            else if(response.url && response.url.includes('instagram.com/p/')){
                html += "<image style='padding: 8px;' alt='No alternative text description for this image' class='sk-ig-default' onerror='this.style.display=\"none\"' src='https://i1.wp.com/sociablekit.com/wp-content/uploads/2019/01/instagram.png'/>";
                html += "<div class='sk-link-article-description' style='padding: 8px;margin-left:15%;color: #000000;font-weight: 600;font-size: 14px;'>View this post in instagram</div>";
                html += "<div class='sk-link-article-description' style='padding: 0px 8px ;margin-left:15%;margin-bottom:10px;color: #000000;font-weight: 100;font-size: 10px;'>"+response.url+"</div>";
            }
        html += "</div>";
    html += "</a>";
    
    /*if(response.html && response.html.indexOf(`</script>`) !== -1){
        html = response.html.split(`\\`).join("");
    }*/
    meta_holder.html(html);

    meta_holder.css('display', 'block');
    meta_holder.css('margin-bottom', '15px');
    meta_holder.find('.sk-ig-default').closest('.sk-link-article-container').css('display', 'inline-block');
    meta_holder.find('.sk-ig-default').closest('.sk-link-article-container').css('width', '100%');
    meta_holder.find('.sk-ig-default').css('width', '20%');
    meta_holder.find('.sk-ig-default').css('float', 'left');
    applyMasonry();
}
// Slugify a string
function slugifyString(str){

    str = str.replace(/^\s+|\s+$/g, '');

    // Make the string lowercase
    str = str.toLowerCase();

    // Remove accents, swap ñ for n, etc
    var from = "ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;";
    var to   = "AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------";
    for (var i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    // Remove invalid chars
    str = str.replace(/[^a-z0-9 -]/g, '') 
    // Collapse whitespace and replace by -
    .replace(/\s+/g, '-') 
    // Collapse dashes
    .replace(/-+/g, '-'); 

    return str;
}

function skGetBranding(sk_, user_info) {
    var html = "";
    if (!user_info)
        return;


    var slugify_string = "";

    if(user_info.solution_name){
        slugify_string = slugifyString(user_info.solution_name);
        user_info.tutorial_link = "https://www.sociablekit.com/tutorials/embed-"+ slugify_string +"-website/";
        if(user_info.website_builder){
            user_info.tutorial_link = "https://www.sociablekit.com/tutorials/embed-"+ slugify_string;
            slugify_string = slugifyString(user_info.website_builder);
            user_info.tutorial_link = user_info.tutorial_link+"-"+slugify_string;
        }
    } 
    if(user_info.type == 39){
        user_info.tutorial_link = "https://www.sociablekit.com/tutorials/embed-google-my-business-photos-website/";
    }
    
    if(user_info.type == 9){
        user_info.tutorial_link = "https://www.sociablekit.com/sync-facebook-page-events-to-google-calendar/";
    }
    else if(user_info.type == 26){
        user_info.tutorial_link = "https://www.sociablekit.com/how-to-sync-facebook-group-events-to-google-calendar-on-website/";
    }
    
 
    if (user_info.show_branding && user_info.show_branding == 1) { // SK 2 and below
        var fontFamily = getSkSetting(sk_, "font_family");
        var link_color = getSkSetting(sk_, "details_link_color");
        var details_bg_color =  getSkSetting(sk_, "details_bg_color");
        if(link_color == ""){
            link_color = "rgb(52, 128, 220)";
        }
        if (details_bg_color 
            && isTooDarkColor(link_color) == false 
            && isTooDarkColor(details_bg_color) == false) {
            // set default link color
            link_color = '#3480dc';
        }
        var temporary_tutorial_link = user_info.tutorial_link;
        if(temporary_tutorial_link.endsWith("/") == false){
            temporary_tutorial_link = temporary_tutorial_link + "/";
        }
        html += "<div class='sk_branding' style='padding:10px; display:block; text-align:center; text-decoration: none !important; color:#555; font-family:" + fontFamily + "; font-size:15px;'>";
            html += "<a class='tutorial_link' href='"+temporary_tutorial_link+"' target='_blank' style='text-underline-position:under; color:" + link_color + ";font-size:15px;'>";
                html += user_info.solution_name + " <i class='fa fa-bolt'></i> by SociableKIT";
            html += "</a>";
        html += "</div>";
    }
    return html;
}

function getRGB(rgbstr) {
    return rgbstr.substring(4, rgbstr.length-1)
         .replace(/ /g, '')
         .replace('(', '')
         .split(',');
}
  

function freeTrialEndedMessage (solution_info) {
    var sk_error_message = "";
    sk_error_message += "<ul class='sk_error_message'>";
    sk_error_message += "<li><a href='"+solution_info.tutorial_link+"' target='_blank'>Customized "+solution_info.solution_name+" feed by SociableKIT</a></li>";
    sk_error_message += "<li>If you’re the owner of this website, there’s something wrong with your account.</li>";
    sk_error_message += "<li>Please contact support now.</li>";
    sk_error_message += "</ul>";
    return sk_error_message;
}

function isFreeTrialEnded(start_date){
    var start_date = new Date(start_date);
    var current_date = new Date();
    var difference = current_date.getTime() - start_date.getTime();
    difference = parseInt(difference / (1000 * 60 * 60 * 24));
    
    return difference > 7 ? true : false;
}

function unableToLoadSKErrorMessage(solution_info, additional_error_messages) {
    var sk_error_message ="<ul class='sk_error_message'>";
            sk_error_message += "<li><a href='"+solution_info.tutorial_link+"' target='_blank'>Customized "+solution_info.solution_name+" feed by SociableKIT</a></li>";
            sk_error_message +="<li>Unable to load " + solution_info.solution_name + ".</li>";
            for(var i = 0; i < additional_error_messages.length; i++){
                sk_error_message += additional_error_messages[i];
            }
            sk_error_message +="<li>If you think there is a problem, <a target='_blank' href='https://go.crisp.chat/chat/embed/?website_id=2e3a484e-b418-4643-8dd2-2355d8eddc6b'>chat with support here</a>. We will solve it for you.</li>";
        sk_error_message +="</ul>";

    return sk_error_message;
}


function widgetValidation(_sk, data){
    if(data.user_info){
        var user_info = data.user_info;
        if(user_info.status == 6 && user_info.start_date){
            var start_date = new Date(user_info.start_date).getTime();
            var current_date = new Date().getTime();
            var difference = current_date - start_date;
            difference = parseInt(difference / (1000 * 60 * 60 * 24));
            user_info.show_feed = difference > 7 ? false : true;
        }
        else if(user_info.status == 7 && user_info.cancellation_date){
            var cancellation_date = new Date(user_info.cancellation_date).getTime();
            var current_date = new Date().getTime();
            user_info.show_feed = current_date > cancellation_date ? false : true;
        }
        else if(user_info.status == 0 || user_info.status ==  2 || user_info.status ==  10){
            user_info.show_feed = false;
        }

        if(!user_info.show_feed){
            var sk_error_message = generateBlueMessage(_sk,user_info);
            _sk.find(".first_loading_animation").hide();
            _sk.html(sk_error_message);
        }
        return user_info.show_feed;
    }
}

function generateBlueMessage(_sk,user_info){
    var tutorial_link = "";
    if(user_info.solution_name){
        var slugify_string = slugifyString(user_info.solution_name);
        tutorial_link = "https://www.sociablekit.com/tutorials/embed-"+ slugify_string +"-website/";
    }
    if(user_info.type == 9){
        tutorial_link = "https://www.sociablekit.com/sync-facebook-page-events-to-google-calendar/";
    }
    else if(user_info.type == 26){
        tutorial_link = "https://www.sociablekit.com/how-to-sync-facebook-group-events-to-google-calendar-on-website/";
    }
    
    var sk_error_message = "";
    if(user_info.show_feed == false) {
        if(!user_info.message || user_info.message == ""){
            var sk_error_message  = "<ul class='sk_error_message'>";
                sk_error_message  += "<li><a href='"+ tutorial_link +"' target='_blank'>"+user_info.solution_name+" powered by SociableKIT</a></li>";
                sk_error_message  += "<li>If you’re the owner of this website or SociableKIT account used, we found some errors with your account.</li>";
                sk_error_message  += "<li>Please login your SociableKIT account to fix it.</li>";
            sk_error_message  += "</ul>";
            user_info.message = sk_error_message;
        }
        sk_error_message = user_info.message;
    }
    else if (user_info.solution_name == null && user_info.type == null && user_info.start_date == null) {
        sk_error_message ="<p class='sk_error_message'>";
        sk_error_message+="The SociableKIT solution does not exist. If you think this is a mistake, please contact support.";
        sk_error_message+="</p>";
    }
    else if(user_info.to_encode == 1){
        var styles = "style='text-align: center !important; margin-top: 50px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 30px; color: #555555; padding: 20px 45px; border-radius: 3px;'";
        sk_error_message="<div "+styles+">";
        sk_error_message+="<div style='width: auto; display: inline-block;'><i class='fa fa-spinner fa-pulse'></i></div> <div style='width: auto; display: inline-block;'>" + user_info.solution_name+" will appear soon. Please check back later!</div>";
        sk_error_message+="</div>";
    }
    else{
        sk_error_message ="<ul class='sk_error_message'>";
        sk_error_message += "<li><a href='"+tutorial_link+"' target='_blank'>Customized "+user_info.solution_name+" feed by SociableKIT</a></li>";
        sk_error_message+="<li>Our system is syncing with your "+user_info.solution_name+" feed, please check back later.</li>";
        if(user_info.type == 5){
            var username = getDsmSetting(_sk,'username');
            sk_error_message += "<li>Make sure your instagram account <a target='_blank' href='https://www.instagram.com/"+username+"' target='_blank'><b>@"+username+"</b></a> is connected.</li>";
        }
        sk_error_message+="<li>It usually takes only a few minutes, but might take up to 24 hours. We appreciate your patience.</li>";
        sk_error_message+="<li>We will notify you via email once your "+user_info.solution_name+" feed is ready.</li>";
        sk_error_message+="<li>If you think there is a problem, <a target='_blank' href='https://go.crisp.chat/chat/embed/?website_id=2e3a484e-b418-4643-8dd2-2355d8eddc6b'>chat with support here</a>. We will solve it for you.</li>";
        sk_error_message+="</ul>";
    }
    return sk_error_message;
}

function generateSolutionMessage(_sk, embed_id){
    var json_url = sk_api_url+"api/user_embed/info/"+embed_id;
    var sk_error_message = "";
    jQuery.getJSON(json_url, function(data){
        var sk_error_message = generateBlueMessage(_sk,data);
        _sk.find(".first_loading_animation").hide();
        _sk.html(sk_error_message);
    }).fail(function(e){
        console.log(e);
    });
}

function copyInput(copy_button, copy_input){

	// orig button label
	var copy_button_orig_html=copy_button.html();

	// select contents
	copy_input.select();

	try {

		// copy content
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';

		if(msg=='successful'){

			// change button html
			copy_button.html("<i class='fa fa-clipboard'></i> Copied!");

			// button go back to orig html
			setTimeout(function(){
				copy_button.html(copy_button_orig_html);
			}, 3000);

		}

		else{ alert('Copying text command was ' + msg + '.'); }
	}

	catch (err) { alert('Oops, unable to copy.'); }
}

function getDefaultLinkedInPageProfilePicture(profile_picture){
    if(profile_picture && profile_picture.indexOf("data:image/gif") != -1) {
        profile_picture = "https://gmalcilk.sirv.com/iamge.JPG";
    }
    return profile_picture;
}function translateMonthName(eng_month_name, sk_fb_group_event){
     var month_name = "";
 
     if(eng_month_name=="JAN"){ month_name=getDsmSetting(sk_fb_group_event, "jan"); }
     else if(eng_month_name=="FEB"){ month_name=getDsmSetting(sk_fb_group_event, "feb"); }
     else if(eng_month_name=="MAR"){ month_name=getDsmSetting(sk_fb_group_event, "mar"); }
     else if(eng_month_name=="APR"){ month_name=getDsmSetting(sk_fb_group_event, "apr"); }
     else if(eng_month_name=="MAY"){ month_name=getDsmSetting(sk_fb_group_event, "may"); }
     else if(eng_month_name=="JUN"){ month_name=getDsmSetting(sk_fb_group_event, "jun"); }
     else if(eng_month_name=="JUL"){ month_name=getDsmSetting(sk_fb_group_event, "jul"); }
     else if(eng_month_name=="AUG"){ month_name=getDsmSetting(sk_fb_group_event, "aug"); }
     else if(eng_month_name=="SEP"){ month_name=getDsmSetting(sk_fb_group_event, "sep"); }
     else if(eng_month_name=="OCT"){ month_name=getDsmSetting(sk_fb_group_event, "oct"); }
     else if(eng_month_name=="NOV"){ month_name=getDsmSetting(sk_fb_group_event, "nov"); }
     else if(eng_month_name=="DEC"){ month_name=getDsmSetting(sk_fb_group_event, "dec"); }
 
     return month_name;
 }
 
 function translateDayName(eng_day_name, sk_fb_group_event){
     var day_name = "";
    
     if(eng_day_name=="Sun"){ day_name=getDsmSetting(sk_fb_group_event, "sun"); }
     else if(eng_day_name=="Mon"){ day_name=getDsmSetting(sk_fb_group_event, "mon"); }
     else if(eng_day_name=="Tue"){ day_name=getDsmSetting(sk_fb_group_event, "tue"); }
     else if(eng_day_name=="Wed"){ day_name=getDsmSetting(sk_fb_group_event, "wed"); }
     else if(eng_day_name=="Thu"){ day_name=getDsmSetting(sk_fb_group_event, "thu"); }
     else if(eng_day_name=="Fri"){ day_name=getDsmSetting(sk_fb_group_event, "fri"); }
     else if(eng_day_name=="Sat"){ day_name=getDsmSetting(sk_fb_group_event, "sat"); }
     return day_name;
 }

function getDayMonthTranslation(translation, replace){
    if(translation=="Croatian"){ return getCroatianDayMonth(replace); }
    else if(translation=="Italian"){ return getItalianDayMonth(replace); }
    else if(translation=="Spanish"){ return getSpanishDayMonth(replace); }
    else if(translation=="Norwegian"){ return getNorwegianDayMonth(replace); }
    else if(translation=="Filipino"){ return getFilipinoDayMonth(replace); }
    else if(translation=="French"){ return getFrenchDayMonth(replace); }
    else if(translation=="German"){ return getGermanDayMonth(replace); }
    else if(translation=="Polish"){ return getPolishDayMonth(replace); }
    else if(translation=="Russian"){ return getRussianDayMonth(replace); }
    else if(translation=="Faroese"){ return getFaroeseDayMonth(replace); }
    else if(translation=="Portuguese"){ return getPortugueseDayMonth(replace); }
    else if(translation=="Danish"){ return getDanishDayMonth(replace); }
    else if(translation=="Dutch"){ return getDutchDayMonth(replace); }
    else if(translation=="Swedish"){ return getSwedishDayMonth(replace); }
    else if(translation=="Hungarian"){ return getHungarianDayMonth(replace); }
    else if(translation=="Hebrew"){ return getHebrewDayMonth(replace); }
    else if(translation=="Slovak"){ return getSlovakDayMonth(replace); }
    else if(translation=="English - US" || translation == "English - UK"){ return getEnglishDayMonth(replace); }
    else { return replace; } // english already
}

function getEnglishDayMonth(replace){
    return replace;
}

function getHebrewDayMonth(replace){
    replace=str_replace("Sunday", "ראשון", replace) ? str_replace("Sunday", "ראשון", replace) : replace;
    replace=str_replace("Monday", "שני", replace) ? str_replace("Monday", "שני", replace) : replace;
    replace=str_replace("Tuesday", "שלישי", replace) ? str_replace("Tuesday", "שלישי", replace) : replace;
    replace=str_replace("Wednesday", "רביעי", replace) ? str_replace("Wednesday", "רביעי", replace) : replace;
    replace=str_replace("Thursday", "חמישי", replace) ? str_replace("Thursday", "חמישי", replace) : replace;
    replace=str_replace("Friday", "שישי", replace) ? str_replace("Friday", "שישי", replace) : replace;
    replace=str_replace("Saturday", "שבת", replace) ? str_replace("Saturday", "שבת", replace) : replace;
    
    replace=str_replace("January", "ינואר", replace) ? str_replace("January", "ינואר", replace) : replace;
    replace=str_replace("February", "פברואר", replace) ? str_replace("February", "פברואר", replace) : replace;
    replace=str_replace("March", "מרץ", replace) ? str_replace("March", "מרץ", replace) : replace;
    replace=str_replace("April", "אפריל", replace) ? str_replace("April", "אפריל", replace) : replace;
    replace=str_replace("May", "מאי", replace) ? str_replace("May", "מאי", replace) : replace;
    replace=str_replace("June", "יוני", replace) ? str_replace("June", "יוני", replace) : replace;
    replace=str_replace("July", "יולי", replace) ? str_replace("July", "יולי", replace) : replace;
    replace=str_replace("August", "אוגוסט", replace) ? str_replace("August", "אוגוסט", replace) : replace;
    replace=str_replace("September", "ספטמבר", replace) ? str_replace("September", "ספטמבר", replace) : replace;
    replace=str_replace("October", "אוקטובר", replace) ? str_replace("October", "אוקטובר", replace) : replace;
    replace=str_replace("November", "נובמבר", replace) ? str_replace("November", "נובמבר", replace) : replace;
    replace=str_replace("December", "דצמבר", replace) ? str_replace("December", "דצמבר", replace) : replace;
    

    return replace;
}

function getHungarianDayMonth(replace){

    replace=str_replace("Sunday", "Vas", replace) ? str_replace("Sunday", "Vas", replace) : replace;
    replace=str_replace("Monday", "Hét", replace) ? str_replace("Monday", "Hét", replace) : replace;
    replace=str_replace("Tuesday", "Kedd", replace) ? str_replace("Tuesday", "Kedd", replace) : replace;
    replace=str_replace("Wednesday", "Sze", replace) ? str_replace("Wednesday", "Sze", replace) : replace;
    replace=str_replace("Thursday", "Csü", replace) ? str_replace("Thursday", "Csü", replace) : replace;
    replace=str_replace("Friday", "Pén", replace) ? str_replace("Friday", "Pén", replace) : replace;
    replace=str_replace("Saturday", "Szo", replace) ? str_replace("Saturday", "Szo", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "Már", replace) ? str_replace("March", "Már", replace) : replace;
    replace=str_replace("April", "Ápr", replace) ? str_replace("April", "Ápr", replace) : replace;
    replace=str_replace("May", "Máj", replace) ? str_replace("May", "Máj", replace) : replace;
    replace=str_replace("June", "Jún", replace) ? str_replace("June", "Jún", replace) : replace;
    replace=str_replace("July", "Júl", replace) ? str_replace("July", "Júl", replace) : replace;
    replace=str_replace("August", "August", replace) ? str_replace("August", "August", replace) : replace;
    replace=str_replace("September", "Sze", replace) ? str_replace("September", "Sze", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "December", replace) ? str_replace("December", "December", replace) : replace;
    

    return replace;
}

function getSwedishDayMonth(replace){

    replace=str_replace("Sunday", "Sön", replace) ? str_replace("Sunday", "Sön", replace) : replace;
    replace=str_replace("Monday", "Mån", replace) ? str_replace("Monday", "Mån", replace) : replace;
    replace=str_replace("Tuesday", "Tis", replace) ? str_replace("Tuesday", "Tis", replace) : replace;
    replace=str_replace("Wednesday", "Ons", replace) ? str_replace("Wednesday", "Ons", replace) : replace;
    replace=str_replace("Thursday", "Tors", replace) ? str_replace("Thursday", "Tors", replace) : replace;
    replace=str_replace("Friday", "Fre", replace) ? str_replace("Friday", "Fre", replace) : replace;
    replace=str_replace("Saturday", "Lör", replace) ? str_replace("Saturday", "Lör", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "Mars", replace) ? str_replace("March", "Mars", replace) : replace;
    replace=str_replace("April", "April", replace) ? str_replace("April", "April", replace) : replace;
    replace=str_replace("May", "Maj", replace) ? str_replace("May", "Maj", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "August", replace) ? str_replace("August", "August", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "September", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "December", replace) ? str_replace("December", "December", replace) : replace;
    

    return replace;
}


function getNorwegianDayMonth(replace){

    replace=str_replace("Sunday", "Søn", replace) ? str_replace("Sunday", "Søn", replace) : replace;
    replace=str_replace("Monday", "Man", replace) ? str_replace("Monday", "Man", replace) : replace;
    replace=str_replace("Tuesday", "Tir", replace) ? str_replace("Tuesday", "Tir", replace) : replace;
    replace=str_replace("Wednesday", "Ons", replace) ? str_replace("Wednesday", "Ons", replace) : replace;
    replace=str_replace("Thursday", "Tor", replace) ? str_replace("Thursday", "Tor", replace) : replace;
    replace=str_replace("Friday", "Fre", replace) ? str_replace("Friday", "Fre", replace) : replace;
    replace=str_replace("Saturday", "Lør", replace) ? str_replace("Saturday", "Lør", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "March", replace) ? str_replace("March", "March", replace) : replace;
    replace=str_replace("April", "April", replace) ? str_replace("April", "April", replace) : replace;
    replace=str_replace("May", "Mai", replace) ? str_replace("May", "Mai", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "August", replace) ? str_replace("August", "August", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "September", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "Des", replace) ? str_replace("December", "Des", replace) : replace;
    

    return replace;
}

// filipino translation
function getFilipinoDayMonth(replace){
    
    replace=str_replace("Sunday", "Lin", replace) ? str_replace("Sunday", "Lin", replace) : replace;
    replace=str_replace("Monday", "Lun", replace) ? str_replace("Monday", "Lun", replace) : replace;
    replace=str_replace("Tuesday", "March", replace) ? str_replace("Tuesday", "March", replace) : replace;
    replace=str_replace("Wednesday", "Miy", replace) ? str_replace("Wednesday", "Miy", replace) : replace;
    replace=str_replace("Thursday", "Huw", replace) ? str_replace("Thursday", "Huw", replace) : replace;
    replace=str_replace("Friday", "Biy", replace) ? str_replace("Friday", "Biy", replace) : replace;
    replace=str_replace("Saturday", "Sab", replace) ? str_replace("Saturday", "Sab", replace) : replace;
    
    replace=str_replace("January", "Enero", replace) ? str_replace("January", "Enero", replace) : replace;
    replace=str_replace("February", "Pebrero", replace) ? str_replace("February", "Pebrero", replace) : replace;
    replace=str_replace("March", "Marso", replace) ? str_replace("March", "Marso", replace) : replace;
    replace=str_replace("April", "Abril", replace) ? str_replace("April", "Abril", replace) : replace;
    replace=str_replace("May", "Mayo", replace) ? str_replace("May", "Mayo", replace) : replace;
    replace=str_replace("June", "Hunyo", replace) ? str_replace("June", "Hunyo", replace) : replace;
    replace=str_replace("July", "Hulyo", replace) ? str_replace("July", "Hulyo", replace) : replace;
    replace=str_replace("August", "Agosto", replace) ? str_replace("August", "Agosto", replace) : replace;
    replace=str_replace("September", "Setyembre", replace) ? str_replace("September", "Setyembre", replace) : replace;
    replace=str_replace("October", "Oktubre", replace) ? str_replace("October", "Oktubre", replace) : replace;
    replace=str_replace("November", "Nobyembre", replace) ? str_replace("November", "Nobyembre", replace) : replace;
    replace=str_replace("December", "Desyembre", replace) ? str_replace("December", "Desyembre", replace) : replace;
    

    return replace;
}

// croatian translation
function getCroatianDayMonth(replace){
    
    replace=str_replace("Sunday", "Ned", replace) ? str_replace("Sunday", "Ned", replace) : replace;
    replace=str_replace("Monday", "Pon", replace) ? str_replace("Monday", "Pon", replace) : replace;
    replace=str_replace("Tuesday", "Uto", replace) ? str_replace("Tuesday", "Uto", replace) : replace;
    replace=str_replace("Wednesday", "Sri", replace) ? str_replace("Wednesday", "Sri", replace) : replace;
    replace=str_replace("Thursday", "Čet", replace) ? str_replace("Thursday", "Čet", replace) : replace;
    replace=str_replace("Friday", "Pet", replace) ? str_replace("Friday", "Pet", replace) : replace;
    replace=str_replace("Saturday", "Sub", replace) ? str_replace("Saturday", "Sub", replace) : replace;
    
    replace=str_replace("January", "Sij", replace) ? str_replace("January", "Sij", replace) : replace;
    replace=str_replace("February", "Velj", replace) ? str_replace("February", "Velj", replace) : replace;
    replace=str_replace("March", "Ozu", replace) ? str_replace("March", "Ozu", replace) : replace;
    replace=str_replace("April", "Tra", replace) ? str_replace("April", "Tra", replace) : replace;
    replace=str_replace("May", "Svi", replace) ? str_replace("May", "Svi", replace) : replace;
    replace=str_replace("June", "Lip", replace) ? str_replace("June", "Lip", replace) : replace;
    replace=str_replace("July", "Srp", replace) ? str_replace("July", "Srp", replace) : replace;
    replace=str_replace("August", "Kol", replace) ? str_replace("August", "Kol", replace) : replace;
    replace=str_replace("September", "Ruj", replace) ? str_replace("September", "Ruj", replace) : replace;
    replace=str_replace("October", "Lis", replace) ? str_replace("October", "Lis", replace) : replace;
    replace=str_replace("November", "Stu", replace) ? str_replace("November", "Stu", replace) : replace;
    replace=str_replace("December", "Pro", replace) ? str_replace("December", "Pro", replace) : replace;
    replace=str_replace("month ago", "prije mjeseca", replace) ? str_replace("month ago", "prije mjeseca", replace) : replace;
    replace=str_replace("months ago", "prije mjeseca", replace) ? str_replace("months ago", "prije mjeseca", replace) : replace;
    replace=str_replace("day ago", "prije dana", replace) ? str_replace("day ago", "prije dana", replace) : replace;
    replace=str_replace("days ago", "prije dana", replace) ? str_replace("days ago", "prije dana", replace) : replace;
    replace=str_replace("year ago", "prije godinu", replace) ? str_replace("year ago", "prije godinu", replace) : replace;
    replace=str_replace("years ago", "prije godinu", replace) ? str_replace("years ago", "prije godinu", replace) : replace;
    

    return replace;
}

// croatian translation
function getItalianDayMonth(replace){
    
    replace=str_replace("Sunday", "Domenica", replace) ? str_replace("Sunday", "Domenica", replace) : replace;
    replace=str_replace("Monday", "Lunedi", replace) ? str_replace("Monday", "Lunedi", replace) : replace;
    replace=str_replace("Tuesday", "Martedì", replace) ? str_replace("Tuesday", "Martedì", replace) : replace;
    replace=str_replace("Wednesday", "Mercoledì", replace) ? str_replace("Wednesday", "Mercoledì", replace) : replace;
    replace=str_replace("Thursday", "Giovedì", replace) ? str_replace("Thursday", "Giovedì", replace) : replace;
    replace=str_replace("Friday", "Venerdì", replace) ? str_replace("Friday", "Venerdì", replace) : replace;
    replace=str_replace("Saturday", "Sabato", replace) ? str_replace("Saturday", "Sabato", replace) : replace;
    
    replace=str_replace("January", "Gennaio", replace) ? str_replace("January", "Gennaio", replace) : replace;
    replace=str_replace("February", "Febbraio", replace) ? str_replace("February", "Febbraio", replace) : replace;
    replace=str_replace("March", "Marzo", replace) ? str_replace("March", "Marzo", replace) : replace;
    replace=str_replace("April", "Aprile", replace) ? str_replace("April", "Aprile", replace) : replace;
    replace=str_replace("May", "Maggio", replace) ? str_replace("May", "Maggio", replace) : replace;
    replace=str_replace("June", "Giugno", replace) ? str_replace("June", "Giugno", replace) : replace;
    replace=str_replace("July", "Luglio", replace) ? str_replace("July", "Luglio", replace) : replace;
    replace=str_replace("August", "Agosto", replace) ? str_replace("August", "Agosto", replace) : replace;
    replace=str_replace("September", "Settembre", replace) ? str_replace("September", "Settembre", replace) : replace;
    replace=str_replace("October", "Ottobre", replace) ? str_replace("October", "Ottobre", replace) : replace;
    replace=str_replace("November", "Novembre", replace) ? str_replace("November", "Novembre", replace) : replace;
    replace=str_replace("December", "Dicembre", replace) ? str_replace("December", "Dicembre", replace) : replace;
    replace=str_replace("month ago", "un mese fa", replace) ? str_replace("month ago", "un mese fa", replace) : replace;
    replace=str_replace("months ago", "un mese fa", replace) ? str_replace("months ago", "un mese fa", replace) : replace;
    replace=str_replace("day ago", "giorno fa", replace) ? str_replace("day ago", "giorno fa", replace) : replace;
    replace=str_replace("days ago", "giorno fa", replace) ? str_replace("days ago", "giorno fa", replace) : replace;
    replace=str_replace("year ago", "anno fa", replace) ? str_replace("year ago", "anno fa", replace) : replace;
    replace=str_replace("years ago", "anno fa", replace) ? str_replace("years ago", "anno fa", replace) : replace;
    

    return replace;
}

// spanish translation
function getSpanishDayMonth(replace){

    replace=str_replace("Sunday", "Dom", replace) ? str_replace("Sunday", "Dom", replace) : replace;
    replace=str_replace("Monday", "Lun", replace) ? str_replace("Monday", "Lun", replace) : replace;
    replace=str_replace("Tuesday", "March", replace) ? str_replace("Tuesday", "March", replace) : replace;
    replace=str_replace("Wednesday", "Mié", replace) ? str_replace("Wednesday", "Mié", replace) : replace;
    replace=str_replace("Thursday", "Jue", replace) ? str_replace("Thursday", "Jue", replace) : replace;
    replace=str_replace("Friday", "Vie", replace) ? str_replace("Friday", "Vie", replace) : replace;
    replace=str_replace("Saturday", "Sáb", replace) ? str_replace("Saturday", "Sáb", replace) : replace;
    
    replace=str_replace("January", "Ene", replace) ? str_replace("January", "Ene", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "March", replace) ? str_replace("March", "March", replace) : replace;
    replace=str_replace("April", "Abr", replace) ? str_replace("April", "Abr", replace) : replace;
    replace=str_replace("May", "May", replace) ? str_replace("May", "May", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "Ago", replace) ? str_replace("August", "Ago", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "September", replace) : replace;
    replace=str_replace("October", "October", replace) ? str_replace("October", "October", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "Dic", replace) ? str_replace("December", "Dic", replace) : replace;
    replace=str_replace("month ago", "hace un mes", replace) ? str_replace("month ago", "hace un mes", replace) : replace;
    replace=str_replace("months ago", "hace un mes", replace) ? str_replace("months ago", "hace un mes", replace) : replace;
    
    replace=str_replace("day ago", "Hace día", replace) ? str_replace("day ago", "Hace día", replace) : replace;
    replace=str_replace("days ago", "Hace día", replace) ? str_replace("days ago", "Hace día", replace) : replace;
    replace=str_replace("year ago", "Hace años", replace) ? str_replace("year ago", "Hace años", replace) : replace;
    replace=str_replace("years ago", "Hace años", replace) ? str_replace("years ago", "Hace años", replace) : replace;
    return replace;
}

// french translation
function getFrenchDayMonth(replace){

    replace=str_replace("Sunday", "dim", replace) ? str_replace("Sunday", "dim", replace) : replace;
    replace=str_replace("Monday", "lun", replace) ? str_replace("Monday", "lun", replace) : replace;
    replace=str_replace("Tuesday", "mar", replace) ? str_replace("Tuesday", "mar", replace) : replace;
    replace=str_replace("Wednesday", "mer", replace) ? str_replace("Wednesday", "mer", replace) : replace;
    replace=str_replace("Thursday", "jeu", replace) ? str_replace("Thursday", "jeu", replace) : replace;
    replace=str_replace("Friday", "ven", replace) ? str_replace("Friday", "ven", replace) : replace;
    replace=str_replace("Saturday", "sam", replace) ? str_replace("Saturday", "sam", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "Fév", replace) ? str_replace("February", "Fév", replace) : replace;
    replace=str_replace("March", "March", replace) ? str_replace("March", "March", replace) : replace;
    replace=str_replace("April", "Avr", replace) ? str_replace("April", "Avr", replace) : replace;
    replace=str_replace("May", "Mai", replace) ? str_replace("May", "Mai", replace) : replace;
    replace=str_replace("June", "Juin", replace) ? str_replace("June", "Juin", replace) : replace;
    replace=str_replace("July", "Jui", replace) ? str_replace("July", "Jui", replace) : replace;
    replace=str_replace("August", "Août", replace) ? str_replace("August", "Août", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "September", replace) : replace;
    replace=str_replace("October", "October", replace) ? str_replace("October", "October", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "Déc", replace) ? str_replace("December", "Déc", replace) : replace;
    replace=str_replace("month ago", "il y a un mois", replace) ? str_replace("month ago", "il y a un mois", replace) : replace;
    replace=str_replace("months ago", "il y a un mois", replace) ? str_replace("months ago", "il y a un mois", replace) : replace;

    replace=str_replace("day ago", "il y a un jour", replace) ? str_replace("day ago", "il y a un jour", replace) : replace;
    replace=str_replace("days ago", "il y a un jour", replace) ? str_replace("days ago", "il y a un jour", replace) : replace;
    replace=str_replace("year ago", "il y'a un an", replace) ? str_replace("year ago", "il y'a un an", replace) : replace;
    replace=str_replace("years ago", "il y'a un an", replace) ? str_replace("years ago", "il y'a un an", replace) : replace;

    return replace;
}

function getDayMonthWeekWordTranslation(translation, replace){
    if(translation=="French"){ return frenchDayMonthWeekTranslation(replace); }
    else { return replace; } // english already
}

function frenchDayMonthWeekTranslation(replace){
    if(replace.indexOf("week") !== -1 || replace.indexOf("w") !== -1){     
        replace=str_replace("week", " semaine", replace) ? str_replace("week", " semaine", replace) : replace;
        replace=str_replace("w", " semaine", replace) ? str_replace("w", " semaine", replace) : replace;   
    } else if(replace.indexOf("month") !== -1 || replace.indexOf("m") !== -1 || replace.indexOf("mo") !== -1){
        if(replace.indexOf("month") !== -1){
            replace=str_replace("month", " mois", replace) ? str_replace("month", " mois", replace) : replace;
        } else if(replace.indexOf("mo") !== -1){
            replace=str_replace("mo", " mois", replace) ? str_replace("mo", " mois", replace) : replace;
        } else if(replace.indexOf("mo") !== -1){
            replace=str_replace("m", " mois", replace) ? str_replace("m", " mois", replace) : replace;
        }
        return replace;
    } else if(replace.indexOf("day") !== -1 || replace.indexOf("d") !== -1){
        replace=str_replace("day", " jour", replace) ? str_replace("day", " jour", replace) : replace;
        replace=str_replace("d", " jour", replace) ? str_replace("d", " jour", replace) : replace;
    } else if(replace.indexOf("year") !== -1 || replace.indexOf("y") !== -1){
        replace=str_replace("year", " années", replace) ? str_replace("y", " années", replace) : replace;
        replace=str_replace("y", " années", replace) ? str_replace("y", " années", replace) : replace;
    }
    return parseInt(replace) > 1 ? replace + 's' : replace;
}

// german translation
function getGermanDayMonth(replace){

    replace=str_replace("Sunday", "Son", replace) ? str_replace("Sunday", "Son", replace) : replace;
    replace=str_replace("Monday", "Monday", replace) ? str_replace("Monday", "Monday", replace) : replace;
    replace=str_replace("Tuesday", "Die", replace) ? str_replace("Tuesday", "Die", replace) : replace;
    replace=str_replace("Wednesday", "Mit", replace) ? str_replace("Wednesday", "Mit", replace) : replace;
    replace=str_replace("Thursday", "Don", replace) ? str_replace("Thursday", "Don", replace) : replace;
    replace=str_replace("Friday", "Fre", replace) ? str_replace("Friday", "Fre", replace) : replace;
    replace=str_replace("Saturday", "Sam", replace) ? str_replace("Saturday", "Sam", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "Mär", replace) ? str_replace("March", "Mär", replace) : replace;
    replace=str_replace("April", "April", replace) ? str_replace("April", "April", replace) : replace;
    replace=str_replace("May", "Mai", replace) ? str_replace("May", "Mai", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "August", replace) ? str_replace("August", "August", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "September", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "Dez", replace) ? str_replace("December", "Dez", replace) : replace;
    
    replace=str_replace("month ago", "letzten Monat", replace) ? str_replace("month ago", "letzten Monat", replace) : replace;
    replace=str_replace("months ago", "letzten Monat", replace) ? str_replace("months ago", "letzten Monat", replace) : replace;


    replace=str_replace("day ago", "Vor Tagen", replace) ? str_replace("day ago", "Vor Tagen", replace) : replace;
    replace=str_replace("days ago", "Vor Tagen", replace) ? str_replace("days ago", "Vor Tagen", replace) : replace;
    replace=str_replace("year ago", "Jahre zuvor", replace) ? str_replace("year ago", "Jahre zuvor", replace) : replace;
    replace=str_replace("years ago", "Jahre zuvor", replace) ? str_replace("years ago", "Jahre zuvor", replace) : replace;
    
    return replace;
}

// polish translation
function getPolishDayMonth(replace){

    replace=str_replace("Sunday", "Nie", replace) ? str_replace("Sunday", "Nie", replace) : replace;
    replace=str_replace("Monday", "Pon", replace) ? str_replace("Monday", "Pon", replace) : replace;
    replace=str_replace("Tuesday", "Wto", replace) ? str_replace("Tuesday", "Wto", replace) : replace;
    replace=str_replace("Wednesday", "Śro", replace) ? str_replace("Wednesday", "Śro", replace) : replace;
    replace=str_replace("Thursday", "Czw", replace) ? str_replace("Thursday", "Czw", replace) : replace;
    replace=str_replace("Friday", "Pią", replace) ? str_replace("Friday", "Pią", replace) : replace;
    replace=str_replace("Saturday", "Sob", replace) ? str_replace("Saturday", "Sob", replace) : replace;
    
    replace=str_replace("January", "Sty", replace) ? str_replace("January", "Sty", replace) : replace;
    replace=str_replace("February", "Lut", replace) ? str_replace("February", "Lut", replace) : replace;
    replace=str_replace("March", "March", replace) ? str_replace("March", "March", replace) : replace;
    replace=str_replace("April", "Kwi", replace) ? str_replace("April", "Kwi", replace) : replace;
    replace=str_replace("May", "Maj", replace) ? str_replace("May", "Maj", replace) : replace;
    replace=str_replace("June", "Cze", replace) ? str_replace("June", "Cze", replace) : replace;
    replace=str_replace("July", "Lip", replace) ? str_replace("July", "Lip", replace) : replace;
    replace=str_replace("August", "Sie", replace) ? str_replace("August", "Sie", replace) : replace;
    replace=str_replace("September", "Wrz", replace) ? str_replace("September", "Wrz", replace) : replace;
    replace=str_replace("October", "Paź", replace) ? str_replace("October", "Paź", replace) : replace;
    replace=str_replace("November", "Lis", replace) ? str_replace("November", "Lis", replace) : replace;
    replace=str_replace("December", "Gru", replace) ? str_replace("December", "Gru", replace) : replace;
    
    replace=str_replace("month ago", "miesiąc temu", replace) ? str_replace("month ago", "miesiąc temu", replace) : replace;
    replace=str_replace("months ago", "miesiąc temu", replace) ? str_replace("months ago", "miesiąc temu", replace) : replace;
    return replace;
}

// polish translation
function getRussianDayMonth(replace){

    replace=str_replace("Sunday", "ВС", replace) ? str_replace("Sunday", "ВС", replace) : replace;
    replace=str_replace("Monday", "ПН", replace) ? str_replace("Monday", "ПН", replace) : replace;
    replace=str_replace("Tuesday", "ВТ", replace) ? str_replace("Tuesday", "ВТ", replace) : replace;
    replace=str_replace("Wednesday", "СР", replace) ? str_replace("Wednesday", "СР", replace) : replace;
    replace=str_replace("Thursday", "ЧТ", replace) ? str_replace("Thursday", "ЧТ", replace) : replace;
    replace=str_replace("Friday", "ПТ", replace) ? str_replace("Friday", "ПТ", replace) : replace;
    replace=str_replace("Saturday", "СБ", replace) ? str_replace("Saturday", "СБ", replace) : replace;
    
    replace=str_replace("January", "Янв", replace) ? str_replace("January", "Янв", replace) : replace;
    replace=str_replace("February", "Февр", replace) ? str_replace("February", "Февр", replace) : replace;
    replace=str_replace("March", "Март", replace) ? str_replace("March", "Март", replace) : replace;
    replace=str_replace("April", "Апр", replace) ? str_replace("April", "Апр", replace) : replace;
    replace=str_replace("May", "Май", replace) ? str_replace("May", "Май", replace) : replace;
    replace=str_replace("June", "Июнь", replace) ? str_replace("June", "Июнь", replace) : replace;
    replace=str_replace("July", "Июль", replace) ? str_replace("July", "Июль", replace) : replace;
    replace=str_replace("August", "Авг", replace) ? str_replace("August", "Авг", replace) : replace;
    replace=str_replace("September", "Сент", replace) ? str_replace("September", "Сент", replace) : replace;
    replace=str_replace("October", "Октб", replace) ? str_replace("October", "Октб", replace) : replace;
    replace=str_replace("November", "Нояб", replace) ? str_replace("November", "Нояб", replace) : replace;
    replace=str_replace("December", "Дек", replace) ? str_replace("December", "Дек", replace) : replace;
    
    replace=str_replace("month ago", "месяц назад", replace) ? str_replace("month ago", "месяц назад", replace) : replace;
    replace=str_replace("months ago", "месяц назад", replace) ? str_replace("months ago", "месяц назад", replace) : replace;
    return replace;
}

// faroese translation
function getFaroeseDayMonth(replace){

    replace=str_replace("Sunday", "Sunday", replace) ? str_replace("Sunday", "Sunday", replace) : replace;
    replace=str_replace("Monday", "Mán", replace) ? str_replace("Monday", "Mán", replace) : replace;
    replace=str_replace("Tuesday", "Týs", replace) ? str_replace("Tuesday", "Týs", replace) : replace;
    replace=str_replace("Wednesday", "Mik", replace) ? str_replace("Wednesday", "Mik", replace) : replace;
    replace=str_replace("Thursday", "Hós", replace) ? str_replace("Thursday", "Hós", replace) : replace;
    replace=str_replace("Friday", "Frí", replace) ? str_replace("Friday", "Frí", replace) : replace;
    replace=str_replace("Saturday", "Ley", replace) ? str_replace("Saturday", "Ley", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "March", replace) ? str_replace("March", "March", replace) : replace;
    replace=str_replace("April", "April", replace) ? str_replace("April", "April", replace) : replace;
    replace=str_replace("May", "Mai", replace) ? str_replace("May", "Mai", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "August", replace) ? str_replace("August", "August", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "September", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "Des", replace) ? str_replace("December", "Des", replace) : replace;
    
    return replace;
}

// portuguese translation
function getPortugueseDayMonth(replace){

    replace=str_replace("Sunday", "Dom", replace) ? str_replace("Sunday", "Dom", replace) : replace;
    replace=str_replace("Monday", "Seg", replace) ? str_replace("Monday", "Seg", replace) : replace;
    replace=str_replace("Tuesday", "Ter", replace) ? str_replace("Tuesday", "Ter", replace) : replace;
    replace=str_replace("Wednesday", "Qua", replace) ? str_replace("Wednesday", "Qua", replace) : replace;
    replace=str_replace("Thursday", "Qui", replace) ? str_replace("Thursday", "Qui", replace) : replace;
    replace=str_replace("Friday", "Sex", replace) ? str_replace("Friday", "Sex", replace) : replace;
    replace=str_replace("Saturday", "Sáb", replace) ? str_replace("Saturday", "Sáb", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "Fev", replace) ? str_replace("February", "Fev", replace) : replace;
    replace=str_replace("March", "March", replace) ? str_replace("March", "March", replace) : replace;
    replace=str_replace("April", "Abr", replace) ? str_replace("April", "Abr", replace) : replace;
    replace=str_replace("May", "Mai", replace) ? str_replace("May", "Mai", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "Ago", replace) ? str_replace("August", "Ago", replace) : replace;
    replace=str_replace("September", "Set", replace) ? str_replace("September", "Set", replace) : replace;
    replace=str_replace("October", "Out", replace) ? str_replace("October", "Out", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "Dez", replace) ? str_replace("December", "Dez", replace) : replace;
    
    replace=str_replace("month ago", "mês atrás", replace) ? str_replace("month ago", "mês atrás", replace) : replace;
    replace=str_replace("months ago", "mês atrás", replace) ? str_replace("months ago", "mês atrás", replace) : replace;
    return replace;
}

// danish translation
function getDanishDayMonth(replace){

    replace=str_replace("Sunday", "Søn", replace) ? str_replace("Sunday", "Søn", replace) : replace;
    replace=str_replace("Monday", "Man", replace) ? str_replace("Monday", "Man", replace) : replace;
    replace=str_replace("Tuesday", "Tir", replace) ? str_replace("Tuesday", "Tir", replace) : replace;
    replace=str_replace("Wednesday", "Ons", replace) ? str_replace("Wednesday", "Ons", replace) : replace;
    replace=str_replace("Thursday", "Tor", replace) ? str_replace("Thursday", "Tor", replace) : replace;
    replace=str_replace("Friday", "Fre", replace) ? str_replace("Friday", "Fre", replace) : replace;
    replace=str_replace("Saturday", "Lør", replace) ? str_replace("Saturday", "Lør", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "March", replace) ? str_replace("March", "March", replace) : replace;
    replace=str_replace("April", "April", replace) ? str_replace("April", "April", replace) : replace;
    replace=str_replace("May", "Maj", replace) ? str_replace("May", "Maj", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "August", replace) ? str_replace("August", "August", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "Sep", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "December", replace) ? str_replace("December", "December", replace) : replace;
    
    replace=str_replace("month ago", "måned siden", replace) ? str_replace("month ago", "måned siden", replace) : replace;
    replace=str_replace("months ago", "måned siden", replace) ? str_replace("months ago", "måned siden", replace) : replace;
    return replace;
}

// dutch translation
function getDutchDayMonth(replace){

    replace=str_replace("Sunday", "Zon", replace) ? str_replace("Sunday", "Zon", replace) : replace;
    replace=str_replace("Monday", "Maa", replace) ? str_replace("Monday", "Maa", replace) : replace;
    replace=str_replace("Tuesday", "Din", replace) ? str_replace("Tuesday", "Din", replace) : replace;
    replace=str_replace("Wednesday", "Woe", replace) ? str_replace("Wednesday", "Woe", replace) : replace;
    replace=str_replace("Thursday", "Don", replace) ? str_replace("Thursday", "Don", replace) : replace;
    replace=str_replace("Friday", "Vri", replace) ? str_replace("Friday", "Vri", replace) : replace;
    replace=str_replace("Saturday", "Zat", replace) ? str_replace("Saturday", "Zat", replace) : replace;
    
    replace=str_replace("January", "January", replace) ? str_replace("January", "January", replace) : replace;
    replace=str_replace("February", "February", replace) ? str_replace("February", "February", replace) : replace;
    replace=str_replace("March", "Mrt", replace) ? str_replace("March", "Mrt", replace) : replace;
    replace=str_replace("April", "April", replace) ? str_replace("April", "April", replace) : replace;
    replace=str_replace("May", "Mei", replace) ? str_replace("May", "Mei", replace) : replace;
    replace=str_replace("June", "June", replace) ? str_replace("June", "June", replace) : replace;
    replace=str_replace("July", "July", replace) ? str_replace("July", "July", replace) : replace;
    replace=str_replace("August", "August", replace) ? str_replace("August", "August", replace) : replace;
    replace=str_replace("September", "September", replace) ? str_replace("September", "September", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "November", replace) ? str_replace("November", "November", replace) : replace;
    replace=str_replace("December", "December", replace) ? str_replace("December", "December", replace) : replace;
    
    replace=str_replace("month ago", "maand geleden", replace) ? str_replace("month ago", "maand geleden", replace) : replace;
    replace=str_replace("months ago", "maand geleden", replace) ? str_replace("months ago", "maand geleden", replace) : replace;
    return replace;
}

function getSlovakDayMonth(replace){

    replace=str_replace("Sunday", "Nedeľa", replace) ? str_replace("Sunday", "Nedeľa", replace) : replace;
    replace=str_replace("Monday", "Pondelok", replace) ? str_replace("Monday", "Pondelok", replace) : replace;
    replace=str_replace("Tuesday", "Utorok", replace) ? str_replace("Tuesday", "Utorok", replace) : replace;
    replace=str_replace("Wednesday", "Streda", replace) ? str_replace("Wednesday", "Streda", replace) : replace;
    replace=str_replace("Thursday", "Štvrtok", replace) ? str_replace("Thursday", "Štvrtok", replace) : replace;
    replace=str_replace("Friday", "Piatok", replace) ? str_replace("Friday", "Piatok", replace) : replace;
    replace=str_replace("Saturday", "Sobota", replace) ? str_replace("Saturday", "Sobota", replace) : replace;

    replace=str_replace("January", "Jan", replace) ? str_replace("January", "Jan", replace) : replace;
    replace=str_replace("February", "Feb", replace) ? str_replace("February", "Feb", replace) : replace;
    replace=str_replace("March", "Mar", replace) ? str_replace("March", "Mar", replace) : replace;
    replace=str_replace("April", "Apr", replace) ? str_replace("April", "Apr", replace) : replace;
    replace=str_replace("May", "Máj", replace) ? str_replace("May", "Máj", replace) : replace;
    replace=str_replace("June", "Jún", replace) ? str_replace("June", "Jún", replace) : replace;
    replace=str_replace("July", "Júl", replace) ? str_replace("July", "Júl", replace) : replace;
    replace=str_replace("August", "Aug", replace) ? str_replace("August", "Aug", replace) : replace;
    replace=str_replace("September", "Sep", replace) ? str_replace("September", "Sep", replace) : replace;
    replace=str_replace("October", "Okt", replace) ? str_replace("October", "Okt", replace) : replace;
    replace=str_replace("November", "Nov", replace) ? str_replace("November", "Nov", replace) : replace;
    replace=str_replace("December", "Dec", replace) ? str_replace("December", "Dec", replace) : replace;
    
    replace=str_replace("month ago", "pred mesiacom", replace) ? str_replace("month ago", "pred mesiacom", replace) : replace;
    replace=str_replace("months ago", "pred mesiacom", replace) ? str_replace("months ago", "pred mesiacom", replace) : replace;
    return replace;
}

function str_replace(to_replace, replacement, original){
    var res = original;
    res = res.split(to_replace).join(replacement);
    return res;
}

function makeFullMonthName(replace){
    replace = str_replace("Jan", "January", replace);
    replace = str_replace("JAN", "January", replace);
    replace = str_replace("Feb", "February", replace);
    replace = str_replace("FEB", "February", replace);
    replace = str_replace("Mar", "March", replace);
    replace = str_replace("MAR", "March", replace);
    replace = str_replace("Apr", "April", replace);
    replace = str_replace("APR", "April", replace);
    replace = str_replace("May", "May", replace);
    replace = str_replace("MAY", "May", replace);
    replace = str_replace("Jun", "June", replace);
    replace = str_replace("JUN", "June", replace);
    replace = str_replace("Jul", "July", replace);
    replace = str_replace("JUL", "July", replace);
    replace = str_replace("Aug", "August", replace);
    replace = str_replace("AUG", "August", replace);
    replace = str_replace("Sep", "September", replace);
    replace = str_replace("SEP", "September", replace);
    replace = str_replace("Oct", "October", replace);
    replace = str_replace("OCT", "October", replace);
    replace = str_replace("Nov", "November", replace);
    replace = str_replace("NOV", "November", replace);
    replace = str_replace("Dec", "December", replace);
    replace = str_replace("DEC", "December", replace);
    return replace;
}// our main function
function main(){
    function loadSettingsData(sk_google_reviews,json_settings_url,json_feed_url){
        fetch(json_feed_url, { method: 'get' })
            .then(function (response) {

                if(!response.ok){
                    loadSettingsData(sk_google_reviews,json_settings_url,json_settings_url)
                    return;
                }
                response.json().then(function (data) {
                    var settings_data = data;
                    original_data = data;
                    if(data.settings){
                        settings_data = data.settings;
                        settings_data.type = 22;
                    }
                    if(!settings_data.type){
                        loadSettingsData(sk_google_reviews,json_settings_url,json_settings_url)
                        return;
                    }
                    settings_data.type = 22;
               
                // load google font
                loadGoogleFont(data.font_family);
                 
                if(settings_data.show_feed==false){
 
                    sk_google_reviews.find('.loading-img').hide();
                    sk_google_reviews.prepend(settings_data.message);
                }
 
                else{
 
                    // save some settings in html
                    var settings_html="";
 
                    // settings for easy access
                    settings_html+="<div class='display-none sk-settings' style='display:none;'>";
                         jQuery.each(settings_data, function(key, value){ settings_html+="<div class='" + key + "'>" + value + "</div>"; });
                    settings_html+="</div>";
 
                    if(sk_google_reviews.find('.sk-settings').length){
                        // no settings
                    }
                    else{
                        sk_google_reviews.prepend(settings_html);
                    }

                    if(getDsmSetting(sk_google_reviews,'layout') == 3){
                        loadCssFile(app_url + "libs/swiper/swiper.min.css");
                        loadCssFile(app_url + "libs/swiper/swiper.css?v=ranndomchars");
                    }
                    
                    // empty settings
                    settings_html="";
                    if(data.settings){ 
                        loadFeed(sk_google_reviews);
                    }
                    else{ 
                        requestFeedData(sk_google_reviews)
                    }
                 }
 
             });
            })
            .catch(function (err) {
                loadSettingsData(sk_google_reviews,json_settings_url,json_settings_url);
            });
        }
     // manipulate page using jQuery
     jQuery(document).ready(function($) {
         jQuery('.sk-ww-google-reviews').each(function() {
            // know what to show
            var sk_google_reviews=jQuery(this);
 
            // get embed id
            var embed_id=getDsmEmbedId(sk_google_reviews);

            // change height to be more than current window
            var new_sk_google_reviews_height=jQuery(window).height() + 100;
            sk_google_reviews.height(new_sk_google_reviews_height);
 
            // get settings
            var json_settings_url=app_file_server_url.replace('feed','') + "settings/"+embed_id+"/settings.json?nocache=" + (new Date()).getTime();
            var json_feed_url = app_file_server_url + embed_id + ".json?nocache=" + (new Date()).getTime();

            loadSettingsData(sk_google_reviews,json_settings_url,json_feed_url);
         });
 
         // resize elements in real time
         jQuery(window).resize(function(){
             jQuery('.sk-ww-google-reviews').each(function(){
                 var sk_google_reviews=jQuery(this);
                 applyCustomUi(jQuery, sk_google_reviews);
             });
         });
 
        jQuery(document).on('click', '.swiper-prev-arrow,.swiper-next-arrow', function(){
            var sk_google_reviews = $('.sk-ww-google-reviews');
            skLayoutSliderArrowUI(sk_google_reviews);
            
        });

        jQuery(document).on('click', '.prev_sk_google_review', function(){
                     
            var clicked_element = jQuery(this);
            clicked_element.html("<i class='fa fa-spinner fa-pulse' aria-hidden='true'></i>");
            var new_clicked_element        = jQuery('.sk_selected_reviews').prev('.sk_reviews_grid-item');

            current_position--;

            if (new_clicked_element.length == 0) {
                new_clicked_element = jQuery('.sk_reviews_grid-item:eq('+current_position+')');
            }
            
            var content_src=new_clicked_element.find('.sk-review-popup');
            showPopUp(jQuery, content_src, new_clicked_element);
            
            if (current_position == 1) {
                jQuery('.prev_sk_google_review').hide();
            }
        });

        jQuery(document).on('click', '.next_sk_google_review', function(){
            var clicked_element = jQuery(this);
            clicked_element.html("<i class='fa fa-spinner fa-pulse' aria-hidden='true'></i>");
            var new_clicked_element        = jQuery('.sk_selected_reviews').next('.sk_reviews_grid-item');

            current_position++;

            if (new_clicked_element.length == 0) {
                new_clicked_element = jQuery('.sk_reviews_grid-item:eq('+current_position+')');
            }
            
            var content_src=new_clicked_element.find('.sk-review-popup');
            showPopUp(jQuery, content_src, new_clicked_element);

            var data_length = typeof data_storage ? data_storage.length : 0;
            if (current_position == data_length) {
                jQuery('.next_sk_google_review').hide();
            }
        });



        // trigger when 'read more' button was clicked
        jQuery(document).on('click', '.google-reviews-item', function () {

            var clicked_element = jQuery(this).closest('.sk_reviews_grid-item');
            var content_src=clicked_element.find('.sk-review-popup');

            current_position = clicked_element.attr('data-position');
            current_position = parseInt(current_position);

            var sk_google_reviews = clicked_element.closest('.sk-ww-google-reviews');
            if(getDsmSetting(sk_google_reviews,'show_reviews_on_new_tab') == 1 && getDsmSetting(sk_google_reviews,'links_clickable') == 1){
                var url = jQuery(this).attr('data-link');
                window.open(url, '_blank');
            }
            else if(getDsmSetting(sk_google_reviews,'show_reviews_on_new_tab') == 0){
                showPopUp(jQuery, content_src, clicked_element);
            
                if (current_position == 1) {
                    jQuery('.prev_sk_google_review').hide();
                }
            }
            
        });

        jQuery(document).on('click', '.sk-google-reviews-load-more-posts', function(){
            
            if(jQuery(this).attr('disabled') == "disabled"){
                return false;
            }
            jQuery(this).attr('disabled','disabled');

            var current_btn=jQuery(this);
            var current_btn_text=current_btn.text();
            var sk_google_reviews=jQuery(this).closest('.sk-ww-google-reviews');

            jQuery(this).html("<i class='fa fa-spinner fa-pulse' aria-hidden='true'></i>");

            var post_items="";

            setTimeout(function(){
            
                var enable_button = false;
                var old_last_key = last_key;
                last_key = old_last_key + parseInt(getDsmSetting(sk_google_reviews,'post_count'));
                for (var i = old_last_key; i < last_key; i++) {
                    if(typeof data_storage[i] != 'undefined'){
                        post_items+="<div class='sk_reviews_grid-item'>";
                            post_items+=getFeedItem(data_storage[i], sk_google_reviews, data_bio);
                        post_items+="</div>"; // end sk_reviews_grid-item
                    }
                }

                if(data_storage.length > last_key){
                    enable_button = true;
                }

                sk_google_reviews.find('.sk_reviews_grid').append(post_items);
                // change next page value

                if(enable_button){

                    current_btn.html(current_btn_text);

                    current_btn.show();
                    
                }else{
                    current_btn.hide();
                }
                
                // apply customizations and sizings
                current_btn.removeAttr('disabled');
                applyCustomUi(jQuery, sk_google_reviews);
                applyMasonry();
                fixMasonry();
            },300);
        });

        jQuery(document).on('click', '.sk-ww-google-reviews .sk-watermark', function(){
            jQuery('.sk-ww-google-reviews .sk-message').slideToggle();
        });

 
     }); // end document ready
 }

}(window, document));