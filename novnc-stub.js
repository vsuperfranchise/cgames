// Simple stub to avoid ReferenceError when noVNC library fails to load
if (typeof window.RFB === 'undefined') {
    window.RFB = function(canvas, url) {
        console.warn('RFB stub: noVNC library not loaded. Connection request to', url);
        this.addEventListener = function(event, handler) {
            // no-op
        };
        this.sendPassword = function() {
            // no-op
        };
        return this;
    };
}
