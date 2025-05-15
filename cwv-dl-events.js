// Core Web Vitals - GTM Tag Deferral Script

// Step 1: Make sure the web-vitals library is loaded.
// Add to <head>: <script src="https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js" defer></script>

(function() {
  // Ensure dataLayer is initialized
  window.dataLayer = window.dataLayer || [];

  // --- Configuration ---
  // Set to true if INP should also be a condition for 'cwv_all_ready'. Usually keep it 'false' unless INP is a specific issue.
  const waitForINPForReadyEvent = false; // Defaulting to LCP & CLS for "viewport ready"

  // --- State Variables ---
  let lcpReported = false;
  let clsReported = false;
  let inpReported = false; // We'll track INP even if not part of the main "ready" event
  let cwvViewportReadyEventFired = false;
  let cwvAllReadyEventFired = false; // For a potential LCP+CLS+INP event

  /**
   * Pushes an individual Core Web Vital metric to the dataLayer.
   * @param {object} metric The metric object from the web-vitals library.
   */
  function sendIndividualCWVMetric(metric) {
    const data = {
      event: `cwv_${metric.name.toLowerCase()}`, // e.g., cwv_lcp, cwv_cls, cwv_inp
      cwvMetricName: metric.name,
      cwvMetricValue: metric.value,
      cwvMetricId: metric.id,
      cwvMetricRating: metric.rating,
      // Include navigationType and delta if they exist on the metric
    };
    if (metric.navigationType !== undefined) {
      data.cwvMetricNavigationType = metric.navigationType;
    }
    if (metric.delta !== undefined) {
      data.cwvMetricDelta = metric.delta;
    }
    window.dataLayer.push(data);
    // console.log(`CWV Metric Reported to dataLayer: ${metric.name}`, data);
  }

  /**
   * Checks if LCP and CLS have been reported, and if so, fires the 'cwv_viewport_ready' event.
   * This event signifies that the main content is likely visible and stable.
   */
  function checkAndFireViewportReadyEvent() {
    if (lcpReported && clsReported && !cwvViewportReadyEventFired) {
      window.dataLayer.push({
        event: 'cwv_viewport_ready'
      });
      cwvViewportReadyEventFired = true;
      // console.log('Event pushed to dataLayer: cwv_viewport_ready');

      // If we are not waiting for INP for the "all ready" event, fire it now.
      if (!waitForINPForReadyEvent) {
        checkAndFireAllReadyEvent();
      }
    }
  }

  /**
   * Checks if all designated CWVs (LCP, CLS, and optionally INP) have been reported.
   * If so, fires the 'cwv_all_ready' event.
   */
  function checkAndFireAllReadyEvent() {
    const conditionsMet = waitForINPForReadyEvent ?
      (lcpReported && clsReported && inpReported) :
      (lcpReported && clsReported); // If not waiting for INP, this relies on cwv_viewport_ready logic

    if (conditionsMet && !cwvAllReadyEventFired) {
       window.dataLayer.push({
        event: 'cwv_all_ready' // General readiness event
      });
      cwvAllReadyEventFired = true;
      // console.log('Event pushed to dataLayer: cwv_all_ready');
    }
  }

  // Check if the web-vitals library is loaded
  if (typeof webVitals !== 'undefined' && webVitals.onLCP) {
    webVitals.onLCP(metric => {
      sendIndividualCWVMetric(metric);
      lcpReported = true;
      checkAndFireViewportReadyEvent();
      if (waitForINPForReadyEvent) { // Only check all_ready if INP is a dependency
          checkAndFireAllReadyEvent();
      }
    });

    webVitals.onCLS(metric => {
      sendIndividualCWVMetric(metric);
      clsReported = true;
      checkAndFireViewportReadyEvent();
      if (waitForINPForReadyEvent) { // Only check all_ready if INP is a dependency
          checkAndFireAllReadyEvent();
      }
    });

    webVitals.onINP(metric => {
      sendIndividualCWVMetric(metric);
      inpReported = true;
      // INP reporting doesn't trigger 'cwv_viewport_ready' on its own, but it can contribute to 'cwv_all_ready' if configured at the top of the script.
      if (waitForINPForReadyEvent) {
          checkAndFireAllReadyEvent();
      }
    });

    // console.log('Web Vitals listeners registered.');

  } else {
    console.warn('Web Vitals library not found. CWV-based GTM deferral will not work.');
  }
})();
