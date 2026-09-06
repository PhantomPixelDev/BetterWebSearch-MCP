/**
 * Fill the homepage npm/GitHub counters.
 *
 * npm's named download windows lag by about a week — `point/last-week` reports
 * 0 for a package that has thousands of downloads — so the explicit-date
 * `range` endpoint is used instead and the windows are summed here. That is one
 * request for the whole history rather than three for three windows.
 *
 * Every slot starts as an em dash and is only overwritten on success, so a
 * failed or blocked request leaves the page honest instead of showing a zero.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-npm-package]");
  if (root === null) {
    return;
  }
  var pkg = root.getAttribute("data-npm-package");

  /** Format for display: 1958 -> "2k", 12400 -> "12.4k". */
  function compact(n) {
    if (n < 1000) {
      return String(n);
    }
    if (n < 10000) {
      return (Math.round(n / 100) / 10).toFixed(1).replace(/\.0$/, "") + "k";
    }
    if (n < 1000000) {
      return Math.round(n / 1000) + "k";
    }
    return (Math.round(n / 100000) / 10).toFixed(1).replace(/\.0$/, "") + "M";
  }

  /** YYYY-MM-DD, `days` before today, in UTC to match npm's day buckets. */
  function isoDay(days) {
    var d = new Date(Date.now() - days * 86400000);
    return d.toISOString().slice(0, 10);
  }

  function set(name, value) {
    var el = root.querySelector('[data-npm-stat="' + name + '"]');
    if (el !== null) {
      el.textContent = value;
    }
  }

  // npm caps a single range request at 18 months.
  var url =
    "https://api.npmjs.org/downloads/range/" +
    isoDay(540) +
    ":" +
    isoDay(0) +
    "/" +
    encodeURIComponent(pkg);

  fetch(url)
    .then(function (r) {
      return r.ok ? r.json() : Promise.reject(new Error(String(r.status)));
    })
    .then(function (data) {
      var days = Array.isArray(data.downloads) ? data.downloads : [];
      var total = 0;
      var week = 0;
      var weekFrom = isoDay(7);
      for (var i = 0; i < days.length; i += 1) {
        var n = days[i].downloads || 0;
        total += n;
        if (days[i].day > weekFrom) {
          week += n;
        }
      }
      set("total", compact(total));
      set("week", compact(week));
    })
    .catch(function () {
      /* Leave the em dashes: no number beats a wrong one. */
    });

  fetch("https://api.github.com/repos/PhantomPixelDev/BetterWebSearch-MCP")
    .then(function (r) {
      return r.ok ? r.json() : Promise.reject(new Error(String(r.status)));
    })
    .then(function (repo) {
      if (typeof repo.stargazers_count === "number") {
        set("stars", compact(repo.stargazers_count));
      }
    })
    .catch(function () {});
})();
