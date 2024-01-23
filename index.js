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
  /*const colName_html: "HTMLSource",
  const colName_js: "ScriptSource",
  const colName_css: "StyleSource",*/
  currentTableName: null,

  handleError: function(err) {
    console.error('ERROR', err);
    document.body.innerHTML = String(err).replace(/^Error: /, '');
  },

  onRecord: async function(record, mappedColNamesToRealColNames) {
    try {
      const record_mapped = grist.mapColumnNames(record);
      if (record_mapped) {
        window.alert("so far, no prob");
        window.alert("colName_html: "+colName_html);
        let html = record_mapped[colName_html];
        window.alert("here comes the html: "+html);
        let js = record_mapped[colName_js];
        let css = record_mapped[colName_css];
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

ready(async function () {
  grist.on('message', function (e) {
    if (e.tableId) {
      CustomWidget.currentTableName = e.tableId;
      window.alert("current table is now: "+CustomWidget.currentTableName);
    }
  });
  await grist.ready({
    requiredAccess: "full",
    columns: [
      {name: colName_html, title: "HTML"},
      {name: colName_js, title: "JS"},
      {name: colName_css, title: "CSS"},
    ]
  });
  await grist.onRecord(CustomWidget.onRecord);
});
