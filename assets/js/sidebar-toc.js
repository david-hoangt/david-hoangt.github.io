(function () {
    function init() {
        var post = document.querySelector('.post-single');
        var sourceToc = document.querySelector('.toc .inner ul');
        if (!post || !sourceToc) return;
        if (document.querySelector('.sidebar-toc')) return;

        var sidebar = document.createElement('aside');
        sidebar.className = 'sidebar-toc';

        var mini = document.createElement('div');
        mini.className = 'sidebar-toc-mini';
        sidebar.appendChild(mini);

        var panel = document.createElement('div');
        panel.className = 'sidebar-toc-panel';

        var title = document.createElement('div');
        title.className = 'sidebar-toc-title';
        title.textContent = 'Contents';
        panel.appendChild(title);

        var list = sourceToc.cloneNode(true);
        list.querySelectorAll('a').forEach(function (a) { a.removeAttribute('aria-label'); });
        panel.appendChild(list);

        sidebar.appendChild(panel);
        document.body.appendChild(sidebar);

        var miniSeed = [];
        Array.from(sourceToc.children).forEach(function (li) {
            var topAnchor = li.querySelector(':scope > a');
            if (topAnchor) miniSeed.push({ anchor: topAnchor, level: 'h1' });
            var nested = li.querySelector(':scope > ul');
            if (nested) {
                Array.from(nested.children).forEach(function (subli) {
                    var subAnchor = subli.querySelector(':scope > a');
                    if (subAnchor) miniSeed.push({ anchor: subAnchor, level: 'h2' });
                });
            }
        });

        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function scrollToHash(hash) {
            var id = decodeURIComponent(hash.substr(1));
            var target = document.getElementById(id);
            if (!target) return false;
            target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
            history.pushState(null, null, '#' + id);
            return true;
        }

        var entries = [];
        miniSeed.forEach(function (e) {
            var hash = e.anchor.getAttribute('href');
            var id = decodeURIComponent(hash.substr(1));
            var el = document.getElementById(id);
            if (!el) return;
            var item = document.createElement('span');
            item.className = 'sidebar-toc-mini-item ' + e.level;
            item.title = e.anchor.textContent;
            item.setAttribute('aria-label', e.anchor.textContent);
            mini.appendChild(item);
            entries.push({ mini: item, link: e.anchor, el: el });
        });

        panel.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (ev) {
                ev.preventDefault();
                scrollToHash(this.getAttribute('href'));
            });
        });

        mini.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') sidebar.classList.remove('open');
        });

        if (!entries.length) return;

        var rafId = null;
        var lastActive = -1;
        function update() {
            rafId = null;
            var offset = 140;
            var activeIdx = -1;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].el.getBoundingClientRect().top - offset <= 0) {
                    activeIdx = i;
                } else {
                    break;
                }
            }
            if (activeIdx === -1 && entries.length) activeIdx = 0;
            if (activeIdx === lastActive) return;
            lastActive = activeIdx;
            entries.forEach(function (h, i) {
                var on = i === activeIdx;
                h.mini.classList.toggle('active', on);
                h.link.classList.toggle('active', on);
                if (on && sidebar.classList.contains('open')) {
                    var lr = h.link.getBoundingClientRect();
                    var sr = panel.getBoundingClientRect();
                    if (lr.top < sr.top || lr.bottom > sr.bottom) {
                        h.link.scrollIntoView({ block: 'nearest' });
                    }
                }
            });
        }
        function onScroll() {
            if (rafId == null) rafId = requestAnimationFrame(update);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        update();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
