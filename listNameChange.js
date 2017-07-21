/*jshint esversion: 6 */

const fs = require('fs')

let cityData = []
if(fs.existsSync('./mapping/compareCityResult.json'))
	cityData = require('./mapping/compareCityResult.json')
if(fs.existsSync('./mapping/compareCityManual.json')){
	let tmp = require('./mapping/compareCityManual.json')
	cityData = cityData.concat(tmp)
}

let attData = []
if(fs.existsSync('./mapping/compareAttResult.json')){
	let tmp = require('./mapping/compareAttResult.json')
	attData = attData.concat(tmp)
}
if(fs.existsSync('./mapping/compareAttManual.json')){
	let tmp = require('./mapping/compareAttManual.json')
	attData = attData.concat(tmp)
}

if(!cityData && !attData){
	console.log('There is no data for listing! Abort!')
	process.exit(1)
}

let cityDataChanged = {}
let attDataChanged = {}
if(fs.existsSync('./mapping/cityNameChanges.json')){
	cityDataChanged = require('./mapping/cityNameChanges.json')
}
if(fs.existsSync('./mapping/attNameChanges.json')){
	attDataChanged = require('./mapping/attNameChanges.json')
}


if(cityData){
	cityData.forEach( item => {
		if(item.bookurData !== item.wikiData){
			cityDataChanged[item.bookurData] = item.wikiData
		}
	})
	console.log('city count = %s', Object.keys(cityDataChanged).length);
	fs.writeFileSync('./mapping/cityNameChanges.json', JSON.stringify(cityDataChanged));
}
if(attData){
	attData.forEach( item => {
		if(item.bookurData !== item.wikiData){
			attDataChanged[item.bookurData] = item.wikiData
		}
	})
	console.log('att count = %s', Object.keys(attDataChanged).length);
	fs.writeFileSync('./mapping/attNameChanges.json', JSON.stringify(attDataChanged));
}

