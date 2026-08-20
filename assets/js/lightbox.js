/*
 * Image lightbox for post figures.
 *
 * Post figures are capped to the column width (and to 80vh), which keeps the
 * page readable but shrinks dense diagrams. Clicking one opens it over the page;
 * clicking again switches between "fit the screen" and the image's natural size,
 * so a tall architecture diagram can be inspected without leaving the article.
 *
 * Self-contained: injects its own styles, no dependencies.
 */
(function () {
    var CSS = [
        '.post-content img{cursor:zoom-in}',
        '.lb{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;',
        'padding:28px 20px;background:rgba(0,0,0,.92);opacity:0;transition:opacity .18s ease;',
        'overflow:auto;overscroll-behavior:contain}',
        // Where the browser can blur what is behind the overlay, the page stays
        // visible as a soft backdrop and the scrim can be much lighter.
        '@supports ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){',
        '.lb{background:rgba(0,0,0,.45);-webkit-backdrop-filter:blur(18px) saturate(115%);',
        'backdrop-filter:blur(18px) saturate(115%)}}',
        '.lb.is-open{opacity:1}',
        '.lb-fig{margin:auto;display:flex;flex-direction:column;align-items:center;gap:14px}',
        '.lb-img{display:block;max-width:94vw;max-height:86vh;width:auto;height:auto;',
        'background:#fff;border-radius:4px;box-shadow:0 14px 50px rgba(0,0,0,.55);cursor:zoom-in}',
        '.lb-img.is-zoomed{max-width:none;max-height:none;cursor:zoom-out}',
        '.lb-cap{max-width:min(900px,90vw);color:#e8e8e8;font-size:14px;line-height:1.55;text-align:center}',
        '.lb-close{position:fixed;top:14px;right:16px;width:40px;height:40px;padding:0;border:0;',
        'border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:24px;line-height:38px;',
        'cursor:pointer}',
        '.lb-close:hover{background:rgba(255,255,255,.3)}',
        '.lb-close:focus:not(:focus-visible){outline:none}',
        '.lb-close:focus-visible{outline:2px solid #fff;outline-offset:3px}',
        '.lb-hint{color:#9a9a9a;font-size:12px}',
        '@media (prefers-reduced-motion:reduce){.lb{transition:none}}'
    ].join('');

    function init() {
        var imgs = document.querySelectorAll('.post-content img');
        if (!imgs.length) return;

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var lb, img, cap, hint, lastFocus;

        function build() {
            lb = document.createElement('div');
            lb.className = 'lb';
            lb.setAttribute('role', 'dialog');
            lb.setAttribute('aria-modal', 'true');
            lb.setAttribute('aria-label', 'Enlarged figure');

            var fig = document.createElement('figure');
            fig.className = 'lb-fig';

            img = document.createElement('img');
            img.className = 'lb-img';

            cap = document.createElement('figcaption');
            cap.className = 'lb-cap';

            hint = document.createElement('div');
            hint.className = 'lb-hint';

            var close = document.createElement('button');
            close.className = 'lb-close';
            close.setAttribute('aria-label', 'Close');
            close.innerHTML = '&times;';
            close.addEventListener('click', hide);

            fig.appendChild(img);
            fig.appendChild(cap);
            fig.appendChild(hint);
            lb.appendChild(fig);
            lb.appendChild(close);
            document.body.appendChild(lb);

            // Clicking the image toggles between fitted and natural size; clicking
            // anywhere else in the overlay dismisses it.
            img.addEventListener('click', function (ev) {
                ev.stopPropagation();
                if (img.naturalWidth <= img.clientWidth && !img.classList.contains('is-zoomed')) return;
                img.classList.toggle('is-zoomed');
                setHint();
            });
            lb.addEventListener('click', hide);
        }

        function setHint() {
            if (!img.naturalWidth) return;
            var fits = img.naturalWidth <= img.clientWidth && !img.classList.contains('is-zoomed');
            hint.textContent = fits ? '' :
                img.classList.contains('is-zoomed') ? 'Click the image to fit the screen'
                                                    : 'Click the image to view it at full size';
        }

        function show(source) {
            if (!lb) build();
            img.classList.remove('is-zoomed');
            img.src = source.currentSrc || source.src;
            img.alt = source.alt || '';

            var figcap = source.closest('figure') && source.closest('figure').querySelector('figcaption');
            cap.textContent = figcap ? figcap.textContent : (source.alt || '');

            lastFocus = document.activeElement;
            // Lock the page without the layout shift that removing the scrollbar
            // would otherwise cause: hide overflow, then pad by the scrollbar width.
            var gutter = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.overflow = 'hidden';
            if (gutter > 0) document.body.style.paddingRight = gutter + 'px';

            lb.style.display = 'flex';
            requestAnimationFrame(function () { lb.classList.add('is-open'); });
            img.decode ? img.decode().then(setHint, setHint) : setHint();
            lb.querySelector('.lb-close').focus();
        }

        function hide() {
            if (!lb) return;
            lb.classList.remove('is-open');
            document.documentElement.style.overflow = '';
            document.body.style.paddingRight = '';
            setTimeout(function () { lb.style.display = 'none'; }, 180);
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        Array.prototype.forEach.call(imgs, function (el) {
            if (el.closest('a')) return;                 // already a link, leave it alone
            el.addEventListener('click', function () { show(el); });
        });

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && lb && lb.classList.contains('is-open')) hide();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
