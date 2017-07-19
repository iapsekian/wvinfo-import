const fs=require('fs')
const MongoClient = require('mongodb').MongoClient
const wikiUtil = require('./lib/wikiUtil.js')

const mdbUrl4Wiki = 'mongodb://10.211.55.113:27017/en_wikipedia'

let ctnType = process.argv[2]
if(!ctnType)
	ctnType = 'City'

let disambiguations = require('./mapping/compare' + ctnType + 'NoResult.json')
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
	fs.writeFileSync('./mapping/compare' + ctnType + 'Disambiguation.json', JSON.stringify(result));
}

start()
