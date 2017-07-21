/*jshint esversion: 6 */

const fs = require('fs')

let data = []
// if(fs.existsSync('./mapping/compareCityResult.json'))
// 	data = require('./mapping/compareCityResult.json')
// 	console.log(data.length);
// if(fs.existsSync('./mapping/compareCityManual.json')){
// 	let tmp = require('./mapping/compareCityManual.json')
// 	console.log(tmp.length);
// 	data = data.concat(tmp)
// 	console.log(data.length);
// }
if(fs.existsSync('./mapping/compareAttResult.json')){
	let tmp = require('./mapping/compareAttResult.json')
	console.log(tmp.length);
	data = data.concat(tmp)
	console.log(data.length);
}
if(fs.existsSync('./mapping/compareAttManual.json')){
	let tmp = require('./mapping/compareAttManual.json')
	console.log(tmp.length);
	data = data.concat(tmp)
	console.log(data.length);
}

if(!data){
	console.log('There is no data for listing! Abort!')
	process.exit(1)
}

let dataChanged = {}

data.forEach( item => {
	if(item.bookurData !== item.wikiData){
		dataChanged[item.bookurData] = item.wikiData
	}
})

console.log('count = %s', Object.keys(dataChanged).length);
fs.writeFileSync('./log/nameChanges.json', JSON.stringify(dataChanged));
