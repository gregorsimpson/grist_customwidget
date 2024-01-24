const colName_name = 'WidgetName';
const colName_html = 'HTMLSource';
const colName_js = 'ScriptSource';
const colName_css = 'StyleSource';

function ready (fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const CustomWidget = {
  /*colName_html: "HTMLSource",
  colName_js: "ScriptSource",
  colName_css: "StyleSource",*/
  currentTableName: null,

  handleError: function(err) {
    console.error('ERROR', err);
    document.body.innerHTML = String(err).replace(/^Error: /, '');
  },

  onRecord: async function(record, mappedColNamesToRealColNames) {
    let recordsById = grist.fetchSelectedTable({format: "rows", includeColumns: "normal"});
    try {
      console.log("widgetSourceByName: "+grist.widgetApi.getOption("widgetSourceByName");
      console.log("recordsById: "+recordsById);
      let customRecord = recordsById.find((rec) => rec[mappedColNamesToRealColNames[colName_name]] == grist.widgetApi.getOption("widgetSourceByName"));
      window.alert("record as per custom config: "+ customRecord);
      record = customRecord;
    } catch (err) {
    }
    /*for (const [colName, rec] of Object.entries(recordsByColName)) {
    }*/
    try {
      const record_mapped = grist.mapColumnNames(record);
      if (record_mapped) {
        //let widgetName = record_mapped[colName_name];
        let html = record_mapped[colName_html];
        let js = record_mapped[colName_js];
        let css = record_mapped[colName_css];
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
      this.handleError(err);
    }
  },

  onConfigChanged: function (customOptions, interactionLog) {
    if (customOptions) {
      // The user modified some options. These are now stored in 'options' as key-value pairs.
      console.log("modified widgetSourceByName: " + customOptions.widgetSourceByName);
    } else {
      // No modified options were saved. Carry on using default values.
    }
  },
  
  saveConfig: async function() {
    console.log("saveConfig! widgetSourceByName: "+document.getElementById("customwidget_config_widgetSourceByName").value);
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
  grist.on('message', function (e) {
    if (e.tableId) {
      CustomWidget.currentTableName = e.tableId;
    }
  });
  // This gets invoked when the user saves widget options.
  grist.onOptions(CustomWidget.onConfigChanged);
  await grist.ready({
    requiredAccess: "full",
    columns: [
      {name: colName_html, title: "HTML"},
      {name: colName_js, title: "JS"},
      {name: colName_css, title: "CSS"},
    ],
    onEditOptions: function () {
      CustomWidget.showConfig();
    }
  });
  await grist.onRecord(CustomWidget.onRecord);
});
