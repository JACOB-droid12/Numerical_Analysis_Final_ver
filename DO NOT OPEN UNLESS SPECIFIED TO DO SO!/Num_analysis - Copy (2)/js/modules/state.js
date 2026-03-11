/* ==========================================================================
   STATE.JS — Global Event Bus (Pub/Sub)
   Single source of truth for cross-module data sharing.
   ========================================================================== */

const State = (() => {
    const events = {};

    /**
     * Subscribe to an event topic.
     * @param {string} eventName 
     * @param {function} callback 
     * @returns {function} Cleanup function to unsubscribe
     */
    function subscribe(eventName, callback) {
        if (!events[eventName]) {
            events[eventName] = [];
        }
        events[eventName].push(callback);

        // Return an unsubscribe function
        return () => {
            events[eventName] = events[eventName].filter(cb => cb !== callback);
        };
    }

    /**
     * Broadcast data to all subscribers of a topic.
     * @param {string} eventName 
     * @param {any} data 
     */
    function publish(eventName, data) {
        if (!events[eventName]) return;
        events[eventName].forEach(callback => callback(data));
    }

    return { subscribe, publish };
})();
