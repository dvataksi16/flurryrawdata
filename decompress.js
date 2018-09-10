const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

async function decompress() {
    fs.mkdir('./unzipped', () => { });

    await new Promise((resolve_fs, reject_fs) => {
        fs.readdir('./output', async (err, files) => {
            if (err) {
                reject_fs(new Error(err));
            } else {
                const write_promises = files.map((file) => {
                    const file_name = file.split(".");

                    file_name.pop();
                    const out_file_path = path.join('./unzipped', file_name.join("."));
                    const in_file_path = path.join('./output', file);

                    const rstrm = fs.createReadStream(in_file_path);
                    const wstrm = fs.createWriteStream(out_file_path);
                    const stream = rstrm.pipe(zlib.createGunzip()).pipe(wstrm);


                    return new Promise((resolve) => {
                        stream.on('close', () => {
                            console.log(`Unzipped ${in_file_path} => ${out_file_path}`)
                            resolve();
                        })
                    }).catch((err2) => {
                        console.log(in_file_path, err2);
                    });
                })

                await Promise.all(write_promises);

                resolve_fs();
            }
        });
    });
}

module.exports = decompress;