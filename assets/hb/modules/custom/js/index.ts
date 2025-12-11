// This script will be compiled into the JS bundle automatically.
// Scroll to previous position when reloading
document.addEventListener('DOMContentLoaded', function () {
  const scrollPos = parseInt(sessionStorage.getItem('scrollPos') ?? '');
  const scrollUrl = sessionStorage.getItem('scrollUrl') ?? '';
  if (scrollPos > 0 && scrollUrl == location.href) {
    window.scroll({ top: scrollPos, left: 0, behavior: 'smooth' }); // 'instant'
  }
  sessionStorage.removeItem('scrollPos');
  sessionStorage.removeItem('scrollUrl');
});
window.addEventListener('beforeunload', function () {
  const scrollPos = window.scrollY > 0 ? window.scrollY : 0;
  sessionStorage.setItem('scrollPos', scrollPos.toString());
  sessionStorage.setItem('scrollUrl', location.href);
});
// Add title to footnote link
document.addEventListener('DOMContentLoaded', function () {
  const tempTextArea = document.createElement('textarea');
  const fnRefs = document.querySelectorAll('.footnote-ref');
  fnRefs.forEach(function (ref) {
    const fnID = (ref.getAttribute('href')?.substring(1) ?? '').replace(/:/g, '\\:');
    let fnContent = document.querySelector('#' + fnID + ' p')?.innerHTML ?? '';
    tempTextArea.innerHTML = fnContent;
    fnContent = tempTextArea.value;
    fnContent = fnContent
      .replace(/<[^>]+>/g, '')
      .replace(/↩︎/g, '')
      .trim();
    console.log(fnContent);
    ref.setAttribute('title', fnContent);
  });
});
// Remove 'disabled' property from '<input type=checkbox>' and prevent toggle
document.addEventListener('DOMContentLoaded', function () {
  const checkboxes = document.getElementsByClassName('hb-blog-post-content')[0].getElementsByTagName('input');
  Array.from(checkboxes).forEach(function (cb) {
    cb.removeAttribute('disabled');
    cb.addEventListener('click', function (e) {
      e.preventDefault();
    });
  });
});
//
// <link-preview> HTML Tag
// @ts-ignore
class LinkPreviewElem extends HTMLElement {
  static observedAttributes = ['url', 'title', 'desc', 'image'];

  constructor() {
    super();
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name == 'url') {
      this.renderSkeleton(newValue);
      this.checkAndFetchOpenGraphData(newValue);
    } else if (name === 'title' || name === 'desc' || name === 'image') {
      this.renderFromAttributes();
    }
  }

  checkAndFetchOpenGraphData(url: string) {
    if (this.hasAttribute('title') && this.hasAttribute('desc') && this.hasAttribute('image')) {
      this.renderFromAttributes();
    } else {
      this.fetchOpenGraphData(url);
    }
  }

  renderSkeleton(url: string) {
    this.innerHTML = `
    <figure class="link-preview">
      <a class="lp-link" href="${url}" target="_blank" rel="noopener">
        <div class="lp-image lp-placeholder">&nbsp;</div>
        <div class="lp-text">
          <p class="lp-title lp-placeholder">Loading title...</p>
          <p class="lp-desc lp-placeholder">Loading description...</p>
          <p class="lp-host">${new URL(url).host}</p>
        </div>
      </a>
    </figure>
    `;
  }

  renderFromAttributes() {
    const url = this.getAttribute('url');
    if (!url) return;

    const title = this.getAttribute('title') || '';
    const desc = this.getAttribute('desc') || '';
    const image = this.getAttribute('image') || '';

    this.render({ title, desc, image }, url);
  }

  // @ts-ignore
  async fetchOpenGraphData(url: string): Promise<void> {
    const cachedData = localStorage.getItem(`LinkPreview: ${url}`);
    if (cachedData) {
      this.render(JSON.parse(cachedData), url);
      return;
    }

    try {
      const response = await fetch(
        `https://open-graph-api-coral.vercel.app/api/opengraph?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      const title = data.title?.trim() || this.getAttribute('title') || '';
      const desc = data.desc?.trim() || this.getAttribute('desc') || '';
      const image = data.image?.trim() || this.getAttribute('image') || '';

      const storedData = { title, desc, image };

      localStorage.setItem(`LinkPreview: ${url}`, JSON.stringify(storedData));
      this.render(storedData, url);
    } catch (e) {
      console.error('Fetch error: ', e);
    }
  }

  render(data: object, url: string) {
    const { title, desc, image } = data as { title?: string; desc?: string; image?: string };
    this.innerHTML = `
    <figure class="link-preview">
      <a class="lp-link" href="${url}" target="_blank" rel="noopener">
        ${image ? `<div class="lp-image" style="background-image: url('${image}');">&nbsp;</div>` : ''}
        <div class="lp-text">
          <p class="lp-title">${title}</p>
          <p class="lp-desc">${desc}</p>
          <p class="lp-host">${new URL(url).host}</p>
        </div>
      </a>
    </figure>
    `;
  }
}

window.customElements.define('link-preview', LinkPreviewElem);
