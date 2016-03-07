'use strict';

Handlebars.registerHelper('lc', function(text) {
    return text ? text.toLowerCase() : '';
});

Handlebars.registerHelper("moduloIf", function(index_count,mod, block) {

  if(parseInt(index_count) != 0 &&
    parseInt(index_count)%(mod)=== 0){
    return block.fn(this);}
});

function generateCards() {
    var url      = 'https://redmine.nousguide.com/';
    var ids      = $('#ids').val().split(/\s*,\s*/).filter(function(id) {return id.match(/^\d+$/)});
    var template = Handlebars.compile( $('#cards-template').html() );

    if (!url || !ids.length) {
        alert('Check fields');
        return;
    }

    localStorage.redmineURL = url;

    prepareTemplateData(url, ids).then(function(data) {
        $('#cards').html( template(data) );
    });
}

function init() {
    $('#url').val( localStorage.redmineURL || '' );
    $('#submit').click(generateCards);
    $('#ids').keydown(function (event) {
        var keypressed = event.keyCode || event.which;
        if (keypressed == 13) {
            generateCards();
        }
    });
    setTimeout(function() { $('#ids').focus(); }, 1000);

    // TODO: remove
    // generateCards();
}

function prepareTemplateData(url, ids) {
    var api = new RedmineAPI({ url: url });

    var issuesPromises = ids.map(function(id) {
        return api.getIssueById(id);
    } );

    var cardsCountPerPage = 12;
    if (issuesPromises.length % cardsCountPerPage != 0) {

        var count = (issuesPromises.length % cardsCountPerPage - cardsCountPerPage) * -1;
        console.log('EmptyCount %s', count);
        for (var i = 0; i < count; i++) {
            issuesPromises.push(new Issue());
        }
    }

    return Promise.all(issuesPromises).then(function(issues) {
        return { issues: splitArray(issues,3) };
    }).catch(console.error);
}

function splitArray(array, step) {
    var newArray = [];

    for (var i = 0; i < array.length; i+= step) {
        var newSubArray = [];

        for (var j = i; j < i+step; j++) {
            if (j>array.length) break;

            newSubArray.push(array[j]);
        };

        newArray.push(newSubArray);
    }

    return newArray;
}
