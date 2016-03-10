'use strict';

Handlebars.registerHelper('lc', function(text) {
    return text ? text.toLowerCase() : '';
});

function init() {
    $('#loading').hide();
    $('#url').val( localStorage.redmineURL || '' );
    $('#submit').click(generateCards);
    $('#ids').keydown(function (event) {
        var keypressed = event.keyCode || event.which;
        if (keypressed == 13) {
            generateCards();
        }
    });
    $('#filter').keydown(function (event) {
        var keypressed = event.keyCode || event.which;
        if (keypressed == 13) {
            generateCards();
        }
    });

    var params = window.location.search.substr(1);
    if (params != null && params != "") {
        params = transformToAssocArray(params);
        console.log(params);
        console.log('someParam GET value is', params['ids']);
        if (params['ids']) {
            $('#ids').val(params['ids']);
        }
        if (params['filter']) {
            $('#filter').val(params['filter']);
        }
        if (params['ids'] || params['filter']) {
            generateCards();
        }
    }
}

function generateCards() {
    var url      = 'https://redmine.nousguide.com/';
    var ids      = $('#ids').val().split(/\s*,\s*/).filter(function(id) {return id.match(/^\d+$/)});
    var filter   = $('#filter').val().toString().trim();
    $('#submit').hide();
    $('#loading').show();
    localStorage.redmineURL = url;

    if (!filter && !ids.length) {
        alert('Check fields');
        onDone(false);
        return;
    }

    if (filter) {
      var filterParts = filter.split("/issues");
      var jsonFilter = filterParts[0] + "/issues.json" + filterParts[1];
      console.log(jsonFilter);
      getIssuesByFilter(url, jsonFilter).then(function(issues) {
          issues.forEach(function(entry) {
              ids.push(entry.id);
              console.log(entry.id);
         });
         drawCards(url, ids)
       }).catch(console.error);
    } else {
      drawCards(url, ids);
    }
}

function onDone(print) {
    $('#submit').show();
    $('#loading').hide();
    if (print) {
        window.print();
    }
}

function drawCards(url, ids) {
    var template = Handlebars.compile( $('#cards-template').html() );

    prepareTemplateData(url, ids).then(function(data) {
        $('#cards').html( template(data) );
        data.issues.forEach(function(entry) {
            entry.forEach(function(issue) {
                if (issue.id) {
                    makeCode(issue.id);
                }
            });
        });
        onDone(true);
    }).catch(console.error);;
}

function prepareTemplateData(url, ids) {
    var api = new RedmineAPI({ url: url });
    var issuesPromises = ids.map(function(id) {
        return api.getIssueById(id);
    });
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

function getIssuesByFilter(url, filter) {
    var api = new RedmineAPI({ url: url });
    var issuesPromises = api.fetchIssues(filter);
    return issuesPromises;
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

function urldecode(str) {
    return decodeURIComponent((str+'').replace(/\+/g, '%20'));
}

function transformToAssocArray( prmstr ) {
    var params = {};
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = urldecode(tmparr[1]);
    }
    return params;
}
