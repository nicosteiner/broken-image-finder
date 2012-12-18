var pageMod = require('page-mod');
var widgets = require('widget');
var self = require("self");
var data = require("self").data;
var tabs = require("tabs");
var request = require("request").Request;


// panel for detail view
var bifPanel = require("panel").Panel({

  width: 650,
  height: 400,
  contentURL: data.url('bifPanel.html'),
  contentScriptFile: data.url('bifPanel.js')

});

// dial the resourceChecker-script
pageMod.PageMod({

  include: '*',
  
  contentScriptFile: data.url('resourceChecker.js'),

  onAttach: function(worker) {

    bifPanel.postMessage({

      command: "clear-panel",

      data: null

    });

    worker.port.emit('getResults');

    worker.port.on('getHTTPStatusCode', function(webResource) {

      var url = webResource[0];
    
      if (request && url && typeof url === 'string') {

        request({
        
          url: url,
          
          onComplete: function (response) {
            
            // everything else than "found" triggers an error
            
            if (response.status !== 200) {
            
              console.log(url + ' >> ' + response.status);
            
              /*
              bifPanel.postMessage({

                command: "add-resource-info",

                data: webResource

              });
              */

            }
            
          }
          
        }).get();
        
      }
        
    });

    worker.port.on('getResponseText', function(webResource) {

      var url = webResource[0];
    
      if (request && url && typeof url === 'string') {

        request({
        
          url: url,
          
          onComplete: function (response) {
            
            if (response.status === 200 && response.text) {
            
              worker.port.emit('gotResponseText', response.text);
              
            }
            
          }
          
        }).get();
        
      }
        
    });
    
  }
  
});


// click widget to show panel
var widget = widgets.Widget({

  id: 'bif@dupps.it',
  label: 'find broken images',
  contentURL: 'http://dupps.it/bif/stuff/favicon.ico',

  onClick:
    function() {
        bifPanel.show();
    }

});
