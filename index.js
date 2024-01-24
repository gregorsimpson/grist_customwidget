/*const customWidget_colName_name = 'WidgetName';
const customWidget_colName_html = 'HTMLSource';
const customWidget_colName_js = 'ScriptSource';
const customWidget_colName_css = 'StyleSource';*/

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
  targetTable: null,

  panels: ["error", "main", "config"],

  // Called by Grist whenever a record in the targetTable gets selected.
  onRecord: async function(selectedRecord, mappedColNamesToRealColNames) {
    // Just for testing, rebuild the whole widget each time a record gets selected.
    //this.init();
  },

  // Called when the widget gets loaded.
  init: async function() {
    //console.log("CustomWidget init!");
    // Get source record with HTML, JS, and CSS to display.
    let sourceTable = await grist.widgetApi.getOption("sourceTable") || document.getElementById("customWidget_default_sourceTable").innerHTML;
    let sourceRecordNameColumn = await grist.widgetApi.getOption("sourceRecordNameColumn") || document.getElementById("customWidget_default_sourceRecordNameColumn").innerHTML;
    let sourceRecordHtmlColumn = await grist.widgetApi.getOption("sourceRecordHtmlColumn") || document.getElementById("customWidget_default_sourceRecordHtmlColumn").innerHTML;
    let sourceRecordJsColumn = await grist.widgetApi.getOption("sourceRecordJsColumn") || document.getElementById("customWidget_default_sourceRecordJsColumn").innerHTML;
    let sourceRecordCssColumn = await grist.widgetApi.getOption("sourceRecordCssColumn") || document.getElementById("customWidget_default_sourceRecordCssColumn").innerHTML;
    let sourceRecordQuery = await grist.widgetApi.getOption("sourceRecordQuery") || null;
    //console.log("CustomWidget sources defined!");
    //console.log("CustomWidget sourceTable:",sourceTable);
    try
    {
      if (!sourceRecordQuery) {
        throw new Error("No widget to display. Please open configuration and specify one.");
      }
      let valuesByColName = await grist.docApi.fetchTable(sourceTable);
      //console.log("CustomWidget fetched source table:",valuesByColName);
      let widgetSource = null;
      for (let i=0; i<valuesByColName[sourceRecordNameColumn].length; i++) {
        //console.log("CustomWidget probe source record "+i);
        let widgetName = valuesByColName[sourceRecordNameColumn][i]
        //console.log("CustomWidget widget name:",widgetName);
        if (widgetName == sourceRecordQuery) {
          //console.log("CustomWidget this is the widget name we're looking for!");
          widgetSource = {
            name: widgetName,
            html: valuesByColName[sourceRecordHtmlColumn][i],
            js: valuesByColName[sourceRecordJsColumn][i],
            css: valuesByColName[sourceRecordCssColumn][i],
          }
          //console.log("CustomWidget made widgetSource:",widgetSource);
          break;
        }
      }
      if (!widgetSource) {
        console.log("CustomWidget can't find a sourceWidget matching the name set in config.");
        return;
        throw new Error("Can't identify widget source record.");
      }
      //console.log("CustomWidget injecting stuff now!");
      let elem = document.getElementById('customWidget_html');
      elem.innerHTML = "";
      elem.appendChild(document.createRange().createContextualFragment(widgetSource.html));
      //console.log("CustomWidget HTML injected.");
      let elem2 = document.getElementById('customWidget_js');
      elem2.innerHTML = "";
      // NB: We need to insert a new script tag along with the code, otherwise the latter won't get executed.
      elem2.appendChild(document.createRange().createContextualFragment(`<script class="userjs">${widgetSource.js}</script>`));
      //console.log("CustomWidget JS injected.");
      let elem3 = document.getElementById('customWidget_css');
      elem3.innerHTML = "";
      elem3.appendChild(document.createRange().createContextualFragment(widgetSource.css));
      //console.log("CustomWidget CSS injected.");
      //console.log("CustomWidget INIT IS ALL DONE.");
    } catch (err) {
      //console.log("CustomWidget SOME ERROR HAPPENED",err);
      customWidget_handleError(err);
    }
  },

  /*
  onRecordOLD: async function(selectedRecord, mappedColNamesToRealColNames) {
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
  },*/

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
      // No customized options present yet, nothing to do here.
    }
    document.getElementById("customWidget_show_sourceRecordNameColumn").innerHTML = document.getElementById("customWidget_sourceRecordNameColumn").value;
  },
  
  saveConfig: async function() {
    //console.log("CustomWidget saveConfig!");
    //console.log("STUPID saveConfig! widgetSourceByName: ", document.getElementById("customwidget_config_widgetSourceByName").value);
    //await grist.widgetApi.setOption('widgetSourceByName', document.getElementById("customwidget_config_widgetSourceByName").value);
    /*await grist.widgetApi.setOption("sourceTable", document.getElementById("customWidget_sourceTable").value);
    await grist.widgetApi.setOption("sourceRecordNameColumn", document.getElementById("customWidget_sourceRecordNameColumn").value);
    await grist.widgetApi.setOption("sourceRecordHtmlColumn", document.getElementById("customWidget_sourceRecordHtmlColumn").value);
    await grist.widgetApi.setOption("sourceRecordJsColumn", document.getElementById("customWidget_sourceRecordJsColumn").value);
    await grist.widgetApi.setOption("sourceRecordCssColumn", document.getElementById("customWidget_sourceRecordCssColumn").value);
    await grist.widgetApi.setOption("sourceRecordQuery", document.getElementById("customWidget_sourceRecordQuery").value);*/
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
  document.getElementById("customWidget_default_sourceTable").innerHTML = "Widgets";
  document.getElementById("customWidget_default_sourceRecordNameColumn").innerHTML = "name";
  document.getElementById("customWidget_default_sourceRecordHtmlColumn").innerHTML = "html_final";
  document.getElementById("customWidget_default_sourceRecordJsColumn").innerHTML = "js_final";
  document.getElementById("customWidget_default_sourceRecordCssColumn").innerHTML = "css_final";
  grist.on('message', function (e) {
    if (e.tableId) {
      CustomWidget.targetTable = e.tableId;
    }
  });
  // This gets invoked when the user saves widget options, or when any custom options that are already stored are loaded (i.e. upon loading the widget).
  grist.onOptions(CustomWidget.onConfigChanged);
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
  CustomWidget.init();
  await grist.onRecord(CustomWidget.onRecord);
});
