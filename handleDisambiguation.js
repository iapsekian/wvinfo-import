/*jshint esversion: 6 */

//useage: node handleDisambiguation.js City ---> for content type City
//useage: node handleDisambiguation.js Att ---> for content type Attraction
//useage: node handleDisambiguation.js Att nationalpark.json ---> for content type Attraction
//
const fs=require('fs')
const MongoClient = require('mongodb').MongoClient
const wikiUtil = require('./lib/wikiUtil.js')

const mdbUrl4Wiki = 'mongodb://192.168.2.248:27017/en_wikipedia'

let ctnType = process.argv[2]
if(!ctnType)
	ctnType = 'City'

let listFile = process.argv[3]

let disambiguations
if(listFile)
	disambiguations = require('./mapping/compare-' + listFile + '-' + ctnType +'NoResult.json')
else
	disambiguations = require('./mapping/compare' + ctnType + 'NoResult.json')

let result = []

let start = async () => {
	let count = disambiguations.length
	let i = 0
	while(i<count){
		let item = disambiguations[i]
		if(item.wikiDataType === 'disambiguation'){
			let pages = await wikiUtil.dealDisambiguation(item)
			item.remark = pages
			result.push(item)
		}

		i++
	}
	console.log('Total %s disambiguation count = %s', ctnType, result.length)
	if(listFile)
		fs.writeFileSync('./mapping/compare-' + listFile + '-' + ctnType + 'Disambiguation.json', JSON.stringify(result));
	else
		fs.writeFileSync('./mapping/compare' + ctnType + 'Disambiguation.json', JSON.stringify(result));
}

start()
