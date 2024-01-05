const colName_bodySource = 'HTMLSource';
const colName_scriptSource = 'ScriptSource';

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function handleError(err) {
  console.error('ERROR', err);
  data.message = String(err).replace(/^Error: /, '');
}

ready(async function() {
  var fragment = document.createRange().createContextualFragment('<b>epic!</b><u>and more</u>');
  document.getElementById('inject_body').appendChild(fragment);
});
