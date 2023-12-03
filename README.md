# api-diff

CLI tool to compare endpoints output

## How to use

Build src: `npm install && npm run build`
Run the tool: `node build/api-diff.js`

Before run you have to populate `endpoints.txt` file with endpoints list which will be compared between both servers.

## Functional requirements

* Support Cookie Authentication
* Individual credentials for both servers
* Compare JSON response in order agnostic way
* Support `white list` for JSON keys (XPath)
* Multi thread processing
* Ability to repeat the request in case of an error
* Support testsuites

## Requirements

The took was tested on
* npm v10.2.3
* node v20.10.0

## TODO

* print input parameters (https://stackoverflow.com/questions/4351521/how-do-i-pass-command-line-arguments-to-a-node-js-program-and-receive-them)
* validate .env file and set defaults
