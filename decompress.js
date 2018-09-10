const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

async function decompress() {
    fs.mkdir('./unzipped', () => {});

    fs.readdir('./output', async (err, files) => {
        if (err)
            console.error(err);
        else {
            let write_promises = files.map(file => {
                let file_name = file.split(".");
                file_name.pop();
                let out_file_path = path.join('./unzipped', file_name.join("."));
                let in_file_path = path.join('./output', file);

                let r = fs.createReadStream(in_file_path);
                let w = fs.createWriteStream(out_file_path);
                let stream = r.pipe(zlib.createGunzip()).pipe(w);
                return new Promise((resolve, reject) => {
                    stream.on('close', () => {
                        console.log(`Unzipped ${in_file_path} => ${out_file_path}`)
                        resolve();
                    })
                }).catch(err=> {
                    console.log(in_file_path, err);
                });
            })

            await Promise.all(write_promises);
        }
    });
}

module.exports = decompress;