const customWidget_colName_name = 'WidgetName';
const customWidget_colName_html = 'HTMLSource';
const customWidget_colName_js = 'ScriptSource';
const customWidget_colName_css = 'StyleSource';

function ready (fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function customWidget_handleError (err) {
  console.error('ERROR', err);
  document.body.innerHTML = String(err).replace(/^Error: /, '');
}

const CustomWidget = {
  currentTableName: null,

  onRecord: async function(selectedRecord, mappedColNamesToRealColNames) {
    let recordsById = await grist.fetchSelectedTable({format: "rows", includeColumns: "normal"});
    let record = null;
    try {
      // If so required by custom config, operate on a specific record rather than the one we're given by Grist/any linked widgets.
      //console.log("STUPID widgetSourceByName", await grist.widgetApi.getOption("widgetSourceByName"));
      //console.log("STUPID recordsById", recordsById);
      let widgetSourceByName = await grist.widgetApi.getOption("widgetSourceByName"); 
      let customRecord = recordsById.find(function (rec) { return (rec[mappedColNamesToRealColNames[customWidget_colName_name]] == widgetSourceByName); });
      if (!customRecord) {
        throw new Error("No custom record found. Should use default one.");
      }
      //console.log("STUPID record as per custom config", customRecord);
      record = customRecord;
    } catch (err) {
      // If no custom record could be identified, use the normal one as supplied by Grist/any linked widgets.
      record = selectedRecord;
    }
    /*for (const [colName, rec] of Object.entries(recordsByColName)) {
    }*/
    try {
      const record_mapped = grist.mapColumnNames(record);
      if (record_mapped) {
        //let widgetName = record_mapped[customWidget_colName_name];
        let html = record_mapped[customWidget_colName_html];
        let js = record_mapped[customWidget_colName_js];
        let css = record_mapped[customWidget_colName_css];
        if (html) {
          let elem = document.getElementById('customwidget_inject_html');
          elem.innerHTML = "";
          elem.appendChild(document.createRange().createContextualFragment(html));
        }
        if (js) {
          let elem = document.getElementById('customwidget_inject_js');
          elem.innerHTML = "";
          // NB: We need to insert a new script tag along with the code, otherwise the latter won't get executed.
          elem.appendChild(document.createRange().createContextualFragment(`<script class="userjs">${js}</script>`));
        }
        if (css) {
          let elem = document.getElementById('customwidget_inject_css');
          elem.innerHTML = "";
          elem.appendChild(document.createRange().createContextualFragment(css));
        }
      } else {
        // Helper returned a null value. It means that not all
        // required columns were mapped.
        throw new Error(`Please map all required columns first.`);
      }
    } catch (err) {
      //console.log("STUPID ERROR", err);
      //console.log("STUPID THIS", this);
      customWidget_handleError(err);
    }
  },

  onConfigChanged: function (customOptions, interactionLog) {
    if (customOptions) {
      // The user modified some options. These are now stored in 'options' as key-value pairs.
      //console.log("STUPID modified widgetSourceByName", customOptions.widgetSourceByName);
      document.getElementById("customwidget_config_widgetSourceByName").value = customOptions.widgetSourceByName;
    } else {
      // No modified options were saved. Carry on using default values.
    }
  },
  
  saveConfig: async function() {
    //console.log("STUPID saveConfig! widgetSourceByName: ", document.getElementById("customwidget_config_widgetSourceByName").value);
    await grist.widgetApi.setOption('widgetSourceByName', document.getElementById("customwidget_config_widgetSourceByName").value);
  },

  showMain: function() {
    document.getElementById("customwidget_main").style.display = "block";
    document.getElementById("customwidget_config").style.display = "none";
  },

  showConfig: function() {
    document.getElementById("customwidget_main").style.display = "none";
    document.getElementById("customwidget_config").style.display = "block";
  }
}

ready(async function () {
  document.getElementById("customwidget_config").addEventListener("submit", function() {
    CustomWidget.showMain();
    //console.log("SAVE CUSTOM CONFIG");
    CustomWidget.saveConfig();
  });
  grist.on('message', function (e) {
    if (e.tableId) {
      CustomWidget.currentTableName = e.tableId;
    }
  });
  // This gets invoked when the user saves widget options, or when any custom options that are already stored are loaded (i.e. upon loading the widget).
  grist.onOptions(CustomWidget.onConfigChanged);
  await grist.ready({
    requiredAccess: "full",
    columns: [
      {name: customWidget_colName_name, title: "Widget name"},
      {name: customWidget_colName_html, title: "HTML"},
      {name: customWidget_colName_js, title: "JS"},
      {name: customWidget_colName_css, title: "CSS"},
    ],
    onEditOptions: function () {
      CustomWidget.showConfig();
    }
  });
  await grist.onRecord(CustomWidget.onRecord);
});
