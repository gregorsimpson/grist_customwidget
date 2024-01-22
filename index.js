/*const colName_html = 'HTMLSource';
const colName_js = 'ScriptSource';
const colName_css = 'StyleSource';
var tableName = null;*/

var CustomWidget = {
  colName_html: "HTMLSource",
  colName_js: "ScriptSource",
  colName_css: "StyleSource",
  currentTableName: null,

  ready: function (fn) {
    if (document.readyState !== 'loading'){
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  },

  handleError: function(err) {
    console.error('ERROR', err);
    document.body.innerHTML = String(err).replace(/^Error: /, '');
  },

  onRecord: async function(record, mappedColNamesToRealColNames) {
    try {
      const record_mapped = grist.mapColumnNames(record);
      if (record_mapped) {
        window.alert("so far, no prob");
        let html = record_mapped[this.colName_html];
        window.alert("here comes the html: "+html);
        let js = record_mapped[this.colName_js];
        let css = record_mapped[this.colName_css];
        if (html) {
          let elem = document.getElementById('inject_html');
          elem.innerHTML = "";
          elem.appendChild(document.createRange().createContextualFragment(html));
        }
        if (js) {
          let elem = document.getElementById('inject_js');
          elem.innerHTML = "";
          elem.appendChild(document.createRange().createContextualFragment(`<script class="userjs">${js}</script>`));
        }
        if (css) {
          let elem = document.getElementById('inject_css');
          elem.innerHTML = "";
          elem.appendChild(document.createRange().createContextualFragment(css));
        }
      } else {
        // Helper returned a null value. It means that not all
        // required columns were mapped.
        throw new Error(`Please map all required columns first.`);
      }
    } catch (err) {
      handleError(err);
    }
  }
}

CustomWidget.ready(async function() {
  await grist.onRecord(CustomWidget.onRecord);
  grist.on('message', (e) => {
    if (e.tableId) {
      CustomWidget.currentTableName = e.tableId;
    }
  });
  grist.ready({
    requiredAccess: "full",
    columns: [
      {name: CustomWidget.colName_html, title: "HTML"},
      {name: CustomWidget.colName_js, title: "JS"},
      {name: CustomWidget.colName_css, title: "CSS"},
    ]
  });
});
