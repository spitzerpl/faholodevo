// FAHOLO Website Application Logic

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  renderDevotionals();
  initCarousel();
  initModal();
  openDevoFromHash();
});

// Converts bold verse numbers like (<b>3a</b>) or (<b>5</b>) to links
// using the devotional's main passage reference for book/chapter context.
// Also handles ranges like (<b>3–8</b>), (<b>9-11</b>), (<b>15–16</b>), comma-separated (<b>23b, 25a</b>)
function linkVerseNumbers(html, reference) {
  // Parse the main reference to get biblia book and starting chapter
  // Reference formats: "Romans 5:1–10", "Ephesians 1:15–23", "2 Peter 1:3–15", "Titus 2:2"
  const refMatch = reference.match(/^(.+?)\s+(\d+):(\d+)(?:\s*[\-\u2013]\s*(\d+)(?::(\d+))?)?/);
  if (!refMatch) return html;

  const bookName = refMatch[1];
  const mainChapter = refMatch[2];

  // Resolve the book name to a biblia.com URL name
  const bookLookup = {
    'Romans': 'Romans', 'Rom': 'Romans',
    '1 Corinthians': '1Corinthians', '1 Cor': '1Corinthians',
    '2 Corinthians': '2Corinthians', '2 Cor': '2Corinthians',
    'Galatians': 'Galatians', 'Gal': 'Galatians',
    'Ephesians': 'Ephesians', 'Eph': 'Ephesians',
    'Philippians': 'Philippians', 'Phil': 'Philippians',
    'Colossians': 'Colossians', 'Col': 'Colossians',
    '1 Thessalonians': '1Thessalonians', '1 Thess': '1Thessalonians',
    '2 Thessalonians': '2Thessalonians', '2 Thess': '2Thessalonians',
    '1 Timothy': '1Timothy', '1 Tim': '1Timothy',
    '2 Timothy': '2Timothy', '2 Tim': '2Timothy',
    'Titus': 'Titus', 'Tt': 'Titus',
    'Philemon': 'Philemon',
    'Hebrews': 'Hebrews', 'Heb': 'Hebrews',
    'James': 'James', 'Jam': 'James',
    '1 Peter': '1Peter', '1 Pet': '1Peter',
    '2 Peter': '2Peter', '2 Pet': '2Peter',
    '1 John': '1John', '1 Jn': '1John',
    '2 John': '2John', '2 Jn': '2John',
    '3 John': '3John', '3 Jn': '3John',
    'Jude': 'Jude',
    'Revelation': 'Revelation', 'Rev': 'Revelation',
    'Matthew': 'Matthew', 'Matt': 'Matthew',
    'Mark': 'Mark', 'Mk': 'Mark',
    'Luke': 'Luke', 'Lk': 'Luke',
    'John': 'John', 'Jn': 'John',
    'Acts': 'Acts', 'Act': 'Acts',
    'Genesis': 'Genesis', 'Gen': 'Genesis',
    'Exodus': 'Exodus', 'Ex': 'Exodus',
    'Numbers': 'Numbers', 'Num': 'Numbers',
    'Deuteronomy': 'Deuteronomy', 'Deut': 'Deuteronomy',
    'Psalms': 'Psalm', 'Psalm': 'Psalm', 'Ps': 'Psalm',
    'Proverbs': 'Proverbs', 'Prov': 'Proverbs',
    'Ecclesiastes': 'Ecclesiastes', 'Eccl': 'Ecclesiastes',
    'Isaiah': 'Isaiah', 'Isa': 'Isaiah',
    'Jeremiah': 'Jeremiah', 'Jer': 'Jeremiah',
    'Hosea': 'Hosea', 'Hos': 'Hosea',
  };

  const bibliaBook = bookLookup[bookName];
  if (!bibliaBook) return html;

  // Match <b>number</b> patterns (with optional letter suffixes and ranges)
  // Handles: (<b>3</b>), (<b>3a</b>), (<b>3–8</b>), (<b>9-11</b>), (<b>15a</b>)
  // Also handles comma-separated like <b>23b, 25a</b>
  return html.replace(/<b>(\d+[a-d]?(?:\s*[\-\u2013]\s*\d+[a-d]?)?(?:,\s*\d+[a-d]?)*)<\/b>/g, (match, verseContent) => {
    // Extract the first verse number (strip letter suffix) for the URL
    const firstVerse = verseContent.match(/^(\d+)/)[1];

    // Check if it's a range
    const rangeMatch = verseContent.match(/^(\d+)[a-d]?\s*[\-\u2013]\s*(\d+)[a-d]?$/);
    let url;
    if (rangeMatch) {
      url = `https://biblia.com/bible/esv/${bibliaBook}/${mainChapter}/${rangeMatch[1]}-${rangeMatch[2]}`;
    } else {
      url = `https://biblia.com/bible/esv/${bibliaBook}/${mainChapter}/${firstVerse}`;
    }

    return `<a href="${url}" target="_blank" rel="noopener" class="bible-ref verse-num"><b>${verseContent}</b></a>`;
  });
}

// ---- FAHOLO Highlighting ----
// Highlights the words faith, hope, and love in scripture text with theme colors
function highlightFaholo(html) {
  // Process text outside of HTML tags only
  return html.replace(/(<[^>]+>)|(\b)(faith)(\b)|(\b)(hope)(\b)|(\b)(love[ds]?)(\b)/gi, (match, tag, pre1, faith, post1, pre2, hope, post2, pre3, love, post3) => {
    if (tag) return tag;
    if (faith) return pre1 + '<span class="faholo-faith">' + faith + '</span>' + post1;
    if (hope) return pre2 + '<span class="faholo-hope">' + hope + '</span>' + post2;
    if (love) return pre3 + '<span class="faholo-love">' + love + '</span>' + post3;
    return match;
  });
}

// ---- Navigation ----
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  // Scroll shadow
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile toggle
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

// ---- Devotional Grid ----
function renderDevotionals() {
  const grid = document.getElementById('devotionalGrid');
  if (!grid) return;

  const published = DEVOTIONALS.filter(d => d.status === 'published');
  const unpublished = DEVOTIONALS.filter(d => d.status !== 'published');

  // Render published devotionals as normal cards
  published.forEach((dev, i) => {
    const card = document.createElement('div');
    card.className = 'devotional-card';
    card.setAttribute('data-theme', dev.theme);
    card.setAttribute('data-id', dev.id);

    const tagsHtml = dev.tags.map(t =>
      `<span class="tag tag-${t}">${t}</span>`
    ).join('');

    card.innerHTML = `
      <div class="devotional-number">Devotional ${i + 1}</div>
      <h3>${dev.title.replace('Feasting on FAithHOpeLOve with ', '')}</h3>
      <div class="verse-ref">${dev.reference}</div>
      <p class="preview">${dev.preview}</p>
      <div class="devotional-tags">${tagsHtml}</div>
    `;

    card.addEventListener('click', () => openModal(dev));
    grid.appendChild(card);
  });

  // Render "Coming Soon" card if there are unpublished devotionals
  if (unpublished.length > 0) {
    const comingSoon = document.createElement('div');
    comingSoon.className = 'devotional-card coming-soon-card';
    comingSoon.setAttribute('data-theme', 'all');

    // Deduplicate by reference name (e.g., two 2 Tim 4:6-8 files = one listing)
    const uniqueRefs = [...new Set(unpublished.map(d => d.reference))];
    const listHtml = uniqueRefs.join(' \u00B7 ');

    comingSoon.innerHTML = `
      <div class="devotional-number">Coming Soon</div>
      <h3>More Feasting Ahead</h3>
      <p class="coming-soon-list">${uniqueRefs.length} more devotionals are being reviewed:</p>
      <p class="coming-soon-references">${listHtml}</p>
    `;

    grid.appendChild(comingSoon);
  }
}

// ---- Carousel ----
function initCarousel() {
  const track = document.getElementById('devotionalGrid');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  if (!track || !prevBtn || !nextBtn) return;

  function getScrollAmount() {
    // Scroll by however many cards are visible
    const card = track.querySelector('.devotional-card');
    if (!card) return 340;
    const cardWidth = card.offsetWidth + 20; // 20 = gap
    const visibleCards = Math.max(1, Math.floor(track.offsetWidth / cardWidth));
    return cardWidth * visibleCards;
  }

  function updateButtons() {
    prevBtn.disabled = track.scrollLeft <= 5;
    nextBtn.disabled = track.scrollLeft + track.offsetWidth >= track.scrollWidth - 5;
  }

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateButtons);
  updateButtons();

  // Update button states on resize
  window.addEventListener('resize', updateButtons);
}

// ---- Modal ----
function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  const subscribeLink = document.getElementById('modalSubscribeLink');

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  subscribeLink.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
    document.getElementById('subscribe').scrollIntoView({ behavior: 'smooth' });
  });

}

function openModal(dev) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  // Link bold verse numbers (RefTagger won't recognize these)
  const linkedBody = linkVerseNumbers(dev.body, dev.reference);

  // Make modal visible BEFORE injecting content so RefTagger can see it
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  content.innerHTML = `
    <h2>${dev.title.replace('Feasting on FAithHOpeLOve with ', 'Feasting on FAHOLO with ')}</h2>
    <div class="modal-verse-ref">${dev.reference}</div>
    <div class="modal-scripture">${highlightFaholo(dev.scripture)}</div>
    <div class="modal-body">${linkedBody}</div>
  `;

  // Set URL hash for deep linking
  history.replaceState(null, '', '#devo-' + dev.id);

  // Wire up copy link button
  const copyBtn = document.getElementById('copyLinkBtn');
  copyBtn.onclick = () => {
    const url = window.location.origin + window.location.pathname + '#devo-' + dev.id;
    navigator.clipboard.writeText(url).then(() => {
      const label = copyBtn.querySelector('span');
      label.textContent = 'Copied!';
      setTimeout(() => { label.textContent = 'Copy Link'; }, 2000);
    });
  };

  // ---- Study / Reflection mode toggle ----
  const modalBody = content.querySelector('.modal-body');
  const hasProse = modalBody && modalBody.querySelector('a.bible-ref.prose-ref');
  const toggleRow = document.getElementById('modeToggleRow');
  const toggle = document.getElementById('modeToggle');
  const studyLabel = document.getElementById('studyLabel');
  const reflectionLabel = document.getElementById('reflectionLabel');

  if (hasProse && toggleRow && toggle) {
    toggleRow.style.display = '';
    const savedMode = localStorage.getItem('faholo-mode');
    const isReflection = savedMode === 'reflection';

    toggle.checked = isReflection;
    modalBody.classList.toggle('reflection-mode', isReflection);
    studyLabel.classList.toggle('active', !isReflection);
    reflectionLabel.classList.toggle('active', isReflection);

    toggle.onchange = () => {
      const refl = toggle.checked;
      modalBody.classList.toggle('reflection-mode', refl);
      studyLabel.classList.toggle('active', !refl);
      reflectionLabel.classList.toggle('active', refl);
      localStorage.setItem('faholo-mode', refl ? 'reflection' : 'study');
    };
  } else if (toggleRow) {
    toggleRow.style.display = 'none';
    if (toggle) toggle.onchange = null;
  }

  // Let RefTagger detect and link standard references in the modal
  triggerRefTagger(content);

  // RefTagger's popups don't work on dynamically tagged content in modals,
  // so we attach our own custom tooltips to ALL bible links (both verse-num
  // and RefTagger-created links) after RefTagger has finished tagging.
  setTimeout(() => initVerseTooltips(content), 700);
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  // Remove any lingering tooltip
  const tip = document.getElementById('verseTooltip');
  if (tip) tip.classList.remove('visible');
  // Clear the URL hash
  history.replaceState(null, '', window.location.pathname);
}

// ---- Deep Link ----
// Opens a devotional if the URL contains #devo-{id}
function openDevoFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/^#devo-(\d+)$/);
  if (!match) return;
  const id = parseInt(match[1], 10);
  const dev = DEVOTIONALS.find(d => d.id === id);
  if (dev) openModal(dev);
}

// ---- RefTagger Re-scan Helper ----
// Tries multiple approaches to get RefTagger to process dynamic content
function triggerRefTagger(element) {
  // Approach 1: refTagger.tag(element) — documented API
  if (typeof refTagger !== 'undefined' && typeof refTagger.tag === 'function') {
    setTimeout(() => {
      try { refTagger.tag(element); } catch(e) { console.log('refTagger.tag(el) failed:', e); }
    }, 100);
  }

  // Approach 2: refTagger.tag() with no args — full page rescan
  if (typeof refTagger !== 'undefined' && typeof refTagger.tag === 'function') {
    setTimeout(() => {
      try { refTagger.tag(); } catch(e) { console.log('refTagger.tag() failed:', e); }
    }, 200);
  }

  // Approach 3: Logos.ReferenceTagging.tag() — older API
  if (typeof Logos !== 'undefined' && Logos.ReferenceTagging && typeof Logos.ReferenceTagging.tag === 'function') {
    setTimeout(() => {
      try { Logos.ReferenceTagging.tag(element); } catch(e) {}
    }, 200);
  }

  // Approach 4: Completely reload the RefTagger script (nuclear option)
  setTimeout(() => {
    // Check if RefTagger actually tagged anything in the modal
    const tagged = element.querySelectorAll('.rtBibleRef, [data-rt-ref]');
    if (tagged.length === 0) {
      console.log('RefTagger did not tag modal content — reloading script');
      reloadRefTagger();
    }
  }, 500);
}

function reloadRefTagger() {
  // Remove old script
  const oldScript = document.querySelector('script[src*="reftagger"]');
  if (oldScript) oldScript.remove();

  // Re-inject fresh script (triggers full page scan on load)
  const s = document.createElement('script');
  s.src = 'https://api.reftagger.com/v2/RefTagger.js';
  document.body.appendChild(s);
}

// ---- Verse Tooltips ----
// Custom tooltip for ALL bible links inside the modal (both verse-num and RefTagger links).
// RefTagger's own popups don't fire on dynamically tagged modal content,
// so this tooltip handles everything inside modals.
// Get your free API key at https://api.esv.org/
const ESV_API_KEY = '0df2c779719ab1500e044d48a27222131300af8f';
const verseCache = {};

function initVerseTooltips(container) {
  // Create tooltip element if it doesn't exist
  let tooltip = document.getElementById('verseTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'verseTooltip';
    tooltip.className = 'verse-tooltip';
    tooltip.innerHTML = '<div class="verse-tooltip-content"></div>';
    document.body.appendChild(tooltip);
    tooltip.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  }

  // Target ALL bible links in the modal: our verse-num links AND RefTagger-created links.
  // RefTagger's own popups don't work on dynamically tagged modal content,
  // so our custom tooltip handles everything inside the modal.
  const links = container.querySelectorAll('a.bible-ref.verse-num, a.rtBibleRef, a.bible-ref.prose-ref');
  links.forEach(link => {
    link.addEventListener('mouseenter', handleVerseHover);
    link.addEventListener('mouseleave', handleVerseLeave);
    link.addEventListener('focus', handleVerseHover);
    link.addEventListener('blur', handleVerseLeave);
  });
}

let tooltipTimeout = null;

function handleVerseHover(e) {
  const link = e.currentTarget;
  const href = link.getAttribute('href');
  if (!href) return;

  let reference = null;

  // Source 1: Our biblia.com links (verse-num links)
  // Format: https://biblia.com/bible/esv/BookName/Chapter/Verse-Range
  const bibliaMatch = href.match(/biblia\.com\/bible\/esv\/(.+)$/);
  if (bibliaMatch) {
    let refPath = decodeURIComponent(bibliaMatch[1]);
    refPath = refPath.replace(/^(\d)([A-Z])/, '$1 $2');
    const parts = refPath.split('/');
    if (parts.length === 3) {
      reference = parts[0] + ' ' + parts[1] + ':' + parts[2];
    } else if (parts.length === 2) {
      reference = parts[0] + ' ' + parts[1];
    }
    if (reference) reference = reference.replace(/(\d+)\.(\d+)$/, '$1:$2');
  }

  // Source 2: RefTagger ref.ly links
  // Format: https://ref.ly/...  — use the link's visible text as the reference
  if (!reference && href.includes('ref.ly')) {
    reference = link.textContent.trim();
  }

  // Source 3: RefTagger data attributes
  if (!reference && link.dataset.reference) {
    reference = link.dataset.reference;
  }

  // Fallback: use the link text itself as the reference
  if (!reference) {
    reference = link.textContent.trim();
  }

  if (!reference) return;

  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => showVerseTooltip(link, reference), 300);
}

function handleVerseLeave() {
  clearTimeout(tooltipTimeout);
  // Small delay before hiding so user can hover onto the tooltip itself
  tooltipTimeout = setTimeout(() => {
    const tooltip = document.getElementById('verseTooltip');
    if (tooltip && !tooltip.matches(':hover')) {
      tooltip.classList.remove('visible');
    }
  }, 200);
}

async function showVerseTooltip(anchor, reference) {
  const tooltip = document.getElementById('verseTooltip');
  const content = tooltip.querySelector('.verse-tooltip-content');

  // Show loading state
  content.innerHTML = '<em>Loading ' + reference + '...</em>';
  positionTooltip(tooltip, anchor);
  tooltip.classList.add('visible');

  // Check cache first
  if (verseCache[reference]) {
    content.innerHTML = verseCache[reference];
    positionTooltip(tooltip, anchor);
    return;
  }

  try {
    let verseHtml;
    const apiRef = encodeURIComponent(reference);

    if (ESV_API_KEY && ESV_API_KEY !== 'PASTE_YOUR_ESV_API_KEY_HERE') {
      // Primary: ESV API (requires free key from api.esv.org)
      const resp = await fetch(`https://api.esv.org/v3/passage/text/?q=${apiRef}&include-headings=false&include-footnotes=false&include-verse-numbers=true&include-short-copyright=false&include-passage-references=false`, {
        headers: { 'Authorization': `Token ${ESV_API_KEY}` }
      });
      if (!resp.ok) throw new Error('ESV API error');
      const data = await resp.json();
      if (data.passages && data.passages.length > 0) {
        verseHtml = `<div class="verse-tooltip-ref">${data.canonical || reference}</div>` +
          `<div class="verse-tooltip-text">${data.passages[0].trim()}</div>` +
          `<div class="verse-tooltip-version"><a href="https://www.esv.org" target="_blank" rel="noopener">ESV</a></div>`;
      }
    } else {
      // Fallback: bible-api.com (free, no key, WEB translation)
      const resp = await fetch(`https://bible-api.com/${apiRef}?verse_numbers=true`);
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      if (data.text) {
        verseHtml = `<div class="verse-tooltip-ref">${data.reference || reference}</div>` +
          `<div class="verse-tooltip-text">${data.text.trim()}</div>` +
          `<div class="verse-tooltip-version">WEB</div>`;
      }
    }

    if (verseHtml) {
      verseCache[reference] = verseHtml;
      content.innerHTML = verseHtml;
    } else {
      content.innerHTML = '<em>' + reference + '</em>';
    }
  } catch (err) {
    content.innerHTML = '<em>' + reference + '</em><br><small>Click to read verse</small>';
  }

  positionTooltip(tooltip, anchor);
}

function positionTooltip(tooltip, anchor) {
  const rect = anchor.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  const scrollX = window.scrollX || window.pageXOffset;

  // Position above the link by default
  let top = rect.top + scrollY - tooltipRect.height - 8;
  let left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);

  // If tooltip would go above viewport, show below instead
  if (rect.top - tooltipRect.height - 8 < 0) {
    top = rect.bottom + scrollY + 8;
  }

  // Keep within horizontal bounds
  const maxLeft = window.innerWidth - tooltipRect.width - 12;
  if (left < 12) left = 12;
  if (left > maxLeft) left = maxLeft;

  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
}

