const fs=require('fs')
const MongoClient = require('mongodb').MongoClient

const mdbUrl4Wiki = 'mongodb://10.211.55.113:27017/en_wikipedia'
// const wvListing = require('../wvinfo-import/data/wikivoyage-listings-en-latest.json')
const wvListing = require('./log/insertWVListing-failedData.json')
let countDown = wvListing.length
let successCount = 0
let failedCount = 0
let failedLog = ''
let failedData = []

console.log('Original Count = %s',wvListing.length);

MongoClient.connect(mdbUrl4Wiki, (err, db) => {
	if(err === null) console.log('Connected *******');

	let cltWikipedia = db.collection('wvListing')

	let wait4All = () => {
		countDown--
		console.log('countDown = %s', countDown);
		if(!countDown){
			db.close()
			console.log('Original Count = %s',wvListing.length);
			console.log('Success Count = %s', successCount);		
			console.log('Failed Count = %s', failedCount);
			fs.writeFileSync('./log/insertWVListing-failedLog.log', failedLog);		
			fs.writeFileSync('./log/insertWVListing-failedData.json', JSON.stringify(failedData));		
		}
	}

	wvListing.forEach( (data,idx) => {

		console.log('index = %s', idx);

		cltWikipedia.findOne({article:data.article, title:data.title})
		.then( result => {
			// console.log('%s = %s, %s = %s', data.article, result.article, data.title, result.title);
			if(result === null){
				console.log('data: %s - enter insertion process......', data.title);
				cltWikipedia.insert(data, function(e) {
				    if (e) {
				    	failedCount++
				      	console.log('----- Failed - data: '+ data.title + ' ,error - ' +e)
				      	failedLog += '----- Failed - data: '+ data.title + ' ,error - ' +e + '\n'
				      	failedData.push(data)
				      	wait4All()
				    } else {
				    	successCount++
				    	console.log('Success Count = %s', successCount);
//				    	console.log('----- data: %s - was inserted successfully!!', data.title)
				    	wait4All()
				    }
				})				
			} else {
				wait4All()
			}
		})
		.catch( error => {
			console.log('data: %s error happened!! error = %s', data.article+' - '+data.title, error);
			failedCount++
			failedLog += 'data: '+ data.article+' - '+data.title +' error happened!! error = ' + error + '\n'
			failedData.push(data)
			wait4All()
		})

	})

})