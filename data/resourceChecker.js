// function to remove double data in arrays
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


// the brain (XMLHttpRequest)
var xhrCommunicator = function(resourceInfos, callback) {

    this.initXHR();

    this.getResponseCode(resourceInfos, callback);

};

xhrCommunicator.prototype = {

    initXHR: function() {

        this.xhr = new XMLHttpRequest();
    },

    getResponseCode: function(resourceInfos, callback) {

        if (this.xhr) {

            // true => asynchronous
            this.xhr.open('GET', resourceInfos[0], true);

            this.xhr.onreadystatechange = (function(that, resourceInfos) {

                return function() {

                    var newWebResourceURLs, responseText, urlPosition, strike, urlEnd, strikeFinal, url, urlOrigin, urlType, showId, status, infoDiv, body;

                    url = resourceInfos[0];
                    urlOrigin = resourceInfos[1];
                    urlType = resourceInfos[2];

                    // request finished and response is ready
                    if (that.xhr.readyState === 4) {

                        status = that.xhr.status;

                        // if statuscode is NOT 'ok'
                        if (status !== 200) {

                            resourceInfos[3] = status;

                            // show a notification box for 6 seconds

                            infoDiv = document.getElementById('infoDiv');

                            if(!infoDiv) {

                                createStyleTag();

                                infoDiv = document.createElement('div');
                                infoDiv.id = 'infoDiv';
                                infoDiv.textContent = 'there are broken images!';
                                body = document.getElementsByTagName('body')[0];
                                body.appendChild(infoDiv);

                                setTimeout(function() { body.removeChild(infoDiv); }, 6000);
                            }

                            // emit each error
                            self.port.emit('resultsAvailable',resourceInfos);

                        } else {

                            // find every 'external' URL and push them all in a special array
                            newWebResourceURLs = [];

                            responseText = that.xhr.responseText;

                            do {

                                urlPosition = responseText.indexOf('url');

                                if (urlPosition !== -1) {

                                    strike = responseText.substring(urlPosition+4);
                                    urlEnd = strike.indexOf(')');
                                    strikeFinal = strike.substring(0,urlEnd);

                                    // XSS prevention
                                    strikeFinal = HtmlEntities(strikeFinal);

                                    // remove quotes
                                    strikeFinal = strikeFinal.replace(/['"]/g, '');

                                    if (!strikeFinal.match('//')) {

                                      newWebResourceURLs.push([strikeFinal, urlOrigin, urlType]);

                                    }

                                    responseText = strike.substring(urlEnd+1);
                                }

                            } while (urlPosition !== -1);

                            // remove double data
                            newWebResourceURLs = removeDuplicates(newWebResourceURLs);

                            // check the 'new' URLs
                            xhrAction(newWebResourceURLs);
                        }
                    }
                };

            }(this, resourceInfos));

            // send requestgetResults
            this.xhr.send(null);
        }
    }
};


// function to collect all resources
var allWebResourceURLs = [];

function collectResources() {

    var imageElems, imgUrl, styleElems, styleUrl;

    // find all images (only with src-attribute)
    imageElems = document.querySelectorAll('img[src]');

    for (var i = 0; i < imageElems.length; i++) {

        imgUrl = imageElems[i].getAttribute('src');

        // prevents pushing trackingpixel into array
        if (!imgUrl.match('//')) {

            imgUrl = HtmlEntities(imgUrl);

            allWebResourceURLs.push([imgUrl, 'html', 'image tag']);
        }
    };

    // find all stylesheets
    styleElems = document.querySelectorAll('link[rel^="stylesheet"]');

    for (var i = 0; i < styleElems.length; i++) {

        styleUrl = styleElems[i].getAttribute('href');

        if (!styleUrl.match('//')) {

            styleUrl = HtmlEntities(styleUrl);

            allWebResourceURLs.push([styleUrl, styleUrl, 'link tag']);
        }
    };
};


// function to prevent XSS
function HtmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


// function to check each URL of any resource ('all' and 'new')
function xhrAction(resourceURLs) {

    for (var i = 0; i < resourceURLs.length; i++) {

        new xhrCommunicator(resourceURLs[i], function(responseCode) {

            responseCodes.push(responseCode);

        });
    };
}


function createStyleTag() {

    var style, styleTag, head;

    // definition of style
    style = '#infoDiv { position: fixed; top: 30px; right: 30px; padding: 10px; color: #d8000c; background-color: #ffbaba; opacity: 0.9; border: 1px solid #d8000c; border-radius: 3px; font-size: 12px; font-weight: normal; font-family: Arial, sans serif; z-index: 999; box-shadow: 0 0 20px #212121; }';

    // create style tag
    styleTag = document.createElement('style');
    styleTag.setAttribute('type','text/css');
    styleTag.id = 'popupStyle';
    styleTag.innerHTML = style;
    head = document.getElementsByTagName('head')[0];
    head.appendChild(styleTag);
}


// init
self.port.on('getResults', function() {

    collectResources();

    xhrAction(allWebResourceURLs);

});