
function ready (fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function customWidget_handleError (err) {
  console.error('ERROR', err);
  try
  {
    let errPanel = CustomWidget.showPanel("error");
    errPanel.innerHTML = String(err).replace(/^Error: /, '');
  } catch(err) {
    document.body.innerHTML = String(err).replace(/^Error: /, '');
  }
}

const CustomWidget = {
  // This is the table set in Grist as the data source for this widget.
  currentTable: null,
  // This is the record currently selected in the 'currentTable', as obtained through any linking widget.
  currentRecord: null,

  panels: ["error", "main", "config"],

  onRecordCallbacks: [],

  // This may be used from user code to have a callback invoked whenever the current record changes.
  // The advantage over using grist.onRecord() directly is that these callbacks will get called in a way
  // that makes sure the custom widget (HTML, JS, CSS) is also updated afterwards.
  onRecord: function(callback) {
    this.onRecordCallbacks.push(callback);
  },
  
  // Called by Grist whenever a record in the 'currentTable' gets selected.
  currentRecordChanged: async function(record, mappedColNamesToRealColNames) {
    this.currentRecord = record;
    this.onRecordCallbacks.forEach(function(cb) {
      try
      {
        cb(record);
      } catch (err) {
        //customWidget_handleError(err);
      }
    });
    // Rebuild the widget each time a record gets selected.
    this.update();
  },

  _makeWidgetSource: async function(sourceTable, sourceRecordNameColumn, sourceRecordHtmlColumn, sourceRecordJsColumn, sourceRecordCssColumn, sourceRecordQuery) {
    if (!sourceRecordQuery) {
      try
      {
        return {
          name: this.currentRecord[sourceRecordNameColumn],
          html: this.currentRecord[sourceRecordHtmlColumn],
          js: this.currentRecord[sourceRecordJsColumn],
          css: this.currentRecord[sourceRecordCssColumn],
        };
      } catch (err) {
        throw new Error(`
          Can't source widget from record '${this.currentRecord}' on table '${this.currentTable}'.
          Most likely the table doesn't have all the required columns (widget name, HTML, JS, CSS).
        `);
      }
    }
    let valuesByColName = await grist.docApi.fetchTable(sourceTable);
    //console.log("CustomWidget fetched source table:",valuesByColName);
    for (let i=0; i<valuesByColName[sourceRecordNameColumn].length; i++) {
      //console.log("CustomWidget probe source record "+i);
      let widgetName = valuesByColName[sourceRecordNameColumn][i]
      //console.log("CustomWidget widget name:",widgetName);
      if (widgetName == sourceRecordQuery) {
        //console.log("CustomWidget this is the widget name we're looking for!");
        return {
          name: widgetName,
          html: valuesByColName[sourceRecordHtmlColumn][i],
          js: valuesByColName[sourceRecordJsColumn][i],
          css: valuesByColName[sourceRecordCssColumn][i],
        };
      }
    }
    console.log("CustomWidget can't find a sourceWidget matching the name set in config.");
    //return;
    throw new Error("Can't identify widget source record.");
  },

  // Called when the widget gets loaded.
  update: async function() {
    //console.log("CustomWidget update!");
    // Get source record with HTML, JS, and CSS to display.
    let sourceTable = await grist.widgetApi.getOption("sourceTable") || document.getElementById("customWidget_default_sourceTable").innerHTML;
    let sourceRecordNameColumn = await grist.widgetApi.getOption("sourceRecordNameColumn") || document.getElementById("customWidget_default_sourceRecordNameColumn").innerHTML;
    let sourceRecordHtmlColumn = await grist.widgetApi.getOption("sourceRecordHtmlColumn") || document.getElementById("customWidget_default_sourceRecordHtmlColumn").innerHTML;
    let sourceRecordJsColumn = await grist.widgetApi.getOption("sourceRecordJsColumn") || document.getElementById("customWidget_default_sourceRecordJsColumn").innerHTML;
    let sourceRecordCssColumn = await grist.widgetApi.getOption("sourceRecordCssColumn") || document.getElementById("customWidget_default_sourceRecordCssColumn").innerHTML;
    let sourceRecordQuery = await grist.widgetApi.getOption("sourceRecordQuery") || null;
    //console.log("CustomWidget sources defined!");
    //console.log("CustomWidget sourceTable:",sourceTable);
    try {
      let widgetSource = await this._makeWidgetSource(sourceTable, sourceRecordNameColumn, sourceRecordHtmlColumn, sourceRecordJsColumn, sourceRecordCssColumn, sourceRecordQuery);
      //console.log("CustomWidget injecting stuff now!");
      let elem = document.getElementById('customWidget_html');
      elem.innerHTML = "";
      elem.appendChild(document.createRange().createContextualFragment(widgetSource.html));
      //console.log("CustomWidget HTML injected.");
      let elem2 = document.getElementById('customWidget_js');
      elem2.innerHTML = "";
      // NB: We need to insert a new script tag along with the code, otherwise the latter won't get executed.
      scriptElem = document.createElement("script");
      scriptElem.async = false;
      scriptElem.innerHTML = widgetSource.js;
      elem2.appendChild(scriptElem);
      //elem2.appendChild(document.createRange().createContextualFragment(`<script class="userjs">${widgetSource.js}</script>`));
      //console.log("CustomWidget JS injected.");
      let elem3 = document.getElementById('customWidget_css');
      elem3.innerHTML = "";
      elem3.appendChild(document.createRange().createContextualFragment(widgetSource.css));
      //console.log("CustomWidget CSS injected.");
      //console.log("CustomWidget update IS ALL DONE.");
    } catch (err) {
      //console.log("CustomWidget SOME ERROR HAPPENED",err);
      customWidget_handleError(err);
    }
  },

  onConfigChanged: function (customOptions, interactionLog) {
    //console.log("CustomWidget onConfigChanged! customOptions:",customOptions);
    if (customOptions) {
      // Customized options are present. These are stored in 'customOptions' as key-value pairs.
      
      // If the 'sourceTable' option was customized, load the custom value into the form field.
      if (customOptions.sourceTable) {
        document.getElementById("customWidget_sourceTable").value = customOptions.sourceTable;
      }
      if (customOptions.sourceRecordNameColumn) {
        document.getElementById("customWidget_sourceRecordNameColumn").value = customOptions.sourceRecordNameColumn;
      }
      if (customOptions.sourceRecordHtmlColumn) {
        document.getElementById("customWidget_sourceRecordHtmlColumn").value = customOptions.sourceRecordHtmlColumn;
      }
      if (customOptions.sourceRecordJsColumn) {
        document.getElementById("customWidget_sourceRecordJsColumn").value = customOptions.sourceRecordJsColumn;
      }
      if (customOptions.sourceRecordCssColumn) {
        document.getElementById("customWidget_sourceRecordCssColumn").value = customOptions.sourceRecordCssColumn;
      }
      if (customOptions.sourceRecordQuery) {
        document.getElementById("customWidget_sourceRecordQuery").value = customOptions.sourceRecordQuery;
      }
    } else {
      // No customized options present yet. This also happens if the user clears all options, so we want to clear out all form fields here to reflect that.
      document.getElementById("customWidget_sourceTable").value = "";
      document.getElementById("customWidget_sourceRecordNameColumn").value = "";
       document.getElementById("customWidget_sourceRecordHtmlColumn").value = "";
      document.getElementById("customWidget_sourceRecordJsColumn").value = "";
      document.getElementById("customWidget_sourceRecordCssColumn").value = "";
      document.getElementById("customWidget_sourceRecordQuery").value = "";
    }
    document.getElementById("customWidget_show_sourceRecordNameColumn").innerHTML = document.getElementById("customWidget_sourceRecordNameColumn").value;
  },
  
  saveConfig: async function() {
    //console.log("CustomWidget saveConfig!");
    // NB: Calling setOptions() will also trigger grist.onOptions().
    await grist.widgetApi.setOptions({
      sourceTable: document.getElementById("customWidget_sourceTable").value,
      sourceRecordNameColumn: document.getElementById("customWidget_sourceRecordNameColumn").value,
      sourceRecordHtmlColumn: document.getElementById("customWidget_sourceRecordHtmlColumn").value,
      sourceRecordJsColumn: document.getElementById("customWidget_sourceRecordJsColumn").value,
      sourceRecordCssColumn: document.getElementById("customWidget_sourceRecordCssColumn").value,
      sourceRecordQuery: document.getElementById("customWidget_sourceRecordQuery").value
    });
    //console.log("CustomWidget saveConfig succeeded.");
  },

  showPanel: function(panelName) {
    let shownPanelElement = null;
    this.panels.forEach((pn) => {
      elem = document.getElementById(`customWidget_panel_${pn}`);
      if (pn == panelName) {
        elem.style.display = "block";
        shownPanelElement = elem;
      } else {
        elem.style.display = "none";
      }
    });
    return shownPanelElement;
  },
}

ready(async function () {
  document.getElementById("customWidget_config").addEventListener("submit", function() {
    CustomWidget.showPanel("main");
    //console.log("SAVE CUSTOM CONFIG");
    CustomWidget.saveConfig();
  });
  // Set up a sensible default configuration.
  // CustomWidget.update() uses these elements' innerHTML to determine default values if no user-customized configuration is present.
  document.getElementById("customWidget_default_sourceTable").innerHTML = "Widgets";
  document.getElementById("customWidget_default_sourceRecordNameColumn").innerHTML = "name";
  document.getElementById("customWidget_default_sourceRecordHtmlColumn").innerHTML = "html_final";
  document.getElementById("customWidget_default_sourceRecordJsColumn").innerHTML = "js_final";
  document.getElementById("customWidget_default_sourceRecordCssColumn").innerHTML = "css_final";
  grist.on('message', function (e) {
    if (e.tableId) {
      CustomWidget.currentTable = e.tableId;
    }
  });
  // This gets invoked when the user saves widget options, or when any custom options that are already stored are loaded (i.e. upon loading the widget).
  grist.onOptions(CustomWidget.onConfigChanged.bind(CustomWidget));
  await grist.ready({
    requiredAccess: "full",
    allowSelectBy: true,
    /*columns: [
      {name: customWidget_colName_name, title: "Widget name"},
      {name: customWidget_colName_html, title: "HTML"},
      {name: customWidget_colName_js, title: "JS"},
      {name: customWidget_colName_css, title: "CSS"},
    ],*/
    onEditOptions: function () {
      CustomWidget.showPanel("config");
    }
  });
  CustomWidget.update();
  await grist.onRecord(CustomWidget.currentRecordChanged.bind(CustomWidget));
});
