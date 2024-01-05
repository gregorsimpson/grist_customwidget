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
  let html = '<h1>jao.</h1><u>check me out</u><script type="text/javascript">console.log("EPIC!");</script>';
  let range = document.createRange();
  let fragment = range.createContextualFragment(html);
});
