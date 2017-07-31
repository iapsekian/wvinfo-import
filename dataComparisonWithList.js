/*jshint esversion: 6 */

//useage: node dataComparisonWithList.js City nationalpark.json ---> for content type City online
//useage: node dataComparisonWithList.js Att nationalpark.json ---> for content type Attraction online
//useage: node dataComparisonWithList.js WHS whs.json ---> for content type Attraction and sub type WHS online


const fs=require('fs')
const MongoClient = require('mongodb').MongoClient
const wikiUtil = require('./lib/wikiUtil.js')
const GoogleMapsAPI = require('googlemaps')

const mdbUrl4Wiki = 'mongodb://192.168.2.248:27017/en_wikipedia'
const mdbUrl4BookUr = 'mongodb://52.39.111.227:27017/tourbooks'

let wikiData = []
let wikiDataTitle = []
let bookurData = []
let level = []
let result = []
let noResult = []
let newTXTermsFile = ''
let newTXTermsDestFile = ''
let newTXTermsCityFile = ''
let newTxTerms = []
let newTxTermsCity = []
let bookurDataLC = []

let ctnTypeId = ''
let ctnSubType = 'NA'
let ctnType = process.argv[2]
if(ctnType === 'City'){
	ctnTypeId = '57ed26a06d0e810b357b23c7'
	newTXTermsFile = 'cities.json'
	newTXTermsDestFile = 'dest.json'
	newTXTermsCityFile = 'cities.json'
}
else if(ctnType === 'Att'){
	ctnTypeId = '57ea19736d0e81454c7b23d2'
	newTXTermsFile = 'txAtts.json'
	newTXTermsDestFile = 'dest.json'
}
else if(ctnType === 'Country'){
	ctnTypeId = '57e9e2556d0e819c44dc0fc0'
	newTXTermsFile = 'country.json'
}
else if(ctnType === 'WHS'){
	ctnSubType = 'WHS'
	ctnType = 'Att'
	ctnTypeId = '57ea19736d0e81454c7b23d2'
	newTXTermsFile = 'txAtts.json'
	newTXTermsDestFile = 'dest.json'
	newTXTermsCityFile = 'cities.json'
}
else{
	ctnTypeId = '57ed26a06d0e810b357b23c7'
	ctnType = 'City'
	newTXTermsFile = 'cities.json'
	newTXTermsDestFile = 'dest.json'
}

let listFile = process.argv[3]
let listFileData = []
if(listFile)
	listFileData = require('./mapping/' + listFile)
else{
	console.log('List File is require! Abort!')
	process.exit(1)
}

process.on('unhandledRejection', (err) => {  
  console.error(err)
  process.exit(1)
})

let gmAPIConf
let gmAPI
let ccMap

if(ctnSubType ==='WHS' || ctnType === 'City'){
	ccMap = require('./mapping/ccMap.json')
//google maps api
	gmAPIConf = {
	  key: 'AIzaSyBrZTmy5AzHgXFV9JNUpZKcc1faRaqJA4U',
	  stagger_time:       1000, // for elevationPath
	  encode_polylines:   false,
	  secure:             true // use https
	};
	gmAPI = new GoogleMapsAPI(gmAPIConf)
}

let getInfoByGeoCoordinates = async (lat, lon) => {

	let deCoordinates = (rGeoParams) => {
		return new Promise( (resolve, reject) => {
			gmAPI.reverseGeocode(rGeoParams, (err,r) => {
				if(err)
					reject(new Error(err))
				else{
					let loc = {
						'continent': '',
						'country': '',
						'countryCode':'',
						'state': '',
						'city': '',
						'locality': '',
						'colloquial_area': '',
						'neighborhood': ''
					};

					let go = false;

					switch(r.status){
						case 'OK':
							go = true;
							console.log('gmAPI Status Code = OK!');
							break;
						case 'ZERO_RESULTS':
							console.log('gmAPI Status Code = ZERO_RESULTS!');
							break;
						case 'OVER_QUERY_LIMIT':
							console.log('gmAPI Status Code = OVER_QUERY_LIMIT!');
							break;
						case 'REQUEST_DENIED':
							console.log('gmAPI Status Code = REQUEST_DENIED!');
							break;
						case 'INVALID_REQUEST':
							console.log('gmAPI Status Code = INVALID_REQUEST!');
							break;
						default:
							console.log('gmAPI Status Code = UNKNOWN_ERROR!');
					}

					if(go){
						var data = r.results;
						data.forEach((item) => {
							if(loc.country.length === 0 || loc.state.length === 0 || loc.city.length === 0 || loc.locality.length === 0 || loc.neighborhood.length === 0 || loc.colloquial_area.length === 0){
								var address_components = item.address_components;
								address_components.forEach((address_component)=>{
									var addrTypes = address_component.types;
									var stopFlag = false;
									var stopCat = '';
									addrTypes.forEach((addrType)=>{
										if(!stopFlag){
											switch(addrType){
												case 'country':
													stopFlag = true;
													stopCat = 'country';
													break;
												case 'locality':
													stopFlag = true;
													stopCat = 'locality';
													break;
												case 'administrative_area_level_1':
													stopFlag = true;
													stopCat = 'state';
													break;
												case 'administrative_area_level_2':
													stopFlag = true;
													stopCat = 'city';
													break;
												case 'neighborhood':
													stopFlag = true;
													stopCat = 'neighborhood';
													break;
												case 'colloquial_area':
													stopFlag = true;
													stopCat = 'colloquial_area';
													break;
												default:
											}											
										}
									});

									if(stopFlag){
										switch(stopCat){
											case 'country':
												// loc.country = address_component.long_name;
												loc.countryCode = address_component.short_name;
												// loc.country = getCountryName(loc.countryCode);
												loc.country = ccMap[loc.countryCode].countryName;
												break;
											case 'locality':
												loc.locality = address_component.long_name;
												break;
											case 'state':
												loc.state = address_component.long_name;
												break;
											case 'city':
												loc.city = address_component.long_name;
												break;
											case 'neighborhood':
												loc.neighborhood = address_component.long_name;
												break;
											case 'colloquial_area':
												loc.colloquial_area = address_component.long_name;
												break;
											default:
										}
									}

								});
							}
						});
						// loc.continent = getContinentName(loc.countryCode);
						loc.continent = ccMap[loc.countryCode].continentName;
					}

					resolve(loc)
				}
			})
		})
	}

	let reverseGeocodeParams = {
	  "latlng": Number(lat)+','+Number(lon),
	  //"result_type": "administrative_area_level_4",
	  "language": "en"//,
	  //"location_type": "APPROXIMATE"
	};

	loc = await deCoordinates(reverseGeocodeParams)
	return loc
}

let dataPreparation = () => {
	console.log('Data preparation starts.....')
	let count = 2
	let wait4DataPreparationEnd = () => {
		count--
		if(!count){
			fs.writeFileSync('./log/wikiData-' + listFile + '-'  + ctnType +'.json', JSON.stringify(wikiData))
			fs.writeFileSync('./log/wikiDataTitle-' + listFile + '-'  + ctnType +'.json', JSON.stringify(wikiDataTitle))
			fs.writeFileSync('./log/bookurData-' + listFile + '-'  + ctnType +'.json', JSON.stringify(bookurData))

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

		cltContents.find({typeId: ctnTypeId}).project({_id: 1, text: 1}).toArray()
		.then( d => {
			d.forEach( item => {
				bookurData.push(item.text)
				if(ctnType === 'City')
					bookurDataLC.push(item.text.toLowerCase())
			})
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

	let listFileDataCount = listFileData.length
	let i = 0
	while(i < listFileDataCount){
		let loc = {} //for ctnSubType === 'WHS' && ctnType === 'City'

		let continueFlag = false
		if(ctnTypeId === 'City'){
			if(bookurDataLC.indexOf(listFileData[i].text) === -1)
				continueFlag = true
		} else{
			if(bookurData.indexOf(listFileData[i].text) === -1)
				continueFlag = true
		}

		if(continueFlag){
			let item = listFileData[i]
			if(ctnType === 'City')
				item.text = item.text.toLowerCase().replace(/\b(\w)|\s(\w)/g,function(m){return m.toUpperCase()}) //change the first char of each word to upper case 
			console.log('item = %s', item.text)
			let wikiDataTitleIdx = wikiDataTitle.indexOf(item.text)
			if(wikiDataTitleIdx !== -1){
				if(wikiData[wikiDataTitleIdx].type === 'page'){
					let r = {
						bookurData: item.text,
						wikiData: wikiData[wikiDataTitleIdx].title,
						bookurDataId: '',
						wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
						wikiDataType: wikiData[wikiDataTitleIdx].type,
						source: 'wikivoyage'
					}
					if(ctnType === 'City'){
						r.countryCode = item.countryCode.toUpperCase()
						r.population = item.population
						r.lat = item.lat
						r.lon = item.lon
						r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
					}
					if(ctnSubType === 'WHS'){
						r.shortDesc = item.shortDesc
						r.lon = item.lon
						r.lat = item.lat
						r.category = item.category
						r.country = item.country
						r.region = item.region
						r.countryCode = item.countryCode
						r.loc = await getInfoByGeoCoordinates(item.lat, item.lon) // for taxonomy City checking
					}
					result.push(r)

					newTxTerms.push({Title:item.text})
					if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})

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
						let r = {
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: '',
							wikiDataId: d._id.toString(),
							wikiDataType: d.type,
							source: 'wikivoyage'
						}
						if(ctnType === 'City'){
							r.countryCode = item.countryCode.toUpperCase()
							r.population = item.population
							r.lat = item.lat
							r.lon = item.lon
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						if(ctnSubType === 'WHS'){
							r.shortDesc = item.shortDesc
							r.lon = item.lon
							r.lat = item.lat
							r.category = item.category
							r.country = item.country
							r.region = item.region
							r.countryCode = item.countryCode
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						result.push(r)

						newTxTerms.push({Title:item.text})
						if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
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
								let r = {
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: '',
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
								if(ctnType === 'City'){
									r.countryCode = item.countryCode.toUpperCase()
									r.population = item.population
									r.lat = item.lat
									r.lon = item.lon
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								if(ctnSubType === 'WHS'){
									r.shortDesc = item.shortDesc
									r.lon = item.lon
									r.lat = item.lat
									r.category = item.category
									r.country = item.country
									r.region = item.region
									r.countryCode = item.countryCode
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								result.push(r)

								newTxTerms.push({Title:item.text})
								if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
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
										let r = {
											bookurData: item.text,
											wikiData: dWKPR.title,
											bookurDataId: '',
											wikiDataId: dWKPR._id.toString(),
											wikiDataType: dWKPR.type,
											source: 'wikipedia'
										}
										if(ctnType === 'City'){
											r.countryCode = item.countryCode.toUpperCase()
											r.population = item.population
											r.lat = item.lat
											r.lon = item.lon
											r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
										}
										if(ctnSubType === 'WHS'){
											r.shortDesc = item.shortDesc
											r.lon = item.lon
											r.lat = item.lat
											r.category = item.category
											r.country = item.country
											r.region = item.region
											r.countryCode = item.countryCode
											r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
										}
										result.push(r)

										newTxTerms.push({Title:item.text})
										if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
									} else{
										let r = {
											bookurData: item.text,
											wikiData: dWKPR.title,
											bookurDataId: '',
											wikiDataId: dWKPR._id.toString(),
											wikiDataType: dWKPR.type,
											source: 'wikipedia'
										}
										if(ctnType === 'City'){
											r.countryCode = item.countryCode.toUpperCase()
											r.population = item.population
											r.lat = item.lat
											r.lon = item.lon
											r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
										}
										if(ctnSubType === 'WHS'){
											r.shortDesc = item.shortDesc
											r.lon = item.lon
											r.lat = item.lat
											r.category = item.category
											r.country = item.country
											r.region = item.region
											r.countryCode = item.countryCode
											r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
										}
										noResult.push(r)
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
									let r = {
										bookurData: item.text,
										wikiData: dWKP.title,
										bookurDataId: '',
										wikiDataId: dWKP._id.toString(),
										wikiDataType: dWKP.type,
										source: 'wikipedia'
									}
									if(ctnType === 'City'){
										r.countryCode = item.countryCode.toUpperCase()
										r.population = item.population
										r.lat = item.lat
										r.lon = item.lon
										r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
									}
									if(ctnSubType === 'WHS'){
										r.shortDesc = item.shortDesc
										r.lon = item.lon
										r.lat = item.lat
										r.category = item.category
										r.country = item.country
										r.region = item.region
										r.countryCode = item.countryCode
										r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
									}
									noResult.push(r)
								}
							} else{
								let r = {
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: '',
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
								if(ctnType === 'City'){
									r.countryCode = item.countryCode.toUpperCase()
									r.population = item.population
									r.lat = item.lat
									r.lon = item.lon
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								if(ctnSubType === 'WHS'){
									r.shortDesc = item.shortDesc
									r.lon = item.lon
									r.lat = item.lat
									r.category = item.category
									r.country = item.country
									r.region = item.region
									r.countryCode = item.countryCode
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								noResult.push(r)
							}
						} else{
							try{
								dWKL = await wikiUtil.findOneFromWKL({title:item.text})
								console.log(' WKL d = %s', dWKL?true:false)
							} catch(err){
								console.log('err2!')
							}

							if(dWKL){
								let r = {
									bookurData: item.text,
									wikiData: dWKL.title,
									bookurDataId: '',
									wikiDataId: dWKL._id.toString(),
									wikiDataType: '',
									source: 'wikiListing'
								}
								if(ctnType === 'City'){
									r.countryCode = item.countryCode.toUpperCase()
									r.population = item.population
									r.lat = item.lat
									r.lon = item.lon
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								if(ctnSubType === 'WHS'){
									r.shortDesc = item.shortDesc
									r.lon = item.lon
									r.lat = item.lat
									r.category = item.category
									r.country = item.country
									r.region = item.region
									r.countryCode = item.countryCode
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								result.push(r)

								newTxTerms.push({Title:item.text})
								if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
							} else{
								let r = {
									bookurData: item.text,
									wikiData: '',
									bookurDataId: '',
									wikiDataId: '',
									wikiDataType: '',
									source: ''
								}
								if(ctnType === 'City'){
									r.countryCode = item.countryCode.toUpperCase()
									r.population = item.population
									r.lat = item.lat
									r.lon = item.lon
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								if(ctnSubType === 'WHS'){
									r.shortDesc = item.shortDesc
									r.lon = item.lon
									r.lat = item.lat
									r.category = item.category
									r.country = item.country
									r.region = item.region
									r.countryCode = item.countryCode
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								noResult.push(r)
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
							let r = {
								bookurData: item.text,
								wikiData: dWKP.title,
								bookurDataId: '',
								wikiDataId: dWKP._id.toString(),
								wikiDataType: dWKP.type,
								source: 'wikipedia'
							}
							if(ctnType === 'City'){
								r.countryCode = item.countryCode.toUpperCase()
								r.population = item.population
								r.lat = item.lat
								r.lon = item.lon
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							if(ctnSubType === 'WHS'){
								r.shortDesc = item.shortDesc
								r.lon = item.lon
								r.lat = item.lat
								r.category = item.category
								r.country = item.country
								r.region = item.region
								r.countryCode = item.countryCode
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							result.push(r)

							newTxTerms.push({Title:item.text})
							if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
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
									let r = {
										bookurData: item.text,
										wikiData: dWKPR.title,
										bookurDataId: '',
										wikiDataId: dWKPR._id.toString(),
										wikiDataType: dWKPR.type,
										source: 'wikipedia'
									}
									if(ctnType === 'City'){
										r.countryCode = item.countryCode.toUpperCase()
										r.population = item.population
										r.lat = item.lat
										r.lon = item.lon
										r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
									}
									if(ctnSubType === 'WHS'){
										r.shortDesc = item.shortDesc
										r.lon = item.lon
										r.lat = item.lat
										r.category = item.category
										r.country = item.country
										r.region = item.region
										r.countryCode = item.countryCode
										r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
									}
									result.push(r)

									newTxTerms.push({Title:item.text})
									if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
								} else{
									let r = {
										bookurData: item.text,
										wikiData: dWKPR.title,
										bookurDataId: '',
										wikiDataId: dWKPR._id.toString(),
										wikiDataType: dWKPR.type,
										source: 'wikipedia'
									}
									if(ctnType === 'City'){
										r.countryCode = item.countryCode.toUpperCase()
										r.population = item.population
										r.lat = item.lat
										r.lon = item.lon
										r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
									}
									if(ctnSubType === 'WHS'){
										r.shortDesc = item.shortDesc
										r.lon = item.lon
										r.lat = item.lat
										r.category = item.category
										r.country = item.country
										r.region = item.region
										r.countryCode = item.countryCode
										r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
									}
									noResult.push(r)
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
								let r = {
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: '',
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
								if(ctnType === 'City'){
									r.countryCode = item.countryCode.toUpperCase()
									r.population = item.population
									r.lat = item.lat
									r.lon = item.lon
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								if(ctnSubType === 'WHS'){
									r.shortDesc = item.shortDesc
									r.lon = item.lon
									r.lat = item.lat
									r.category = item.category
									r.country = item.country
									r.region = item.region
									r.countryCode = item.countryCode
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								noResult.push(r)
							}
						} else{
							let r = {
								bookurData: item.text,
								wikiData: wikiData[wikiDataTitleIdx].title,
								bookurDataId: '',
								wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
								wikiDataType: wikiData[wikiDataTitleIdx].type,
								source: 'wikivoyage'
							}
							if(ctnType === 'City'){
								r.countryCode = item.countryCode.toUpperCase()
								r.population = item.population
								r.lat = item.lat
								r.lon = item.lon
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							if(ctnSubType === 'WHS'){
								r.shortDesc = item.shortDesc
								r.lon = item.lon
								r.lat = item.lat
								r.category = item.category
								r.country = item.country
								r.region = item.region
								r.countryCode = item.countryCode
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							noResult.push(r)
						}
					} else{
						try{
							dWKL = await wikiUtil.findOneFromWKL({title:item.text})
							console.log(' WKL d = %s', dWKL?true:false)
						} catch(err){
							console.log('err2!')
						}

						if(dWKL){
							let r = {
								bookurData: item.text,
								wikiData: dWKL.title,
								bookurDataId: '',
								wikiDataId: dWKL._id.toString(),
								wikiDataType: '',
								source: 'wikiListing'
							}
							if(ctnType === 'City'){
								r.countryCode = item.countryCode.toUpperCase()
								r.population = item.population
								r.lat = item.lat
								r.lon = item.lon
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							if(ctnSubType === 'WHS'){
								r.shortDesc = item.shortDesc
								r.lon = item.lon
								r.lat = item.lat
								r.category = item.category
								r.country = item.country
								r.region = item.region
								r.countryCode = item.countryCode
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							result.push(r)

							newTxTerms.push({Title:item.text})
							if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
						} else{
							let r = {
								bookurData: item.text,
								wikiData: wikiData[wikiDataTitleIdx].title,
								bookurDataId: '',
								wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
								wikiDataType: wikiData[wikiDataTitleIdx].type,
								source: 'wikivoyage'
							}
							if(ctnType === 'City'){
								r.countryCode = item.countryCode.toUpperCase()
								r.population = item.population
								r.lat = item.lat
								r.lon = item.lon
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							if(ctnSubType === 'WHS'){
								r.shortDesc = item.shortDesc
								r.lon = item.lon
								r.lat = item.lat
								r.category = item.category
								r.country = item.country
								r.region = item.region
								r.countryCode = item.countryCode
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							noResult.push(r)
						}
					}			
				} else{
					console.log('type = %s', wikiData[wikiDataTitleIdx].type);
					let r = {
						bookurData: item.text,
						wikiData: wikiData[wikiDataTitleIdx].title,
						bookurDataId: '',
						wikiDataId: wikiData[wikiDataTitleIdx]._id.toString(),
						wikiDataType: wikiData[wikiDataTitleIdx].type,
						source: 'wikivoyage'
					}
					if(ctnType === 'City'){
						r.countryCode = item.countryCode.toUpperCase()
						r.population = item.population
						r.lat = item.lat
						r.lon = item.lon
						r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
					}
					if(ctnSubType === 'WHS'){
						r.shortDesc = item.shortDesc
						r.lon = item.lon
						r.lat = item.lat
						r.category = item.category
						r.country = item.country
						r.region = item.region
						r.countryCode = item.countryCode
						r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
					}
					noResult.push(r)
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
						let r = {
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: '',
							wikiDataId: d._id.toString(),
							wikiDataType: d.type,
							source: 'wikipedia'
						}
						if(ctnType === 'City'){
							r.countryCode = item.countryCode.toUpperCase()
							r.population = item.population
							r.lat = item.lat
							r.lon = item.lon
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						if(ctnSubType === 'WHS'){
							r.shortDesc = item.shortDesc
							r.lon = item.lon
							r.lat = item.lat
							r.category = item.category
							r.country = item.country
							r.region = item.region
							r.countryCode = item.countryCode
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						result.push(r)

						newTxTerms.push({Title:item.text})
						if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
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
								let r = {
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: '',
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
								if(ctnType === 'City'){
									r.countryCode = item.countryCode.toUpperCase()
									r.population = item.population
									r.lat = item.lat
									r.lon = item.lon
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								if(ctnSubType === 'WHS'){
									r.shortDesc = item.shortDesc
									r.lon = item.lon
									r.lat = item.lat
									r.category = item.category
									r.country = item.country
									r.region = item.region
									r.countryCode = item.countryCode
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								result.push(r)

								newTxTerms.push({Title:item.text})
								if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
							} else{
								let r = {
									bookurData: item.text,
									wikiData: dWKP.title,
									bookurDataId: '',
									wikiDataId: dWKP._id.toString(),
									wikiDataType: dWKP.type,
									source: 'wikipedia'
								}
								if(ctnType === 'City'){
									r.countryCode = item.countryCode.toUpperCase()
									r.population = item.population
									r.lat = item.lat
									r.lon = item.lon
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								if(ctnSubType === 'WHS'){
									r.shortDesc = item.shortDesc
									r.lon = item.lon
									r.lat = item.lat
									r.category = item.category
									r.country = item.country
									r.region = item.region
									r.countryCode = item.countryCode
									r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
								}
								noResult.push(r)
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
							let r = {
								bookurData: item.text,
								wikiData: d.title,
								bookurDataId: '',
								wikiDataId: d._id.toString(),
								wikiDataType: d.type,
								source: 'wikipedia'
							}
							if(ctnType === 'City'){
								r.countryCode = item.countryCode.toUpperCase()
								r.population = item.population
								r.lat = item.lat
								r.lon = item.lon
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							if(ctnSubType === 'WHS'){
								r.shortDesc = item.shortDesc
								r.lon = item.lon
								r.lat = item.lat
								r.category = item.category
								r.country = item.country
								r.region = item.region
								r.countryCode = item.countryCode
								r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
							}
							noResult.push(r)
						}
					} else{
						let r = {
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: '',
							wikiDataId: d._id.toString(),
							wikiDataType: d.type,
							source: 'wikipedia'
						}
						if(ctnType === 'City'){
							r.countryCode = item.countryCode.toUpperCase()
							r.population = item.population
							r.lat = item.lat
							r.lon = item.lon
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						if(ctnSubType === 'WHS'){
							r.shortDesc = item.shortDesc
							r.lon = item.lon
							r.lat = item.lat
							r.category = item.category
							r.country = item.country
							r.region = item.region
							r.countryCode = item.countryCode
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						noResult.push(r)
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
						let r = {
							bookurData: item.text,
							wikiData: d.title,
							bookurDataId: '',
							wikiDataId: d._id.toString(),
							wikiDataType: '',
							source: 'wikiListing'
						}
						if(ctnType === 'City'){
							r.countryCode = item.countryCode.toUpperCase()
							r.population = item.population
							r.lat = item.lat
							r.lon = item.lon
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						if(ctnSubType === 'WHS'){
							r.shortDesc = item.shortDesc
							r.lon = item.lon
							r.lat = item.lat
							r.category = item.category
							r.country = item.country
							r.region = item.region
							r.countryCode = item.countryCode
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						result.push(r)

						newTxTerms.push({Title:item.text})
						if(r.loc.city) newTxTermsCity.push({Title:r.loc.city})
					
					} else{
						let r = {
							bookurData: item.text,
							wikiData: '',
							bookurDataId: '',
							wikiDataId: '',
							wikiDataType: '',
							source: ''
						}
						if(ctnType === 'City'){
							r.countryCode = item.countryCode.toUpperCase()
							r.population = item.population
							r.lat = item.lat
							r.lon = item.lon
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						if(ctnSubType === 'WHS'){
							r.shortDesc = item.shortDesc
							r.lon = item.lon
							r.lat = item.lat
							r.category = item.category
							r.country = item.country
							r.region = item.region
							r.countryCode = item.countryCode
							r.loc = await getInfoByGeoCoordinates(item.lat, item.lon)
						}
						noResult.push(r)
					}
				}			
			}
		} else{
			console.log('List data: %s , has existed! Do Nothing!', listFileData[i].text)
		}

		i++
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
    console.log('New TX Terms Count = %s', newTxTerms.length);

    fs.writeFileSync('./log/compare-' + listFile + '-' + ctnType +'Level.json', JSON.stringify(level));
    fs.writeFileSync('./mapping/compare-' + listFile + '-' + ctnType +'Result.json', JSON.stringify(result));
    fs.writeFileSync('./mapping/compare-' + listFile + '-' + ctnType +'NoResult.json', JSON.stringify(noResult));
    fs.writeFileSync('./mapping/' + newTXTermsFile + '-' + listFile + '-newTxTerms', JSON.stringify(newTxTerms));
    fs.writeFileSync('./mapping/' + newTXTermsDestFile + '-' + listFile + '-newTxTerms', JSON.stringify(newTxTerms));
    fs.writeFileSync('./mapping/' + newTXTermsCityFile + '-' + listFile + '-newTxTermsCity', JSON.stringify(newTxTermsCity));
}

dataPreparation()
