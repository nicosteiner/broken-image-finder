var pageMod = require('page-mod');
var widgets = require('widget');
var self = require("self");
var data = require("self").data;
var tabs = require("tabs");


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

    worker.port.on('resultsAvailable', function(resourceInfos) {

      bifPanel.postMessage({

        command: "add-resource-info",

        data: resourceInfos

      });

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
