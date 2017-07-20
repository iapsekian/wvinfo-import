/*jshint esversion: 6 */

//useage: node dataComparison.js City true ---> for content type City online
//useage: node dataComparison.js Att true ---> for content type Attraction online


const fs=require('fs')
const MongoClient = require('mongodb').MongoClient
const wikiUtil = require('./lib/wikiUtil.js')

const mdbUrl4Wiki = 'mongodb://10.211.55.113:27017/en_wikipedia'
const mdbUrl4BookUr = 'mongodb://52.39.111.227:27017/tourbooks'

let wikiData = []
let wikiDataTitle = []
let bookurData = []
let level = []
let result = []
let noResult = []

let ctnTypeId = ''
let ctnType = process.argv[2]
if(ctnType === 'City')
	ctnTypeId = '57ed26a06d0e810b357b23c7'
else if(ctnType === 'Att')
	ctnTypeId = '57ea19736d0e81454c7b23d2'
else{
	ctnTypeId = '57ed26a06d0e810b357b23c7'
	ctnType = 'City'
}

let online = process.argv[3]
if(!online)
	online = true
else if(online === 'false')
	online = false
else
	online = true

process.on('unhandledRejection', (err) => {  
  console.error(err)
  process.exit(1)
})

let dataPreparation = () => {
	console.log('Data preparation starts.....')
	let count = 2
	let wait4DataPreparationEnd = () => {
		count--
		if(!count){
			fs.writeFileSync('./log/wikiData' + ctnType +'.json', JSON.stringify(wikiData))
			fs.writeFileSync('./log/wikiDataTitle' + ctnType +'.json', JSON.stringify(wikiDataTitle))
			fs.writeFileSync('./log/bookurData' + ctnType +'.json', JSON.stringify(bookurData))

			compareData()
		}
	}

	MongoClient.connect(mdbUrl4Wiki, (err, db) => {
		if(err === null) console.log('Connected *******');

		let cltWikivoyage = db.collection('wikivoyage')

		cltWikivoyage.find(/*{type:'page'}*/).toArray()
		.then( d => {
			wikiData = d
			wikiData.forEach( (item, idx) => {
				wikiDataTitle[idx] = item.title
			})
			db.close()
			wait4DataPreparationEnd()
		})
		.catch(e => {
			console.log('Error Happening 1 - ' + err)
			db.close()
			wait4DataPreparationEnd()
		})

	})

	MongoClient.connect(mdbUrl4BookUr, (err, db) => {
		if(err === null) console.log('Connected *******');

		let cltContents = db.collection('Contents')

		cltContents.find({typeId: ctnTypeId, online: online}).project({_id: 1, text: 1}).toArray()
		.then( d => {
			bookurData = d
			db.close()
			wait4DataPreparationEnd()
		})
		.catch(e => {
			console.log('Error Happening 2 - ' + err)
			db.close()
			wait4DataPreparationEnd()
		})

	})
}

let compareData = async () => {
	console.log('Compare %s starts.....', ctnType)
	let tmpLevel = {}

	let bookurDataCount = bookurData.length
	let i = 0
	while(i < bookurDataCount){
		let item = bookurData[i]
		console.log('item = %s', item.text)
	// bookurData.forEach( item => {
		let wikiDataTitleIdx = wikiDataTitle.indexOf(item.text)
		if(wikiDataTitleIdx !== -1){
			if(wikiData[wikiDataTitleIdx].type === 'page'){
				result.push(
					{
						bookurData: item.text,
						wikiData: wikiData[wikiDataTitleIdx].title,
						bookurDataId: item._id.toString(),
						wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
						wikiDataType: wikiData[wikiDataTitleIdx].type,
						source: 'wikivoyage'
					}
				)
				if(wikiData[wikiDataTitleIdx].type === 'page'){
					let textKey = Object.keys(wikiData[wikiDataTitleIdx].text)
					textKey.forEach( key => {
						if(tmpLevel[key]){
							tmpLevel[key] += 1
						} else {
							tmpLevel[key] = 1
						}
					})
				}
			} else if(wikiData[wikiDataTitleIdx].type === 'redirect'){
				console.log('Deal with "redirect" for %s', item.text)
				let d
				try{
					d = await wikiUtil.dealWKYRedirect(wikiData[wikiDataTitleIdx])
					console.log('WKY Redirect d = %s', d?true:false)
				} catch(err){
					console.log('dealWKYRedirect err!');
				}
				if(d){
					result.push(
						{
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: item._id.toString(),
							wikiDataId: d._id.toString(),
							wikiDataType: d.type,
							source: 'wikivoyage'
						}
					)
					if(d.type === 'page'){
						let textKey = Object.keys(d.text)
						textKey.forEach( key => {
							if(tmpLevel[key]){
								tmpLevel[key] += 1
							} else {
								tmpLevel[key] = 1
							}
						})
					}
				} else{
					console.log('WKY Redirect wikiData = %s not found', wikiData[wikiDataTitleIdx].title)

					let dWKP
					try{
						dWKP = await wikiUtil.findOneFromWKP({title:item.text})
						console.log(' WKP dWKP = %s', dWKP?true:false)
					} catch(err) {
						console.log('err1!')
					}

					if(dWKP){
						if(dWKP.type === 'page'){
							result.push(
								{
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: item._id.toString(),
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
							)
							if(dWKP.type === 'page'){
								let textKey = Object.keys(dWKP.text)
								textKey.forEach( key => {
									if(tmpLevel[key]){
										tmpLevel[key] += 1
									} else {
										tmpLevel[key] = 1
									}
								})
							}
						} else if(dWKP.type === 'redirect'){
							console.log('Deal with WKP "redirect" for %s', item.text)
							let dWKPR
							try{
								dWKPR = await wikiUtil.dealWKPRedirect(dWKP)
								console.log('WKP Redirect dWKPR = %s', dWKPR?true:false)
							} catch(err){
								console.log('dealWKPredirect err!')
								throw err
							}
							if(dWKPR){
								if(dWKPR.type === 'page'){
									result.push(
										{
											bookurData: item.text,
											wikiData: dWKPR.title,
											bookurDataId: item._id.toString(),
											wikiDataId: dWKPR._id.toString(),
											wikiDataType: dWKPR.type,
											source: 'wikipedia'
										}
									)
								} else{
									noResult.push(
										{
											bookurData: item.text,
											wikiData: dWKPR.title,
											bookurDataId: item._id.toString(),
											wikiDataId: dWKPR._id.toString(),
											wikiDataType: dWKPR.type,
											source: 'wikipedia'
										}
									)									
								}
								if(dWKPR.type === 'page'){
									let textKey = Object.keys(dWKPR.text)
									textKey.forEach( key => {
										if(tmpLevel[key]){
											tmpLevel[key] += 1
										} else {
											tmpLevel[key] = 1
										}
									})
								}
							} else{
								console.log('WKP Redirect wikiData = %s not found', dWKP.title)
								noResult.push(
									{
										bookurData: item.text,
										wikiData: dWKP.title,
										bookurDataId: item._id.toString(),
										wikiDataId: dWKP._id.toString(),
										wikiDataType: dWKP.type,
										source: 'wikipedia'
									}
								)					
							}
						} else{
							noResult.push(
								{
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: item._id.toString(),
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
							)										
						}
					} else{
						try{
							dWKL = await wikiUtil.findOneFromWKL({title:item.text})
							console.log(' WKL d = %s', dWKL?true:false)
						} catch(err){
							console.log('err2!')
						}

						if(dWKL){
							result.push(
								{
									bookurData: item.text,
									wikiData: dWKL.title,
									bookurDataId: item._id.toString(),
									wikiDataId: dWKL._id.toString(),
									wikiDataType: '',
									source: 'wikiListing'
								}
							)
						} else{
							noResult.push(
								{
									bookurData: item.text,
									wikiData: '',
									bookurDataId: item._id.toString(),
									wikiDataId: '',
									wikiDataType: '',
									source: ''
								}
							)					
						}
					}			
				}
			} else if(wikiData[wikiDataTitleIdx].type === 'disambiguation'){
				console.log('Deal with "disambiguation" for %s', item.text)

				let dWKP
				try{
					dWKP = await wikiUtil.findOneFromWKP({title:item.text})
					console.log(' WKP dWKP = %s', dWKP?true:false)
				} catch(err) {
					console.log('err1!')
				}

				if(dWKP){
					if(dWKP.type === 'page'){
						result.push(
							{
								bookurData: item.text,
								wikiData: dWKP.title,
								bookurDataId: item._id.toString(),
								wikiDataId: dWKP._id.toString(),
								wikiDataType: dWKP.type,
								source: 'wikipedia'
							}
						)
						if(dWKP.type === 'page'){
							let textKey = Object.keys(dWKP.text)
							textKey.forEach( key => {
								if(tmpLevel[key]){
									tmpLevel[key] += 1
								} else {
									tmpLevel[key] = 1
								}
							})
						}
					} else if(dWKP.type === 'redirect'){
						console.log('Deal with WKP "redirect" for %s', item.text)
						let dWKPR
						try{
							dWKPR = await wikiUtil.dealWKPRedirect(dWKP)
							console.log('WKP Redirect dWKPR = %s', dWKPR?true:false)
						} catch(err){
							console.log('dealWKPredirect err!')
							throw err
						}
						if(dWKPR){
							if(dWKPR.type === 'page'){
								result.push(
									{
										bookurData: item.text,
										wikiData: dWKPR.title,
										bookurDataId: item._id.toString(),
										wikiDataId: dWKPR._id.toString(),
										wikiDataType: dWKPR.type,
										source: 'wikipedia'
									}
								)
							} else{
								noResult.push(
									{
										bookurData: item.text,
										wikiData: dWKPR.title,
										bookurDataId: item._id.toString(),
										wikiDataId: dWKPR._id.toString(),
										wikiDataType: dWKPR.type,
										source: 'wikipedia'
									}
								)									
							}
							if(dWKPR.type === 'page'){
								let textKey = Object.keys(dWKPR.text)
								textKey.forEach( key => {
									if(tmpLevel[key]){
										tmpLevel[key] += 1
									} else {
										tmpLevel[key] = 1
									}
								})
							}
						} else{
							console.log('WKP Redirect wikiData = %s not found', dWKP.title)
							noResult.push(
								{
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: item._id.toString(),
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
							)					
						}
					} else{
						noResult.push(
							{
								bookurData: item.text,
								wikiData: wikiData[wikiDataTitleIdx].title,
								bookurDataId: item._id.toString(),
								wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
								wikiDataType: wikiData[wikiDataTitleIdx].type,
								source: 'wikivoyage'
							}
						)										
					}
				} else{
					try{
						dWKL = await wikiUtil.findOneFromWKL({title:item.text})
						console.log(' WKL d = %s', dWKL?true:false)
					} catch(err){
						console.log('err2!')
					}

					if(dWKL){
						result.push(
							{
								bookurData: item.text,
								wikiData: dWKL.title,
								bookurDataId: item._id.toString(),
								wikiDataId: dWKL._id.toString(),
								wikiDataType: '',
								source: 'wikiListing'
							}
						)
					} else{
						noResult.push(
							{
								bookurData: item.text,
								wikiData: wikiData[wikiDataTitleIdx].title,
								bookurDataId: item._id.toString(),
								wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
								wikiDataType: wikiData[wikiDataTitleIdx].type,
								source: 'wikivoyage'
							}
						)					
					}
				}			
			} else{
				console.log('type = %s', wikiData[wikiDataTitleIdx].type);
				noResult.push(
					{
						bookurData: item.text,
						wikiData: wikiData[wikiDataTitleIdx].title,
						bookurDataId: item._id.toString(),
						wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
						wikiDataType: wikiData[wikiDataTitleIdx].type,
						source: 'wikivoyage'
					}
				)				
			}
		} else {
			let d
			try{
				d = await wikiUtil.findOneFromWKP({title:item.text})
				console.log(' WKP d = %s', d?true:false)
			} catch(err) {
				console.log('err1!')
			}

			if(d){
				if(d.type === 'page'){
					result.push(
						{
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: item._id.toString(),
							wikiDataId: d._id.toString(),
							wikiDataType: d.type,
							source: 'wikipedia'
						}
					)
					if(d.type === 'page'){
						let textKey = Object.keys(d.text)
						textKey.forEach( key => {
							if(tmpLevel[key]){
								tmpLevel[key] += 1
							} else {
								tmpLevel[key] = 1
							}
						})
					}
				} else if(d.type === 'redirect'){
					console.log('Deal with WKP "redirect" for %s', item.text)
					let dWKP
					try{
						dWKP = await wikiUtil.dealWKPRedirect(d)
						console.log('WKP Redirect dWKP = %s', dWKP?true:false)
					} catch(err){
						console.log('dealWKPredirect err!')
						throw err
					}
					if(dWKP){
						if(dWKP.type === 'page'){
							result.push(
								{
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: item._id.toString(),
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
							)
						} else{
							noResult.push(
								{
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: item._id.toString(),
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
							)									
						}
						if(dWKP.type === 'page'){
							let textKey = Object.keys(dWKP.text)
							textKey.forEach( key => {
								if(tmpLevel[key]){
									tmpLevel[key] += 1
								} else {
									tmpLevel[key] = 1
								}
							})
						}
					} else{
						console.log('WKP Redirect wikiData = %s not found', d.title)
						noResult.push(
							{
								bookurData: item.text,
								wikiData: d.title,
								bookurDataId: item._id.toString(),
								wikiDataId: d._id.toString(),
								wikiDataType: d.type,
								source: 'wikipedia'
							}
						)					
					}
				} else{
					noResult.push(
						{
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: item._id.toString(),
							wikiDataId: d._id.toString(),
							wikiDataType: d.type,
							source: 'wikipedia'
						}
					)										
				}
			} else{
				let d
				try{
					d = await wikiUtil.findOneFromWKL({title:item.text})
					console.log(' WKL d = %s', d?true:false)
				} catch(err){
					console.log('err2!')
				}

				if(d){
					result.push(
						{
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: item._id.toString(),
							wikiDataId: d._id.toString(),
							wikiDataType: '',
							source: 'wikiListing'
						}
					)
				} else{
					noResult.push(
						{
							bookurData: item.text,
							wikiData: '',
							bookurDataId: item._id.toString(),
							wikiDataId: '',
							wikiDataType: '',
							source: ''
						}
					)					
				}
			}			
		}

		i++
	// })
	}

    for (var prop in tmpLevel) {
        if (tmpLevel.hasOwnProperty(prop)) {
            level.push({
                'key': prop,
                'value': tmpLevel[prop]
            });
        }
    }
    level.sort(function(a, b) { return b.value - a.value; });

    console.log('Match result = %s', result.length);
    console.log('Not Match result = %s', noResult.length);

    fs.writeFileSync('./log/compare' + ctnType +'Level.json', JSON.stringify(level));
    fs.writeFileSync('./mapping/compare' + ctnType +'Result.json', JSON.stringify(result));
    fs.writeFileSync('./mapping/compare' + ctnType +'NoResult.json', JSON.stringify(noResult));
}

dataPreparation()
