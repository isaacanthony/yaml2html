'use strict';

/** Parse YAML to HTML and render in the DOM. */
const yaml2html = (() => {
  const CONTAINER = '#yaml2html-container';

  /** Parse header params. */
  const _parseHeaders = (obj) => {
    let headers = [];

    // Default headers
    headers.push('<meta charset="utf-8">');

    headers.push(
      '<meta name="viewport" content="width=device-width, initial-scale=1">'
    );

    // Parse title
    if (obj.title) {
      headers.push(`<title>${obj.title}</title>`);
    }

    // Parse CSS
    headers = headers.concat(
      (obj.css || []).map((url) => `<link rel="stylesheet" href="${url}">`)
    );

    // Parse JS
    headers = headers.concat(
      (obj.header_js || []).map((url) => `<script src="${url}"></script>`)
    );

    document.querySelector('head').innerHTML += headers.join('\n');
  };

  // Parse HTML.
  const _parseHtml = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(_parseHtml).join('\n');
    }

    if (obj.text) {
      return obj.text;
    }

    let html = [];

    // Parse opening tag.
    let tagString = `<${obj.tag}`;

    tagString += Object.entries(obj).map((arr) => {
      if (['tag', 'children'].includes(arr[0])) {
        return '';
      }

      return `${arr[0]}="${arr[1]}"`;
    }).join(' ');

    tagString += '>';

    html.push(tagString);

    // Recursively parse inner HTML.
    html = html.concat((obj.children || []).map(_parseHtml));

    // Parse closing tag.
    html.push(`</${obj.tag}>`);
    return html.join('\n');
  };

  /** Render single page. */
  const _renderPage = (obj, page) => {
    const wrapper = document.querySelector(CONTAINER);
    wrapper.innerHTML = _parseHtml((obj.pages || {})[page]);
  };

  /** Parse current URL route. */
  const _parseRoute = (obj) => {
    const hash = (window.location.hash || '#home').replace('#', '');

    if ((obj.pages || {})[hash]) {
      return hash;
    }

    return '404';
  };

  /** Parse body HTML. */
  const _parseBody = (obj) => {
    // Add container wrapper.
    document.querySelector('body').innerHTML += `
      <div id="${CONTAINER.replace('#', '')}"></div>
    `;

    // Render initial page.
    _renderPage(obj, _parseRoute(obj));
  };

  /** Parse footer params. */
  const _parseFooters = (obj) => {
    let footers = [];

    // Default JS
    window.onhashchange = (_) => {
      _renderPage(obj, _parseRoute(obj));
    };

    // Parse JS
    footers = footers.concat(
      (obj.footer_js || []).map((url) => `<script src="${url}"></script>`)
    );

    document.querySelector('body').innerHTML += footers.join('\n');
  };

  /** Entrypoint */
  const _parse = (obj) => {
    _parseHeaders(obj);
    _parseBody(obj);
    _parseFooters(obj);
  };

  /** Public API */
  const parse = (url) => {
    fetch(url)
      .then((response) => response.text())
      .then((yamlString) => jsyaml.load(yamlString))
      .then(_parse);
  };

  return {parse};
})();
