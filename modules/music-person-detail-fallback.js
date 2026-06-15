(function () {
  if (typeof window === "undefined" || typeof window.fetch !== "function" || typeof window.Response !== "function") {
    return;
  }

  var originalFetch = window.fetch.bind(window);
  var detailRoutePattern = /^\/api\/music\/people\/db\/([^/?#]+)$/;

  function getRequestUrl(input) {
    if (typeof input === "string") {
      return input;
    }
    return input && typeof input.url === "string" ? input.url : "";
  }

  function getPersonSearchValue(personId) {
    return decodeURIComponent(String(personId || ""))
      .trim()
      .replace(/[-_]+/g, " ");
  }

  function createResponse(payload) {
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8"
      }
    });
  }

  window.fetch = function patchedMusicPersonDetailFetch(input, init) {
    var requestUrl = getRequestUrl(input);
    var parsedUrl;
    try {
      parsedUrl = new URL(requestUrl, window.location.href);
    } catch (error) {
      return originalFetch(input, init);
    }

    var detailMatch = parsedUrl.pathname.match(detailRoutePattern);
    if (!detailMatch) {
      return originalFetch(input, init);
    }

    var searchValue = getPersonSearchValue(detailMatch[1]);
    if (!searchValue) {
      return originalFetch(input, init);
    }

    var fallbackUrl = new URL("/api/music/people/db", parsedUrl.origin);
    fallbackUrl.searchParams.set("limit", "1");
    fallbackUrl.searchParams.set("page", "1");
    fallbackUrl.searchParams.set("archive", "cache");
    fallbackUrl.searchParams.set("search", searchValue);

    console.warn(
      "Music person detail endpoint unavailable; using targeted archive list fallback.",
      parsedUrl.pathname
    );

    return originalFetch(fallbackUrl.toString(), init)
      .then(function (response) {
        if (!response.ok) {
          return response;
        }
        return response.json().then(function (payload) {
          var rows = Array.isArray(payload && payload.data) ? payload.data : [];
          var row = rows[0] || null;
          return createResponse(Object.assign({}, payload, {
            route: "/api/music/people/db/:personId",
            data: row
          }));
        });
      });
  };
}());
