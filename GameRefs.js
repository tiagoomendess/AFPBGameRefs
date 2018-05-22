var request     = require('request');
var cheerio     = require('cheerio');
var fs          = require('fs');

var link = "http://www.afpbarcelos.pt/noticias?page=9";
var nextPageLink = null;
var min_date = new Date("2017-09-01");
var max_date = new Date("2018-06-01");
var exit = false;

console.log("Searching between " + min_date + " and " + max_date);

readNews();

function readNews() {

    var $ = null;

    request(link, function(error, response, body) {

        console.log("Requesting " + link);
    
        $ = cheerio.load(body);
        
        nextPageLink = $('.pagination li:last-child a').attr('href').trim();

        $('.col-lg-12 .list-group').each(function(i, noticia) {

            link = $(this).children('a').attr('href');
            title = $(this).children('a').children('h4').text();
            string_date = $(this).children('a').children('small').text().trim();

            var year = string_date.substring(6, 11);
            var month = string_date.substring(3, 5);
            var day = string_date.substring(0, 2);
            
            date = new Date(year + "-" + month + "-" + day);

            //Se já for uma data muito antiga, terminar pesquisa
            if (date.getTime() < min_date.getTime()) {
                exit = true;
                return;
            }
            
            //Se for uma data mais recente que a que queremos, ignora
            if (date.getTime() < max_date.getTime() && title === "ÁRBITROS NOMEADOS") {
                console.log('Found Match!');
                inspectNews(link);
            }

        });

        if (!exit) {
            link = nextPageLink;
            readNews();
        }

    });

}

function inspectNews(link) {

    var $ = null;
    
    console.log("Inspecting referees at " + link);

    request(link, function(error, response, body) {

        $ = cheerio.load(body);

        $('.col-lg-12 table tbody tr').each(function(i, element) {

            if (i === 0)
                return;

            var date = $(this).children('td:nth-child(1)').text().trim();
            var teams = $(this).children('td:nth-child(3)').text().trim().split(" X ");
            var ref = $(this).children('td:nth-child(5)').text().trim();
            var competition = $(this).children('td:nth-child(4)').text().trim();
            
            console.log(date + " - " + competition + " - " + teams + " - " + ref);
        });

    });

}
