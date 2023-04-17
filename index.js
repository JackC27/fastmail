const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

// Set your Fastmail credentials
const FASTMAIL_USERNAME = `${process.env.FASTMAIL_USERNAME}`;
const FASTMAIL_PASSWORD = `${process.env.FASTMAIL_PASSWORD}`;

// Configure the IMAP connection
const imap = new Imap({
  user: FASTMAIL_USERNAME,
  password: FASTMAIL_PASSWORD,
  host: 'imap.fastmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

// Connect to Fastmail
imap.once('ready', () => {
  openInbox((err, box) => {
    if (err) throw err;

    // Search for emails
    imap.search(['ALL'], (err, results) => {
      if (err) throw err;

      // Fetch emails
      const fetchOptions = {
        bodies: [''],
        struct: true,
        markSeen: false,
      };

      const f = imap.fetch(results, fetchOptions);

      f.on('message', (msg, seqno) => {
        msg.on('body', (stream, info) => {
          simpleParser(stream, {}, (err, parsed) => {
            console.log(`Message ${seqno}: ${parsed.subject}`);
          });
        });
      });

      f.once('error', (err) => {
        console.log(`Fetch error: ${err}`);
      });

      f.once('end', () => {
        console.log('Done fetching all messages');
        imap.end();
      });
    });
  });
});

imap.once('error', (err) => {
  console.error(`IMAP error: ${err}`);
});

imap.once('end', () => {
  console.log('Connection ended');
});

// Connect to Fastmail IMAP server
imap.connect();
