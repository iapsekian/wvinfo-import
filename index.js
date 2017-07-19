const fs=require('fs')
const Parsoid = require('parsoid')
const MongoClient = require('mongodb').MongoClient

const mdbUrl = 'mongodb://mongo:27017/en_wikipedia'

MongoClient.connect(mdbUrl, (err, db) => {
	if(err === null) console.log('Connected *******');

	let cltWikipedia = db.collection('wikipedia')

	cltWikipedia.find().toArray()
	.then( d => {
		let continuation = true
		let i =0

		while(continuation){
			let data = d[i]
			if(data.type === 'page' && data.title === 'New York City'){
				let text = data.text
				let textKey = Object.keys(text)

				let textKeyCount = textKey.length
				let wait4AllParsingEnd = () =>{
					textKeyCount--
					if(!textKeyCount){
						db.close()
						console.log('****** DONE ******')
					}
				}

				textKey.forEach( key => {
					let wikiText = text[key][0]
					Parsoid.parse(wikiText,{ document: true, domain:'en.wikivoyage.org', config: { addHTMLTemplateParameters: true, expandExtensions: true, defaultWiki: 'enwikivoyage'} })
					.then( res => {
					   		console.log('=== %s ===', key)
					   		res.out._nodes.forEach( node => {
					   			if(!node){
					   				return
					   			}
					   			if(node.rel){
					   				if(node.rel === 'mw:WikiLink'){
					   					node.href = "https://en.wikivoyage.org" + node.href
					   				}
					   			}
					   		})
					   		// fs.writeFileSync('./log/'+key+'.html', res.out.outerHTML)					   		
					   		fs.writeFileSync('./log/'+key+'.html', res.out.body.innerHTML)					   		
					   		wait4AllParsingEnd()
						})
					.done()	
				})

				i++
				continuation = false
			} else {
				i++
			}
		}
	})
	.catch( e => {
		console.log('Error Happening - ' + err);
	})
})