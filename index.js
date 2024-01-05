const colName_html = 'HTMLSource';
const colName_js = 'ScriptSource';
const colName_css = 'StyleSource';
var tableName = null;

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function handleError(err) {
  console.error('ERROR', err);
  document.body.innerHTML = String(err).replace(/^Error: /, '');
}

async function onRecord(record, mappedColNamesToRealColNames) {
  try {
    const record_mapped = grist.mapColumnNames(record);
    if (record_mapped) {
      let html = record_mapped[colName_html];
      let js = record_mapped[colName_js];
      let css = record_mapped[colName_css];
      if (html) {
        document.getElementById('inject_html').appendChild(document.createRange().createContextualFragment(html));
      }
      if (js) {
        document.getElementById('inject_js').appendChild(document.createRange().createContextualFragment(js));
      }
      if (css) {
        document.getElementById('inject_css').appendChild(document.createRange().createContextualFragment(css));
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

ready(async function() {
  await grist.onRecord(onRecord);
  grist.on('message', (e) => {
    if (e.tableId) {
      tableName = e.tableId;
    }
  });
  grist.ready({
    requiredAccess: "full",
    columns: [
      {name: colName_html, title: "HTML"},
      {name: colName_js, title: "JS"},
      {name: colName_css, title: "CSS"},
    ]
  });
});
