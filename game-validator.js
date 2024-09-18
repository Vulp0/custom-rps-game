const { sha3_256 } = require('js-sha3');
const parameters = process.argv.slice(2);

if(parameters.length < 2) {
    console.log("ERROR: TWO ARGUMENTS ARE REQUIRED");
    
} else {
    console.log("HMAC: " + sha3_256(parameters[0] + parameters[1]));
}