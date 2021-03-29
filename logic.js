const aws = require('aws-sdk'); //aws-sdk for handling aws api calls
const moment = require('moment'); //moment for date parsing and formatting
const XLSX = require('xlsx'); //xlsx for object to csv conversion

var masterContent=[]; //stores contents of all the objects in the bucket
var yearArr = []; //stores the year of LastModified object
var masterCSV = new Map(); //Map with key as year and value as objects created in that year
var dynamoData = [];

//AWS Config update
aws.config.update({
    accessKeyId:'',//your access key
    secretAccessKey:'',//your secret access key
    region:'us-east-1'
});

//Bucket name and MaxKeys is the max no of objects to be fetched in a single call
var params = {Bucket:'s3tocsvbucket',MaxKeys:2};

//Dynamo DB Table name
var dynamoParams = {TableName:'complaint_table'};


//retrieve all items from dynamo db
function getDynamo()
{
    var documentClient = new aws.DynamoDB.DocumentClient();
    documentClient.scan(dynamoParams, function(err,data){
        if(err) console.log(err);
        else {dynamoData = data.Items; console.log(dynamoData);}
    });
}

getDynamo();    //call to retrieve data from dynamoDB


(async function getS3Data (){ //1)change function name

    try{

        aws.config.setPromisesDependency(); //support for promises in aws when calling service operations

        var s3 = new aws.S3(); //create s3 object
        const response = await s3.listObjectsV2(params).promise(); //wait for the response from aws

        masterContent = masterContent.concat(response.Contents); //add the objects retreived to the array

        if(response.IsTruncated) //if more objects are to be fetched the IsTruncated is set to true
        {
            params.ContinuationToken = response.NextContinuationToken; //set starting point as next object
            await getS3Data();   //recursive call
        }

    }

    catch(e)
    {
        console.log(`Error ${e}`);
    }


})().then(()=>{

    console.log("------------Unsorted Response-----------\n",masterContent); // print all objects in bucket

    //Sort array of Objects by Date asc
    masterContent.sort((a,b)=>{
        return a.LastModified - b.LastModified;
    });

    let fullDateArr=[];

    masterContent.map((val,idx)=>{
        var dateFull = moment(Date.parse(val.LastModified)).format('DD-MM-YYYY');//convert obj into date and format it
        fullDateArr = fullDateArr.concat(dateFull);

        var dateYear = moment(Date.parse(val.LastModified)).year();//retrieve year from the date 
        yearArr = yearArr.concat(dateYear);

        val.LastModified = dateFull;
        val.Size_in_MB = val.Size;
        
        delete val.Size;
        delete val.ETag;
        delete val.StorageClass;

        val.Size_in_MB = (val.Size_in_MB/(1024*1024)).toFixed(3); //convert int bytes into float megabytes

        dynamoData.map((ArrayValue)=>{  //combine S3 and DynamoDb data into a single array of objects
            if(val.Key === ArrayValue.file_name)
            {
                val.complaint_ID = ArrayValue.complaint_ID;
                val.device_type = ArrayValue.device_type;
            }
        });

    });


}).then(()=>{

    yearArr.map((val,idx)=>{

        if(masterCSV.has(val))//if year is already present as key
        {
            masterCSV.set(val,[...masterCSV.get(val),masterContent[idx]]);//then append the object to the array
        }

        else //if the year is not present as key
        {
            masterCSV.set(val,[masterContent[idx]]);//then create year as key and value as array of the object
        }

    });


    console.log("-------------Master CSV-------------\n",masterCSV);


}).then(()=>{

    var wb = XLSX.utils.book_new(); //create a new workbook

    masterCSV.forEach((yearObjectsArr,key)=>{       

        if(typeof(XLSX) == undefined) XLSX = require('xlsx');

        var ws = XLSX.utils.json_to_sheet(yearObjectsArr); //create a new worksheet for each year

        XLSX.utils.book_append_sheet(wb,ws,`${key}`); //append worksheet to workbook

        XLSX.writeFile(wb,"./xlSheets/data.xlsx"); //convert csv into xlsx

    });

});


