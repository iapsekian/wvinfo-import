const fs = require('fs')
const XmlStream = require('xml-stream')
const Parsoid = require('parsoid')
const CircularJSON = require('circular-json')

let stream = fs.createReadStream('./data/sample-dump1.xml')
let xml = new XmlStream(stream)
xml._preserveAll = true

xml.on('endElement: page', page => {
	// console.log(JSON.stringify(page))
	


	let wikiText = page.revision.text['$text']
	// console.log('wikiText = %s', wikiText)
	Parsoid.parse(wikiText,{ document: true, config: { addHTMLTemplateParameters: true, expandExtensions: true, defaultWiki: 'enwikivoyage'} })
	// Parsoid.parse(wikiText,{})
		.then( res => {
	   		console.log('res = %s', CircularJSON.stringify(res));
	   		console.log('res = %s', Object.keys(res));
	   		console.log('res.trailingNL = %s', res.trailingNL);
	   		console.log('res.out = %s', res.out);
	   		console.log('res.env = %s', res.env);
	   		console.log('res.out = %s', Object.keys(res.out));
	   		console.log('res.out.nodeType = %s', res.out.nodeType);
	   		console.log('res.out.documentElement = %s', Object.keys(res.out.documentElement));
	   		console.log('res.env = %s', Object.keys(res.env));
	   		console.log('res.env.page = %s', Object.keys(res.env.page));
	   		console.log('res.out.outerHTML = %s', res.out.outerHTML);
		})
		.done()
	/*if (page.ns === '0') {
	  var script = page.revision.text['$text'] || ''

	  console.log(page.title + ' ' + i);
	  ++i;

	  var data = {
	    title: page.title,
	    script: script
	  }

	    data.collection = collection
	    helper.processScript(data, function(err, res) {})
	}*/
})

xml.on('error', message => {
	console.log('Parsing as ' + (encoding || 'auto') + ' failed: ' + message);
})

xml.on('end', () => {
	console.log('=================done!========')
})
