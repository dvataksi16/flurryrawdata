const rp = require('request-promise');
const fs = require('fs');
const decompress = require('./decompress')

// Times need to be in milliseconds, https://www.epochconverter.com/
/*
 * const config = {
 * format: "JSON", // Either JSON or CSV
 * start_time: 1356998400000, // epoch in milliseconds
 * end_time: 1536578236000, // ms
 * wait_time: 5 * 60 * 1000, // check job status every 5 minutes
 * period: 30 * 24 * 60 * 60 * 1000, // 30 days, 24 hours, 60 min, 60 sec, 1000 ms
 * api_key: "~~~YOUR API KEY HERE~~~",
 * token: "~~YOUR TOKEN~~"
 *}; //
 */

// Either uncomment the lines above and enter your tokens, or create a new module that exports
// the config as an object.
const config = require('./config') // for security reasons, I have put tokens in separate file

const download_queue = [];
let waiting_job_queue = [];

// Body object for the request to Flurry API to create job
function createJobRequestObject(start_time) {
    return JSON.stringify({
        "data": {
            "type": "rawData",
            "attributes": {
                "startTime": start_time,
                "endTime": start_time + config.period,
                "outputFormat": config.format,
                "apiKey": config.api_key
            }
        }
    });
}

// The actual request object to be processed by request-promise
function createJobRequest(start_time) {
    return {
        method: 'POST',
        uri: 'https://rawdata.flurry.com/pulse/v1/rawData',
        body: createJobRequestObject(start_time),

        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/vnd.api+json'
        },
        'auth': { 'bearer': config.token }
    };
}

// create the request and return promise
function createJob(start_time) {
    return rp(createJobRequest(start_time)).
        then((data) => {
            const data_obj = JSON.parse(data);

            if (data_obj && data_obj.data && data_obj.data.id) {
                waiting_job_queue.push(data_obj.data.id)
            }
        }).
        catch(console.log)
}

// this object is used by request-promise to check on the job status
function createPollRequest(job_id) {
    return {
        method: 'GET',
        uri: `https://rawdata.flurry.com/pulse/v1/rawData/${job_id}?fields[rawData]=requestStatus,s3URI`,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/vnd.api+json',
            'accept': 'application/vnd.api+json'
        },
        'auth': { 'bearer': config.token }
    };
}

// Returns a promise that checks the status of the job.
// if the status is success, then move the job to the download queue
function checkJobStatus(job_id) {
    return rp(createPollRequest(job_id)).
        then((data) => {
            const data_obj = JSON.parse(data);

            if (data_obj.data.attributes.requestStatus === "Success") {
                waiting_job_queue = waiting_job_queue.filter((jid) => jid !== job_id);
                download_queue.push({
                    id: job_id,
                    uri: data_obj.data.attributes.s3URI
                });
            }
        }).
        catch(console.log)
}

// Returns a promise to download the file.  Could pipe through 
// GUnzip here and avoid the second decompress step
function download(uri, filename) {
    const ext = `${config.format.toLocaleLowerCase()}.gz`;

    return new Promise((resolve, reject) => {
        let ws = rp.get(uri).pipe(fs.createWriteStream(`${filename}.${ext}`));
        ws.on('close', () => {
            resolve();
        })
        .on('error', () => {
            reject("Download Error...");
        })
    });
}

// Need to wait until the jobs have finished, not constantly poll.
// This function is used ahead of the while loop in main
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

// The primary function
async function main() {

    const job_reqs = [];

    // Phase 1 : generate job requests
    for (let job_start = config.start_time; job_start < config.end_time; job_start += config.period) {
        job_reqs.push(createJob(job_start, config.period));
    }

    await Promise.all(job_reqs);

    const total_jobs = waiting_job_queue.length;

    console.log(total_jobs, 'jobs were created');

    fs.mkdir('./output', () => { });

    // Phase 2: Check the Job Status
    while (waiting_job_queue.length > 0) {
        await sleep(config.wait_time);
        console.log("Checking job statuses...");

        const check_wait_promises = waiting_job_queue.map((jobid) => checkJobStatus(jobid));

        await Promise.all(check_wait_promises);

        // Phase 3: Download Jobs as they become complete
        const downloading_promises = download_queue.map((job) => download(job.uri, `./output/${job.id}`))

        await Promise.all(downloading_promises);

        // progress
        console.log(`${total_jobs - waiting_job_queue.length}/${total_jobs} jobs completed.`);
    }

    console.log("Finished Downloading, decompressing...");

    // Phase 4: Decompress output to unzipped folder.
    await decompress();

    console.log("Finished!");
}


// Call the program
main();