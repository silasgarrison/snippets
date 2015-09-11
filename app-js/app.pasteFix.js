/**
 * @summary     app.pasteFix.js
 * @description Fixes an issue in iOS that doesn't allow for pasting of links from Safari
				 Due to metadata being insufficiently passed off in iOS when using the share link in Safari
				 we have to scrape it out from the text/uri-list parameter
 * @version     1.0
 * @file        app.pasteFix.js
 * @author      Silas Garrison (http://silasgarrison.com/)
 *
 * This source file is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 ** Examples:
	If using the app.js wrapper, this will be initialized itself.  If you want to use it outside
	of the app.js wrapper you can just take the contents from inside init() and put them inside
	of any standalone script
*/

app.addFeature(
	"pasteFix",
	function(){
		"use strict";

		/*
			Name: init
			Use: API.init()
			Args: none
			Description: Attaches event listener to correct the pasting issue in iOS
		*/
		function init(){
			document.addEventListener(
				"paste",
				function(event){
					var url = event.clipboardData.getData("text/uri-list"),
						text = event.clipboardData.getData("text/plain");

					// If there's a URL present but no text, assume it's being pasted from Safari link which doesn't work by default
					if(event.target && !text && url){
						event.target.value += url;
					}
				}
			);
		}

		this.init = init;

		return this;
	}
);
