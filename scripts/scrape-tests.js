const fs = require('fs');
const path = require('path');

const logPath = path.join(
    process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config'),
    '..',
    '.gemini/antigravity/brain/f0be041e-354f-4323-8fcc-981ed3cc7a24/.system_generated/logs/overview.txt'
);

// We'll hardcode the path for Emmy Lou's windows machine as a fallback:
const fallbackUrl = "C:\\Users\\Emmy Lou\\.gemini\\antigravity\\brain\\f0be041e-354f-4323-8fcc-981ed3cc7a24\\.system_generated\\logs\\overview.txt";

let logData = "";
try {
    logData = fs.readFileSync(fallbackUrl, 'utf8');
} catch(e) {
    console.error("Could not read overview text.", e.message);
    process.exit(1);
}

// Find the brutal stress test battery block
const startIdx = logData.lastIndexOf("# 🔥 Brutal Stress Test Battery");
if (startIdx === -1) {
    console.error("Could not find the test battery in logs.");
    process.exit(1);
}

const batteryText = logData.slice(startIdx);
const tables = [...batteryText.matchAll(/\| # \|(.*?)\n((?:\|.*?\|\n)+)/g)];

let testManifest = {};

tables.forEach((match, index) => {
    let catRegex = new RegExp(`## ${index + 1}\\. (.*?)\\n`);
    let catMatch = batteryText.match(catRegex);
    let categoryName = catMatch ? catMatch[1].trim() : `Category ${index + 1}`;
    
    let header = match[1].trim();
    let rows = match[2].trim().split('\n');
    
    let parsedRows = rows.map(r => {
        let cols = r.split('|').map(c => c.trim()).filter(c => c !== '');
        return cols;
    });

    // Remove the separator row '---'
    parsedRows = parsedRows.filter(r => !r[0].includes('---'));

    testManifest[`cat${index+1}`] = {
        name: categoryName,
        tests: parsedRows
    };
});

fs.writeFileSync("test-manifest.json", JSON.stringify(testManifest, null, 2));
console.log("Successfully parsed " + Object.keys(testManifest).length + " tables into test-manifest.json");
