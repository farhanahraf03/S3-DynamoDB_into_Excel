const XLSX = require('xlsx');


function writeToCSV()
{
    var obj = {
        2020:[
            {'name':'Farhan','number':69},
            {'name':'JKPedia','number':420}
        ],
        2021:[
            {'name':'Bibhu','number':911}
        ]
    };

    var wb = XLSX.utils.book_new();

    for ( var key in obj)
    {   

        if(obj.hasOwnProperty(key))
        {
            var ws = XLSX.utils.json_to_sheet(obj[key]);

            XLSX.utils.book_append_sheet(wb,ws,`sheet ${JSON.stringify(key)}`);

            XLSX.writeFile(wb,'./xlSheets/data.xlsx');

        }
    }

}

writeToCSV();