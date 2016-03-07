var Issue = (function() {
    'use strict';

    function Issue() {
        this.id;
        this.subject = "";
        this.description = "";
        this.due_date = "";
        this.project = new Model();
        this.tracker = new Model();
        this.fixed_version = new Model();
    }
    return Issue;
})();
