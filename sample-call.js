var settingsFunction = function () { 
	google_ad_client = 'ca-pub-00000000000';
	google_ad_slot = '00000000000';
	google_ad_width = 150;
	google_ad_height = 500;
	google_hints = 'jobs+job+work';
	google_max_num_ads = '6';
	google_ad_type = 'text';
	google_ad_output = 'js';
	google_skip = googleAdCount;
	google_language = 'en'; 
}

domWrite("adPlaceholder", "http://pagead2.googlesyndication.com/pagead/show_ads.js", settingsFunction);