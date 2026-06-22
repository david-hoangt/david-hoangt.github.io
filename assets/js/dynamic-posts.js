(function () {
  "use strict";

  var SITE = {
    name: "David's Log",
    author: "David Hoang",
    description: "Document my learning notes."
  };

  // Brief intro shown at the top of each tag page (?tag=<name>).
  var TAG_INFO = {
    "transformer": "The attention-based architecture behind modern language models. It processes a whole sequence in parallel, stacking self-attention and feed-forward blocks to mix information across tokens.",
    "attention": "The mechanism that lets a model weigh every other token by learned relevance and pull in the most useful context. Self-attention and its variants are the core of the transformer.",
    "neural-network": "A model built from layers of weighted connections and nonlinear activations that learns a function from data by adjusting its weights.",
    "backpropagation": "The algorithm that trains neural networks: it propagates the loss gradient backward through the layers via the chain rule so each weight knows how to update.",
    "normalization": "Techniques that rescale activations — BatchNorm, LayerNorm, RMSNorm — to keep their distribution stable, which speeds up and steadies training of deep networks.",
    "layernorm": "Layer Normalization standardizes a token's activations across the feature dimension (zero mean, unit variance), making training stable independent of batch size.",
    "rmsnorm": "Root Mean Square Normalization, a lighter LayerNorm variant that rescales activations by their RMS without subtracting the mean — cheaper and standard in recent LLMs.",
    "positional-encoding": "Methods that inject token order into the otherwise position-agnostic transformer, from fixed sinusoids to learned and rotary (RoPE) schemes."
  };

  function getRoot() {
    return window.SITE_ROOT || "./";
  }

  function fetchPosts(cb) {
    var root = getRoot();
    fetch(root + "posts.json")
      .then(function (r) { return r.json(); })
      .then(function (posts) {
        posts.sort(function (a, b) { return b.date.localeCompare(a.date); });
        cb(posts);
      })
      .catch(function (err) {
        console.error("Failed to load posts.json:", err);
        cb([]);
      });
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function shortMonth(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[d.getMonth()];
  }

  function postUrl(slug) {
    return getRoot() + "posts/" + slug + "/";
  }

  function tagUrl(tag) {
    return getRoot() + "tags/?tag=" + encodeURIComponent(tag);
  }

  // --- Renderers ---

  function renderPostList(container, posts) {
    container.innerHTML = "";
    if (posts.length === 0) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }
    posts.forEach(function (post) {
      var article = document.createElement("article");
      article.className = "post-entry";
      article.innerHTML =
        '<header class="entry-header"><h2>' + escapeHtml(post.title) + "</h2></header>" +
        '<section class="entry-content"><p>' + escapeHtml(post.summary) + "...</p></section>" +
        '<footer class="entry-footer">Date: ' + formatDate(post.date) +
        "  |  Estimated Reading Time: " + escapeHtml(post.readingTime) +
        "  |  Author: " + escapeHtml(post.author || SITE.author) + "</footer>" +
        '<a class="entry-link" aria-label="post link to ' + escapeHtml(post.title) +
        '" href="' + postUrl(post.slug) + '"></a>';
      container.appendChild(article);
    });
  }

  function renderArchive(container, posts) {
    container.innerHTML = "";
    if (posts.length === 0) {
      container.innerHTML = "<p>No posts yet.</p>";
      return;
    }
    var byYear = {};
    posts.forEach(function (post) {
      var y = post.date.substring(0, 4);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(post);
    });

    var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
    years.forEach(function (year) {
      var yearPosts = byYear[year];
      var byMonth = {};
      yearPosts.forEach(function (post) {
        var m = shortMonth(post.date);
        if (!byMonth[m]) byMonth[m] = [];
        byMonth[m].push(post);
      });

      var yearDiv = document.createElement("div");
      yearDiv.className = "archive-year";
      var yearHtml = '<h2 class="archive-year-header">' + year +
        '<sup class="archive-count">&nbsp;&nbsp;' + yearPosts.length + "</sup></h2>";

      var months = Object.keys(byMonth);
      months.forEach(function (month) {
        var mPosts = byMonth[month];
        yearHtml += '<div class="archive-month">' +
          '<h3 class="archive-month-header">' + month +
          '<sup class="archive-count">&nbsp;&nbsp;' + mPosts.length + "</sup></h3>" +
          '<div class="archive-posts">';
        mPosts.forEach(function (post) {
          yearHtml += '<div class="archive-entry">' +
            '<h3 class="archive-entry-title">' + escapeHtml(post.title) + "</h3>" +
            '<div class="archive-meta">Date: ' + formatDate(post.date) +
            "  |  Estimated Reading Time: " + escapeHtml(post.readingTime) +
            "  |  Author: " + escapeHtml(post.author || SITE.author) + "</div>" +
            '<a class="entry-link" aria-label="post link to ' + escapeHtml(post.title) +
            '" href="' + postUrl(post.slug) + '"></a></div>';
        });
        yearHtml += "</div></div>";
      });

      yearDiv.innerHTML = yearHtml;
      container.appendChild(yearDiv);
    });
  }

  function renderTags(container, posts) {
    container.innerHTML = "";
    var tagParam = new URLSearchParams(window.location.search).get("tag");

    if (tagParam) {
      // Show posts for a specific tag
      var filtered = posts.filter(function (p) {
        return p.tags && p.tags.indexOf(tagParam) !== -1;
      });
      var header = document.createElement("header");
      header.className = "page-header";
      var intro = TAG_INFO[tagParam]
        ? '<p class="tag-intro">' + escapeHtml(TAG_INFO[tagParam]) + "</p>"
        : "";
      header.innerHTML = '<h1>Tag: ' + escapeHtml(tagParam) + "</h1>" + intro +
        '<p><a href="' + getRoot() + 'tags/">&larr; All tags</a></p>';
      container.appendChild(header);

      var listDiv = document.createElement("div");
      renderPostList(listDiv, filtered);
      container.appendChild(listDiv);
      return;
    }

    // Show all tags with counts
    var tagCounts = {};
    posts.forEach(function (post) {
      if (!post.tags) return;
      post.tags.forEach(function (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    var header = document.createElement("header");
    header.className = "page-header";
    header.innerHTML = "<h1>Tags</h1>";
    container.appendChild(header);

    var ul = document.createElement("ul");
    ul.className = "terms-tags";
    var sortedTags = Object.keys(tagCounts).sort(function (a, b) {
      return tagCounts[b] - tagCounts[a] || a.localeCompare(b);
    });
    sortedTags.forEach(function (tag) {
      var li = document.createElement("li");
      li.innerHTML = '<a href="' + tagUrl(tag) + '">' + escapeHtml(tag) +
        " <sup><strong><sup>" + tagCounts[tag] + "</sup></strong></sup></a>";
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  function renderSearch(container, posts) {
    var input = document.getElementById("searchInput");
    var results = document.getElementById("searchResults");
    if (!input || !results) return;

    input.addEventListener("input", function () {
      var query = input.value.toLowerCase().trim();
      results.innerHTML = "";
      if (!query) return;

      var matches = posts.filter(function (post) {
        return post.title.toLowerCase().indexOf(query) !== -1 ||
          post.summary.toLowerCase().indexOf(query) !== -1 ||
          (post.tags && post.tags.join(" ").toLowerCase().indexOf(query) !== -1);
      });

      if (matches.length === 0) {
        results.innerHTML = '<li class="search-no-results">No results found</li>';
        return;
      }

      matches.forEach(function (post) {
        var li = document.createElement("li");
        li.className = "post-entry";
        li.innerHTML =
          '<header class="entry-header"><h2>' + escapeHtml(post.title) + "</h2></header>" +
          '<section class="entry-content"><p>' + escapeHtml(post.summary.substring(0, 200)) + "...</p></section>" +
          '<a class="entry-link" aria-label="post link to ' + escapeHtml(post.title) +
          '" href="' + postUrl(post.slug) + '"></a>';
        results.appendChild(li);
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // --- Public API ---
  window.DynamicPosts = {
    fetchPosts: fetchPosts,
    renderPostList: renderPostList,
    renderArchive: renderArchive,
    renderTags: renderTags,
    renderSearch: renderSearch,
    SITE: SITE
  };
})();
