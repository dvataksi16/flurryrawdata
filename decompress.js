const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// loops through ./output folder and unzips all files
// to ./unzipped folder

async function decompress() {
    fs.mkdir('./unzipped', () => { });

    await new Promise((resolve_fs, reject_fs) => {
        fs.readdir('./output', async (err, files) => {
            if (err) {
                reject_fs(new Error(err));
            } else {

                // map all the files to promises
                const write_promises = files.map((file) => {

                    // pop the 'gz' from the end of the filename
                    const file_name = file.split(".");
                    file_name.pop();

                    // create paths
                    const out_file_path = path.join('./unzipped', file_name.join("."));
                    const in_file_path = path.join('./output', file);

                    // pipe the read through GUnzp and out to write
                    const rstrm = fs.createReadStream(in_file_path);
                    const wstrm = fs.createWriteStream(out_file_path);
                    const stream = rstrm.pipe(zlib.createGunzip()).pipe(wstrm);

                    // wait on the stream to finish writing
                    return new Promise((resolve) => {
                        stream.on('close', () => {
                            console.log(`Unzipped ${in_file_path} => ${out_file_path}`)
                            resolve();
                        })
                    }).catch((err2) => {
                        console.log(in_file_path, err2);
                    });
                })

                // wait on the map'd promises to resolve
                await Promise.all(write_promises);

                resolve_fs(); // let outer promise resolve
            }
        });
    });
}

module.exports = decompress;