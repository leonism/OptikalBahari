// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0]
      const metrics = {
        dns: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcp: perfData.connectEnd - perfData.connectStart,
        ttfb: perfData.responseStart - perfData.requestStart,
        download: perfData.responseEnd - perfData.responseStart,
        dom: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        load: perfData.loadEventEnd - perfData.navigationStart,
      }

      // Send to analytics (optional)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_timing', {
          custom_map: { metric1: 'ttfb', metric2: 'load_time' },
          metric1: Math.round(metrics.ttfb),
          metric2: Math.round(metrics.load),
        })
      }
    }, 0)
  })
}
