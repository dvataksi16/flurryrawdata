Overview
--------

This program is to facilitate the download of Flurry Analytics data using the [Raw Data API](https://developer.yahoo.com/flurry/docs/analytics/rdd/).

The [Raw Data API](https://developer.yahoo.com/flurry/docs/analytics/rdd/) creates jobs based on request periods of 31 days or less.  To download data for periods of longer than 31 days, you need to break up the requests into smaller request periods.

The return data format is either JSON or CSV and the returned file is gzip'd. If you request the format in CVS and the events have extras on them, they will be returned in JSON format for that column.  JSON includes commas, so this will probably throw off your parsing unless you extract the characters between `{ }`

These requests require both an API key and a Bearer Token. Please read the [Raw Data API](https://developer.yahoo.com/flurry/docs/analytics/rdd/) for setup directions.

Install
-------

Download/Clone this git repo
`git clone https://github.com/jpoag/flurryrawdata.git`

Dependencies:
`npm install `

Edit:
Edit the `Config` object at the top of the file to include your API key and Access Token.
Also, adjust the start and end dates using an [Epoch Converter](https://www.epochconverter.com/) to grab the milliseconds.

Run:
`npm start`

Wait until the jobs complete.  I was able to download 5 years of data between 10 - 15 minutes.