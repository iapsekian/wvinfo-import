const fs=require('fs')
const Parsoid = require('parsoid')
const MongoClient = require('mongodb').MongoClient

const mdbUrl = 'mongodb://mongo:27017/en_wikipedia'

MongoClient.connect(mdbUrl, (err, db) => {
	if(err === null) console.log('Connected *******');

	let cltWikipedia = db.collection('wikipedia')

	cltWikipedia.find().toArray()
	.then( d => {
		let count = d.length
		let i =0
		let level = {}

		while(i <= count-1){
			let data = d[i]
			if(data.type === 'page' /*&& data.title === 'New York City'*/){
				let text = data.text
				let textKey = Object.keys(text)

				textKey.forEach( key => {
					if(level[key]){
						level[key] += 1
					} else {
						level[key] = 1
					}
				})
				i++
			} else {
				i++
			}
		}

		// let keysSorted = Object.keys(level).sort(function(a,b){return level[b]-level[a]})
		let levelSorted = []
	    for (var prop in level) {
	        if (level.hasOwnProperty(prop)) {
	            levelSorted.push({
	                'key': prop,
	                'value': level[prop]
	            });
	        }
	    }
	    levelSorted.sort(function(a, b) { return b.value - a.value; });

		fs.writeFileSync('./log/level.json', JSON.stringify(level))
		fs.writeFileSync('./log/levelSorted.json', JSON.stringify(levelSorted))
		db.close()
	})
	.catch( e => {
		console.log('Error Happening - ' + err);
	})
})