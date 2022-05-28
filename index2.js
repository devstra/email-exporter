const Imap = require('imap');
const fs = require('fs');
const { simpleParser } = require('mailparser');

const imap = new Imap({
    user: 'XXXXX',
    password: 'XXXXX',
    host: 'imap.gmx.com',
    port: 993,
    tls: true,
});

imap.once('ready', function () {
    imap.getBoxes((err, mailboxes) => {
        if (err) throw err;

        const boxes = Object.keys(mailboxes);

        for (const boxName of boxes) {
            imap.openBox(boxName, true, function (err, box) {
                if (err) throw err;
                console.log("Saving emails in folder: " + boxName);

                // if box is not empty
                if (box.messages.total && box.messages.total != 0) {
                    // create folder if not exist
                    if (!fs.existsSync(boxName)) {
                        console.log("Creating folder " + boxName);
                        fs.mkdirSync(boxName);
                    }

                    // get all the emails in the folder/mailbox
                    imap.search(['ALL'], function (err, results) {
                        if (err) throw err;
                        const f = imap.fetch(results, { bodies: '' });

                        f.on('message', function (msg, seqno) {
                            msg.on('body', function (stream) {
                                simpleParser(stream, async (err, parsed) => {
                                    if (err) {
                                        console.error("Error #" + seqno);
                                    } else {
                                        console.log("Saving #" + seqno);

                                        fs.writeFile(boxName + "/" + seqno + '.json', JSON.stringify(parsed, null, 4), (err) => {
                                            if (err) {
                                                console.error(err);
                                            }
                                        });
                                    }
                                });
                            });
                        });
                        f.once('error', function (err) {
                            console.log('Fetch error: ' + err);
                        });
                        f.once('end', function () {
                            console.log('Done fetching all messages!');
                            imap.end();
                        });
                    });
                }
            });
        }
    });
});

imap.once('error', function (err) {
    console.log(err);
});

imap.once('end', function () {
    console.log('Connection ended');
});

imap.connect();
