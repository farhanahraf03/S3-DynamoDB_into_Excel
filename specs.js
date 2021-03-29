export default class Specs
{

    constructor()
    {
        var AWS_specs = 
        {
            accessKeyId:'AKIA3JDWRWPUGIEP6SXG',
            secretAccessKey:'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',
            region:'us-east-1'
        };

        var S3_specs = 
        {
            Bucket:'s3tocsvbucket',
            MaxKeys:2
        };

        var DynamoDB_specs = 
        {
            TableName:'complaint_table'
        };

    }

    get_AWS_specs(){    console.log( JSON.stringify(this.AWS_specs));     }

    get_S3_specs(){    return this.S3_specs;   }

    get_DynamoDB_specs(){   return this.DynamoDB_specs;}

    
};

let obj = new Specs();
console.log(obj.get_AWS_specs());