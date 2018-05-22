var request     = require('request');
var cheerio     = require('cheerio');
var fs          = require('fs');

var link = "http://www.afpbarcelos.pt/noticias";
var nextPageLink = null;
var min_date = new Date("2017-08-30");
var max_date = new Date("2018-06-01");
var exit = false;

var csv_data = "";

console.log("Searching between " + min_date + " and " + max_date);

readNews();

function readNews(callback) {

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
            if (date.getTime() < max_date.getTime() && (title === "ÁRBITROS NOMEADOS" || title === "Árbitros Nomeados")) {
                console.log('Found a Referees Post!');
                inspectNews(link);
            }

        });

        if (!exit) {
            link = nextPageLink;
            readNews();
        } else {
            console.log("Done!");
            setTimeout(writeCsvFile, 2000);
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

            let linha = "";
            let match = null;
            
            let competition = "";
            let referee = "";
            let date = "";
            let teams;

            var tds = $(this).children('td');

            for (let i = 0; i < tds.length; i++) {

                linha += $(tds[i]).text().trim();

                if (i + 1 < tds.length)
                    linha += "|";
                else
                    linha += ",";

            }

            linha = linha.toLowerCase();
            linha = linha.replace(/\./g, '');

            //Get Competition - (\|([a-z\.]+\s)*[0-9]\ª\s[a-z\ã]+\|)|(\|[a-z\.\ç]+\|)|(\|[a-z\.\ç]+\s[a-z\.\ç]+\|)
            match = linha.match(/(\|([a-z\.]+\s)*[0-9]\ª\s[a-z\ã]+\|)|(\|[a-z\.\ç]+\|)|(\|[a-z\.\ç]+\s[a-z\.\ç]+\|)/g);

            if (match) {
                competition = match.toString();
                competition = competition.substring(1, competition.length - 1);
            } else {
                competition = "Desconhecida";
            }

            //Get Referee
            match = linha.match(/\|[a-z\s\.\à\á\ã\â\è\é\ê\ì\í\ò\ó\õ\ô\ù\ú\ç]+\,/g);

            referee = match.toString();
            referee = referee.substring(1, referee.length - 1);

            //Get date
            /**
             * 2017-12-21 - yyyy-mm-dd - [0-9]{4}(\-|\/)[0-9]{2}(\-|\/)[0-9]{2}
             * 21-12-2017 - dd-mm-yyyy - [0-9]{2}(\-|\/)[0-9]{2}(\-|\/)[0-9]{4}
             * 21/12/2017 - dd/mm/yyyy -  //
             */

            match = linha.match(/[0-9]{4}(\-|\/)[0-9]{2}(\-|\/)[0-9]{2}/g);
            let splited;

            if (match) {
                splited = match.toString().split(/\-|\//g, 3);
                date = splited[0] + "-" + splited[1] + "-" + splited[2];
            } else {
                match = linha.match(/[0-9]{2}(\-|\/)[0-9]{2}(\-|\/)[0-9]{4}/g);
                splited = match.toString().split(/\-|\//g, 3);
                date = splited[2] + "-" + splited[1] + "-" + splited[0];
            }

            //Get Teams - \|[a-z\s\.\à\á\ã\â\è\é\ê\ì\í\ò\ó\õ\ô\ù\ú\ç\«\»]+\s+\x\s+[a-z\s\.\à\á\ã\â\è\é\ê\ì\í\ò\ó\õ\ô\ù\ú\ç\«\»]+\|
            match = linha.match(/\|[a-z\s\.\à\á\ã\â\è\é\ê\ì\í\ò\ó\õ\ô\ù\ú\ç\«\»]+\s+\x\s+[a-z\s\.\à\á\ã\â\è\é\ê\ì\í\ò\ó\õ\ô\ù\ú\ç\«\»]+\|/g);
            let str_teams = match.toString();
            str_teams = str_teams.substring(1, str_teams.length - 1);
            teams = str_teams.split(/\s+\x\s+/g, 2);

            csv_data += 
                date + ";" +
                teams[0] + ";" +
                teams[1] + ";" +
                competition + ";" +
                referee + "\n";
            
        });

    });

}

function writeCsvFile() {

    console.log("Writting File...");

    var filename = "output/output-" +  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + ".csv";

    fs.writeFile(filename, csv_data, 'utf8', function(error) {

        if (error)
            console.log("Error writing file!");

    });

    console.log("Finished");

}