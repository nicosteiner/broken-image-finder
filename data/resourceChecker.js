var BIF = BIF || {};

BIF.Analyze = {};

// all starts here
// message is emited from main.js when webpage is loaded (onAttach)

if (self) {

  self.port.on('getResults', function() {

    BIF.Analyze.checkAllImgURLs();

    BIF.Analyze.checkAllStylesheetURLs();

  });

  self.port.on('gotResponseText', function(responseText) {

    var urlPosition, strike, urlEnd, strikeFinal;

    // in our case this is always stylesheet text content
    
    // extract image urls from this text content
    
    do {

      urlPosition = responseText.indexOf('url(');

      if (urlPosition !== -1) {

        strike = responseText.substring(urlPosition + 4);
        
        urlEnd = strike.indexOf(')');
        
        strikeFinal = BIF.Analyze.normalizeURLs(strike.substring(0, urlEnd));

        if (typeof strikeFinal !== 'undefined' && strikeFinal.match(/^\S+\.(gif|jpg|jpeg|png)$/)) {

          // check status code of found URL
          
          self.port.emit('getHTTPStatusCode', [strikeFinal, 'bla', 'blub']);
        
        }
        
        responseText = strike.substring(urlEnd + 1);

      }

    } while (urlPosition !== -1);

  });
  
}

// implement that in OO style
// function to remove double data in arrays
/*
function removeDuplicates(arr) {
    var copy = arr.slice(0);
    arr.length = 0;

    for (var i = 0; i < copy.length; ++i) {
        if (i == 0 || copy[i] != copy[i - 1]) {
            arr.push(copy[i]);
        }
    }
    return arr;
}
*/

BIF.Analyze = {

  checkAllImgURLs: function() {
  
    var allImgURLs = [],
        imgElements,
        imgSrc,
        i;
    
    // 1. Step: Find all image URLs
    
    imgElements = document.querySelectorAll('img[src]');

    for (i = 0; i < imgElements.length; i += 1) {

      imgSrc = imgElements[i].getAttribute('src');

      // check if path is relative
      
      if (imgSrc.match(/^\S+\.(gif|jpg|jpeg|png)$/)) {

        allImgURLs.push([imgSrc, 'html', 'image tag']);
          
      }

    }
  
    // 2. Step: Iterate through all found URLs and check status codes
    
    for (i = 0; i < allImgURLs.length; i += 1) {
    
      // message is sent to main.js where request is generated
    
      self.port.emit('getHTTPStatusCode', allImgURLs[i]);
    
    }
  
  },
  
  checkAllStylesheetURLs: function() {
  
    var allStylesheetURLs = [],
        linkElements,
        linkHref,
        i;
    
    // find all stylesheets (only with src-attribute)
    
    linkElements = document.querySelectorAll('link[rel^="stylesheet"]');

    for (i = 0; i < linkElements.length; i += 1) {

      linkHref = BIF.Analyze.normalizeURLs(linkElements[i].getAttribute('href'));

      // check if path is relative
      
      allStylesheetURLs.push([linkHref, linkHref, 'link tag']);

    }
    
    // 2. Step: Iterate through all found URLs and get stylesheet content
    
    for (i = 0; i < allStylesheetURLs.length; i += 1) {
    
      // message is sent to main.js where request is generated
    
      self.port.emit('getResponseText', allStylesheetURLs[i]);
    
    }
  
  },
  
  normalizeURLs: function(url) {
  
    // this normalization is a tricky part
    // I'll start with "simple" relative URLs
    // other relative cases have to be added
    
    var normalizedURL,
        fullDomain;
    
    fullDomain = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
    
    // simple relative URLs starting with /
    
    if (url.indexOf('/') === 0) {
    
      // in this case add domain
      
      normalizedURL = fullDomain + url;
    
    }
    
    return normalizedURL;
  
  }
  
};