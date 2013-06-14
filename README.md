non-blocking-adsense
====================
Need to delay adsense loading until after the document is closed? Then you'll need to temporarily override 
the browser's document.write(). Sounds drastic but it's not too bad really.

This has been tested in the following browsers:

IE8+, Chrome, Firefox, Safari (Mac)


This is based on a solution by FrankT [http://www.webdeveloper.com/forum/showthread.php?195112-solution-lazy-loading-JS-ad-code-containing-document.write%28%29]
