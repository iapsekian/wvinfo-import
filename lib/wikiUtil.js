/*jshint esversion: 6 */
"use strict"

const fs = require('fs')
const util = require('util')
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const parse_disambig = require('./parse_disambig.js')
const Parsoid = require('parsoid')


const mdbUrl4Wiki = 'mongodb://192.168.2.248:27017/en_wikipedia'
const collectionName = {
	'wikivoyage': 'wikivoyage',
	'wikilisting': 'wikiListing',
	'wikipedia': 'wikipedia'
}

let findOneFromWKP = async (qry,opts) => {
	if(!qry){
		return
	}
	if(!opts){
		opts = {fields:{'_id':1, 'type':1, 'title':1, 'text':1, 'redirect':1}}
	}

	let db
	try{
		db = await MongoClient.connect(mdbUrl4Wiki)
	} catch(err){
		console.log('Get DB error', err, ' END')
		return
	}

	let cltWikipedia = db.collection(collectionName.wikipedia)

	let doc = ''
	try{
		doc = await cltWikipedia.findOne(qry,opts)
	} catch(err){
		console.log('Find WKP doc error', err, ' END')
		return doc
	} finally{
		db.close()
	}
	
	return doc
}

let findOneFromWKL = async (qry, opts) => {
	if(!qry){
		return
	}
	if(!opts){
		opts = {fields:{'_id':1, 'type':1, 'title':1, 'description':1, 'article':1}}
	}

	let db
	try{
		db = await MongoClient.connect(mdbUrl4Wiki)
	} catch(err){
		console.log('Get DB error', err, ' END')
		return
	}

	let cltWikipedia = db.collection(collectionName.wikilisting)

	let doc = ''
	try{
		doc = await cltWikipedia.findOne(qry,opts)
	} catch(err){
		console.log('Find WKL doc error', err, ' END')
		return doc
	} finally{
		db.close()
	}
	
	return doc	
}

let findOneFromWKY = async (qry,opts) => {
	if(!qry){
		return
	}
	if(!opts){
		opts = {fields:{'_id':1, 'type':1, 'title':1, 'text':1, 'redirect':1}}
	}

	let db
	try{
		db = await MongoClient.connect(mdbUrl4Wiki)
	} catch(err){
		console.log('Get DB error', err, ' END')
		return
	}

	let cltWikipedia = db.collection(collectionName.wikivoyage)

	let doc = ''
	try{
		doc = await cltWikipedia.findOne(qry,opts)
	} catch(err){
		console.log('Find WKY doc error', err, ' END')
		return doc
	} finally{
		db.close()
	}
	
	return doc	
}

let dealWKYRedirect = async (wkyObj) => {
	let redirect = wkyObj.redirect
	let text = redirect.replace(/^ ?#(redirect) *?\[\[/i,'')
	text = text.replace(/\]\]$/,'')

	let doc = ''
	if(text){
		try{
			doc = await findOneFromWKY({title:text, type: 'page'})
		} catch(err){
			console.log('Find WKY doc error', err, 'END')
		}

		if(doc){
			return doc
		} else {
			try{
				doc = await findOneFromWKP({title:text, type: 'page'})
			} catch(err){
				console.log('WKP findOne error!')
				return
			}

			if(doc){
				return doc
			} else{
				try{
					doc = await findOneFromWKL({title:text})
				} catch(err){
					console.log('WKL findOne error!')
				}

				return doc
			}
		}
	} else{
		return
	}
}

let dealWKPRedirect = async (wkpObj) => {
	let redirect = wkpObj.redirect
	let text = redirect.replace(/^ ?#(redirect) *?\[\[/i,'')
	text = text.replace(/\]\]$/,'')

	let doc = ''
	if(text){
		try{
			doc = await findOneFromWKP({title:text})
		} catch(err){
			console.log('WKP findOne error!')
			throw err
			return
		}

		if(doc){
			return doc
		} else{
			try{
				doc = await findOneFromWKL({title:text})
			} catch(err){
				console.log('WKL findOne error!')
				throw err
			}

			return doc
		}
	} else{
		return
	}
}

let dealDisambiguation = async (obj) => {
	let wikiObj
	let wikiText
	let parseResult
	let htmlText
	let opts = {fields:{'_id':1, 'type':1, 'title':1, 'pages':1}}
	let source = obj.source
	if(source === 'wikivoyage'){
		wikiObj = await findOneFromWKY({_id: ObjectID.createFromHexString(obj.wikiDataId)}, opts)
	} else if(source === 'wikipedia'){
		wikiObj = await findOneFromWKP({_id: ObjectID.createFromHexString(obj.wikiDataId)}, opts)		
	}

	if(wikiObj){
		wikiText = wikiObj.pages
		// htmlText = await parseWikitext2Html(wikiText)
		parseResult = parse_disambig(wikiText)
		return parseResult
	} else{
		return null
	}
}

let getWikiTextById = async (source, id) => {
	if(!source){
		console.log('Wiki source is requried!')
		return
	}
	if(!id){
		console.log('Wiki source DB _id is requried!')
		return
	}

	let db
	try{
		db = await MongoClient.connect(mdbUrl4Wiki)
	} catch(err){
		console.log('Get DB error', err, ' END')
		throw err
		return
	}

	let clt = db.collection(collectionName[source])

	let qry = {_id: ObjectID.createFromHexString(id)}	
	let opts = {fields:{'_id':1, 'type':1, 'title':1, 'text':1}}
	let doc = ''
	try{
		doc = await clt.findOne(qry, opts)
	} catch(err){
		console.log('Find get wikitext doc error', err, ' END')
		throw err
		return doc
	} finally{
		db.close()
	}
	
	if(doc)
		return doc.text
	else
		return doc
}

let getWikiImagesById = async (source, id) => {
	if(!source){
		console.log('Wiki source is requried!')
		return
	}
	if(!id){
		console.log('Wiki source DB _id is requried!')
		return
	}

	let db
	try{
		db = await MongoClient.connect(mdbUrl4Wiki)
	} catch(err){
		console.log('Get DB error', err, ' END')
		throw err
		return
	}

	let clt = db.collection(collectionName[source])

	let qry = {_id: ObjectID.createFromHexString(id)}	
	let opts = {fields:{'_id':1, 'type':1, 'title':1, 'images':1}}
	let doc = ''
	try{
		doc = await clt.findOne(qry, opts)
	} catch(err){
		console.log('Find get wikitext doc error', err, ' END')
		throw err
		return doc
	} finally{
		db.close()
	}
	
	if(doc)
		return doc.images
	else
		return doc
}

let getWikiDataById = async (source, id, fields) => {
	if(!source){
		console.log('Wiki source is requried!')
		return
	}
	if(!id){
		console.log('Wiki source DB _id is requried!')
		return
	}

	let db
	try{
		db = await MongoClient.connect(mdbUrl4Wiki)
	} catch(err){
		console.log('Get DB error', err, ' END')
		throw err
		return
	}

	let clt = db.collection(collectionName[source])

	let qry = {_id: ObjectID.createFromHexString(id)}
	let opts = {fields:{'_id':1, 'type':1, 'title':1, 'text': 1, 'images':1}}
	if(fields){
		opts = {fields: fields}
	}
	let doc = ''
	try{
		doc = await clt.findOne(qry, opts)
	} catch(err){
		console.log('Find get wikitext doc error', err, ' END')
		throw err
		return doc
	} finally{
		db.close()
	}
	
	return doc
}

let parseWikitext2Html = async (wikiText) => {
	let p = Parsoid.parse(wikiText, { document: true, domain:'en.wikivoyage.org', config: { addHTMLTemplateParameters: true, expandExtensions: true, defaultWiki: 'enwikivoyage'} })
	let res
	try{
		res = await p
	} catch(err){
		console.log('Parse WikiText Error - %s', err)
	} finally{
		p.done()
	}

	res.out._nodes.forEach( node => {
		if(!node){
			return
		}
		if(node.rel){
			if(node.rel === 'mw:WikiLink'){
				node.href = "https://en.wikivoyage.org" + node.href
				node.target = '_blank'
			}
			if(node.rel === 'mw:ExtLink'){
				node.target = '_blank'
			}
		}
	})	

	return res.out.body.innerHTML
}

module.exports = {
	collectionName: collectionName,
	findOneFromWKP: findOneFromWKP,
	findOneFromWKL: findOneFromWKL,
	findOneFromWKY: findOneFromWKY,
	dealWKYRedirect: dealWKYRedirect,
	dealWKPRedirect: dealWKPRedirect,
	dealDisambiguation: dealDisambiguation,
	parseWikitext2Html: parseWikitext2Html,
	getWikiTextById: getWikiTextById,
	getWikiImagesById: getWikiImagesById,
	getWikiDataById: getWikiDataById
};
