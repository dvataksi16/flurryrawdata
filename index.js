const rp = require('request-promise');
const fs = require('fs');
const path = require('path');

// Times need to be in milliseconds, https://www.epochconverter.com/
/*
const config = {
    format: "JSON", // Either JSON or CSV
    start_time: 1356998400000, // epoch in milliseconds
    end_time: 1536578236000, // ms
    period: 30 * 24 * 60 * 60 * 1000, // 30 days, 24 hours, 60 min, 60 sec, 1000 ms
    api_key: "~~~YOUR API KEY HERE~~~",
    token: "~~YOUR TOKEN~~"
}; //*/

var download_queue = [];
var waiting_job_queue = [];
var failed_job_queue = [];

const config = require('./config') // for security reasons, I have put tokens in separate file

function createJobRequestObject(start_time, period) {
    return JSON.stringify({
        "data": {
            "type": "rawData",
            "attributes": {
                "startTime": start_time,
                "endTime": start_time + period,
                "outputFormat": config.format,
                "apiKey": config.api_key
            }
        }
    });
}

function createJobRequest(start_time, period) {
    return {
        method: 'POST',
        uri: 'https://rawdata.flurry.com/pulse/v1/rawData',
        body: createJobRequestObject(start_time, period),
        //json: true, // Automatically stringifies the body to JSON

        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/vnd.api+json'
        },
        'auth': {
            'bearer': config.token
        }
    };
}

function createJob(start_time, period) {
    return rp(createJobRequest(start_time, period))
        .then(data => {
            let data_obj = JSON.parse(data);
            if (data_obj && data_obj.data && data_obj.data.id) {
                waiting_job_queue.push(data_obj.data.id)
            }
        })
        .catch(console.log)
}

//

const jobid = '20950';

function createPollRequest(job_id) {
    return {
        method: 'GET',
        uri: `https://rawdata.flurry.com/pulse/v1/rawData/${job_id}?fields[rawData]=requestStatus,s3URI`,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/vnd.api+json',
            'accept': 'application/vnd.api+json'
        },
        'auth': {
            'bearer': config.token
        }
    };
}

function checkJobStatus(job_id) {
    return rp(createPollRequest(job_id))
        .then(data => {
            let data_obj = JSON.parse(data);
            if (data_obj.data.attributes.requestStatus == "Success") {
                waiting_job_queue = waiting_job_queue.filter(j => j != job_id);
                download_queue.push(data_obj.data.attributes.s3URI);
            }
        })
        .catch(console.log)
}

function download(uri, filename) {
    var ext = config.format.toLocaleLowerCase() + ".gz";

    return rp.get(uri)
        .pipe(fs.createWriteStream(`${filename}.${ext}`));
};

async function main() {
    await checkJobStatus(jobid);

    try {
        fs.mkdir('./output', err => {});
    }
    catch (e) {  }

    let downloading_promises = download_queue.map(uri => {
        download(uri, "./output/test")
    })

    await Promise.all(downloading_promises)
}

main()
