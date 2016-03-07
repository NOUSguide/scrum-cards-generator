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
        data.issues.forEach(function(entry) {
            entry.forEach(function(issue) {
                if (issue.id) {
                    makeCode(issue.id);
                }
            });
        });
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
}

function prepareTemplateData(url, ids) {
    var api = new RedmineAPI({ url: url });
    var issuesPromises = ids.map(function(id) {
        return api.getIssueById(id);
    } );
    var cardsCountPerPage = 12;
    if (issuesPromises.length % cardsCountPerPage != 0) {
        var count = (issuesPromises.length % cardsCountPerPage - cardsCountPerPage) * -1;
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

function makeCode(id) {
    var qrCodeId = 'qrcode'+id;
    console.log('qrCodeId %s', qrCodeId);
    var link = "https://redmine.nousguide.com/issues/" + id;
    var qrcode = new QRCode(document.getElementById(qrCodeId), {
        text: link,
        width: 60,
        height: 60,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    qrcode.makeCode(link);
}
