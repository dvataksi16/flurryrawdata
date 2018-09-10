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

//rp(createJobRequest(config.start_time, config.period)).then(console.log).catch(console.log)

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

rp(createPollRequest(jobid)).then(console.log).catch(console.log)