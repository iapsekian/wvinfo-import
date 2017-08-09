/*jshint esversion: 6 */

//useage: node importListData2DB.js Att nationalpark.json NP PRODUCTION OPDB ---> for content type Attraction
//useage: node importListData2DB.js Att disney.json NONE PRODUCTION OPDB ---> for content type Attraction
//useage: node importListData2DB.js Att whs.json WHS PRODUCTION OPDB ---> for content type Attraction

const fs = require('fs')
const MongoClient = require('mongodb').MongoClient
const wikiUtil = require('./lib/wikiUtil.js')
// const buUtil = require('./lib/bookurUtil.js')
const buUtil = require('bookur-util')
// const ccMap = require('./mapping/ccMap.json')
// const GoogleMapsAPI = require('googlemaps')


let ctnTypeId = ''
let ctnDetailsTypeId = ''
let ctnType = process.argv[2]
if(ctnType === 'City'){
	ctnTypeId = '57ed26a06d0e810b357b23c7'
	ctnDetailsTypeId = '587dbe0c6d0e813d6c53b662'
} else if(ctnType === 'Att'){
	ctnTypeId = '57ea19736d0e81454c7b23d2'
	ctnDetailsTypeId = '587dbef16d0e81d36d53b660'
} else if(ctnType === 'Country'){
	ctnTypeId = '57e9e2556d0e819c44dc0fc0'
	ctnDetailsTypeId = '587dbf5f6d0e81b96d53b660'
} else{
	ctnTypeId = '57ed26a06d0e810b357b23c7'
	ctnDetailsTypeId = '587dbe0c6d0e813d6c53b662'
	ctnType = 'City'
}

let targetEnv = process.argv[5]
let dbOPSwitch = process.argv[6]
let operateDB = false
let mdbUrl = ''

let dbParam = buUtil.getMDBParam(targetEnv, dbOPSwitch)
targetEnv = dbParam.targetEnv
operateDB = dbParam.operateDB
mdbUrl = dbParam.mdbUrl

console.log('mdbUrl = %s', mdbUrl)
if(!operateDB){
	var content4DB = []
	var contentDetails4DB = []
}

let listFile = process.argv[3]
let data = []
if(fs.existsSync('./mapping/compare-' + listFile + '-' + ctnType +'Result.json'))
	data = require('./mapping/compare-' + listFile + '-' + ctnType +'Result.json')
else{
	console.log('List filename is required! Please check if the file exists or not!... Now Abort!')
	process.exit(1)
}

if(fs.existsSync('./mapping/compare-' + listFile + '-' + ctnType + 'Manual.json')){
	let tmp = require('./mapping/compare-' + listFile + '-' + ctnType + 'Manual.json')
	data = data.concat(tmp)
}
if(fs.existsSync('./mapping/compare-' + listFile + '-' + ctnType + 'Correction.json')){
	let tmp = require('./mapping/compare-' + listFile + '-' + ctnType + 'Correction.json')
	data = data.concat(tmp)
}

let themesTerm = ''
let themesType = process.argv[4]
if(themesType === 'NP')
	themesTerm = 'National Park'
else if(themesType === 'WHS')
	themesTerm = 'World Heritage Site'
else if(themesType === 'MUSEUM')
	themesTerm = 'Museum'
else if(themesType === 'NONE')
	themesTerm = 'NONE'

if(!data){
	console.log('There is no data for imprting! Abort!')
	process.exit(1)
}

let attDocTemplate  = {
    "text" : "",
    "typeId" : "57ea19736d0e81454c7b23d2",
    "online" : true,
    "isProduct" : false,
    "workspace" : {
        "fields" : {
            "Description" : "",
            "CountryName" : "",
            "CityName" : "",
            "position" : {
                "address" : "",
                "altitude" : "",
                "lat" : 0,
                "lon" : 0,
                "location" : {
                    "type" : "Point",
                    "coordinates" : [0,0]
                }
            },
            "Address" : "",
            "Postcode" : "",
            "Telephone" : "",
            "email" : "",
            "Website" : "",
            "Transport" : "",
            "OpeningTime" : "",
            "Admission" : "",
            "PhotoPath" : "",
            "image" : "",
            "rating" : 1
        },
        "status" : "published",
        "taxonomy" : {
            "navigation" : [ 
                "57e227bb6d0e81ad168b4768", 
                "580726bd6d0e810b3d7b23c6"
            ],
            // "57b18d746d0e81e174c6632e" : [], //attraction id
            "57b18d746d0e81e174c66324" : [], //iso world region 
            "57b18d746d0e81e174c66322" : [], //country code
            // "57b18d746d0e81e174c66328" : [], //region city id 
            // "57b18d746d0e81e174c66332" : [], //resort id
            // "57ea19736d0e81454c7b23cc" : [], //Attraction Excuesion
            // "57ea19736d0e81454c7b23ce" : [], //In Landmark
            "57ea19736d0e81454c7b23d0" : [], //Themes 
            // "5762645b6d0e81f93acd2599" : [], //Editor Choice 
            "587863e56d0e81fb4014b289" : [   //Search Selector
                "5878647c6d0e816e4114b288"
            ],
            "589c085b6d0e819e13623adc" : [], //City
            "57638ca16d0e810758cd2507" : [], //Tour Destination 
            "5902ed996d0e819c507b23c8" : []  //Attraction
        },
        "startPublicationDate" : null,
        "endPublicationDate" : null,
        "target" : [ 
            "global"
        ],
        "writeWorkspace" : "global",
        "pageId" : "",
        "maskId" : "",
        "blockId" : "",
        "i18n" : {
            "en" : {
                "fields" : {
                    "text" : "",
                    "urlSegment" : "",
                    "summary" : "",
                    "pdfSummary" : "",
                    "pdfShortUrl" : ""
                },
                "locale" : "en"
            }
        },
        "nativeLanguage" : "en",
        "clickStreamEvent" : ""
    },
    "version" : 0,
    "lastUpdateUser" : {
        "id": "55a4ab8b86c747a0758b4567",
        "login": "admin",
        "fullName": "Web Admin"       
    },
    "createUser" : {
        "id": "55a4ab8b86c747a0758b4567",
        "login": "admin",
        "fullName": "Web Admin"       
    },
    "createTime" : 0,
    "lastUpdateTime" : 0,
    "productProperties" : ""
}

let cityDocTemplate = {
    "text" : "",
    "typeId" : "",
    "online" : true,
    "isProduct" : false,
    "workspace" : {
        "fields" : {
            "Overview" : "",
            "image" : "",
            "GettingAround" : "",
            "NightLife" : "",
            "Shopping" : "",
            "Sightseeing" : "",
            "KidsAttraction" : "",
            "Restaurant" : "",
            "Climate" : "",
            "PhotoPath" : "",
            "position" : {
                "address" : "",
                "altitude" : "",
                "lat" : 0,
                "lon" : 0,
                "location" : {
                    "type" : "Point",
                    "coordinates" : [ 
                        0, 
                        0
                    ]
                }
            },
            "CountryName" : "",
            "NoOfTours" : 0
        },
        "status" : "published",
        "taxonomy" : {
            "navigation" : [ 
                "57e227bb6d0e81ad168b4768", 
                "580726bd6d0e810b3d7b23c6"
            ],
            "57b18d746d0e81e174c66324" : [], //iso world region 
            // "57b18d746d0e81e174c66330" : [], //restaurant id
            // "57e9ecb46d0e817745dc0fc3" : [], //event id
            // "57b18d746d0e81e174c6632e" : [], //attraction id
            // "57e9ecb46d0e817745dc0fc1" : [], //kids attraction id
            // "57b18d746d0e81e174c6632c" : [], //airport id
            // "57b18d746d0e81e174c66328" : [], //region city id
            "57b18d746d0e81e174c66322" : [], //country code
            // "57b18d746d0e81e174c66326" : [], //province code
            // "57e9ecb46d0e817745dc0fbd" : [], //Is Major City
            // "57e9ecb46d0e817745dc0fbf" : [], //Is Region City
            "5762645b6d0e81f93acd2599" : [], //Editor Choice
            "587863e56d0e81fb4014b289" : [   //Search Selector
                "5878647c6d0e816e4114b288"
            ],
            "589c085b6d0e819e13623adc" : [], //City
            "57638ca16d0e810758cd2507" : [], //Tour Destination
            "58a416076d0e81a9466a306b" : [], //Country
            "58a416516d0e81e1476a3066" : []  //State / Province
        },
        "startPublicationDate" : null,
        "endPublicationDate" : null,
        "target" : [ 
            "global"
        ],
        "writeWorkspace" : "global",
        "pageId" : "",
        "maskId" : "",
        "blockId" : "",
        "i18n" : {
            "en" : {
                "fields" : {
                    "text" : "",
                    "urlSegment" : "",
                    "summary" : "",
                    "viatorLandingURL" : {
                        "title" : "",
                        "url" : "",
                        "openInNewWindow" : true
                    },
                    "pdfCoverUrl" : "",
                    "pdfRecommand" : "",
                    "pdfCatalogueUrl" : "",
                    "pdfCurrency" : "",
                    "pdfCurrencyUrl" : "",
                    "pdfCustoms" : "",
                    "pdfHoliday" : "",
                    "pdfTransportationUrl" : "",
                    "pdfAttractionMapUrl" : [],
                    "cityGoogleMapUrl" : "",
                    "pdfBackCoverUrl" : ""
                },
                "locale" : "en"
            }
        },
        "nativeLanguage" : "en",
        "clickStreamEvent" : ""
    },
    "version" : 0,
    "lastUpdateUser" : {
        "id": "55a4ab8b86c747a0758b4567",
        "login": "admin",
        "fullName": "Web Admin"       
    },
    "createUser" : {
        "id": "55a4ab8b86c747a0758b4567",
        "login": "admin",
        "fullName": "Web Admin"       
    },
    "createTime" : 0,
    "lastUpdateTime" : 0,
    "productProperties" : ""
}

let getSingleTxTermsIdAsync = async (mdbUrl, txVocId, txTermName) => {

	// options = {
	// 	mdbUrl: '',
	// 	txVocName: '',
	// 	txTermName: '',
	// }
	// 
	if(!mdbUrl){
		console.log('mdbUrl is required! Return...')
		return null
	}

	if(!txVocId){
		console.log('Error! TX Vocabulary Id is necessary!')
		return null
	}

	if(!txTermName){
		console.log('Error! TX Term Name for VocId: %s is necessary!', txVocId)
		return null
	}

	let db
	try{
		db = await MongoClient.connect(mdbUrl)
	} catch(err){
		console.log('Connect to DB - %s Error!!', mdbUrl)
		throw err
	}

	let clt = db.collection('TaxonomyTerms')
	let doc = ''
	let opts = {fields: {_id:1}}
	let qry = {
		text: txTermName,
		vocabularyId : txVocId
	}
	try{
		doc = await clt.findOne(qry,opts)
	} catch(err){
		console.log('Find data: id - %s error on collection %s of DB - %s, Error = %s', id, collection, mdbUrl, err )
		throw err
		return doc
	} finally{
		db.close()
	}
	
	return doc._id.toString()
}

let insertSingleContent = async (mdbUrl, ctn, options) => {

	if(!mdbUrl){
		console.log('mdbUrl is required! Return...')
		return null
	}
	if(!ctn){
		console.log('content doc is required! Return...')
		return null
	}
	if(!options)
		options = {forceServerObjectId:true}

	ctn.createTime = parseInt((Date.now()/1000).toFixed(0))
	ctn.lastUpdateTime = ctn.createTime

	let db
	try{
		db = await MongoClient.connect(mdbUrl)
	} catch(err){
		console.log('Connect to DB - %s Error!!', mdbUrl)
		throw err
	}

	let clt = db.collection('Contents')

	let res
	try{
		res = await clt.insertOne(ctn, options)
	} catch(err){
		console.log('Inset data: %s error happened! NOW return err...')
		throw err
	} finally{
		db.close()
	}

	return res

}

// commented the following code because get Geo info has been done in dataComparisonWithList.js
// 
// 
// let gmAPIConf
// let gmAPI

// if(themesType ==='WHS'){
// //google maps api
// 	gmAPIConf = {
// 	  key: 'AIzaSyBrZTmy5AzHgXFV9JNUpZKcc1faRaqJA4U',
// 	  stagger_time:       1000, // for elevationPath
// 	  encode_polylines:   false,
// 	  secure:             true // use https
// 	};
// 	gmAPI = new GoogleMapsAPI(gmAPIConf)
// }

// let getInfoByGeoCoordinates = async (lat, lon) => {

// 	let deCoordinates = (rGeoParams) => {
// 		return new Promise( (resolve, reject) => {
// 			gmAPI.reverseGeocode(rGeoParams, (err,r) => {
// 				if(err)
// 					reject(new Error(err))
// 				else{
// 					let loc = {
// 						'continent': '',
// 						'country': '',
// 						'countryCode':'',
// 						'state': '',
// 						'city': '',
// 						'locality': '',
// 						'colloquial_area': '',
// 						'neighborhood': ''
// 					};

// 					let go = false;

// 					switch(r.status){
// 						case 'OK':
// 							go = true;
// 							console.log('gmAPI Status Code = OK!');
// 							break;
// 						case 'ZERO_RESULTS':
// 							console.log('gmAPI Status Code = ZERO_RESULTS!');
// 							break;
// 						case 'OVER_QUERY_LIMIT':
// 							console.log('gmAPI Status Code = OVER_QUERY_LIMIT!');
// 							break;
// 						case 'REQUEST_DENIED':
// 							console.log('gmAPI Status Code = REQUEST_DENIED!');
// 							break;
// 						case 'INVALID_REQUEST':
// 							console.log('gmAPI Status Code = INVALID_REQUEST!');
// 							break;
// 						default:
// 							console.log('gmAPI Status Code = UNKNOWN_ERROR!');
// 					}

// 					if(go){
// 						var data = r.results;
// 						data.forEach((item) => {
// 							if(loc.country.length === 0 || loc.state.length === 0 || loc.city.length === 0 || loc.locality.length === 0 || loc.neighborhood.length === 0 || loc.colloquial_area.length === 0){
// 								var address_components = item.address_components;
// 								address_components.forEach((address_component)=>{
// 									var addrTypes = address_component.types;
// 									var stopFlag = false;
// 									var stopCat = '';
// 									addrTypes.forEach((addrType)=>{
// 										if(!stopFlag){
// 											switch(addrType){
// 												case 'country':
// 													stopFlag = true;
// 													stopCat = 'country';
// 													break;
// 												case 'locality':
// 													stopFlag = true;
// 													stopCat = 'locality';
// 													break;
// 												case 'administrative_area_level_1':
// 													stopFlag = true;
// 													stopCat = 'state';
// 													break;
// 												case 'administrative_area_level_2':
// 													stopFlag = true;
// 													stopCat = 'city';
// 													break;
// 												case 'neighborhood':
// 													stopFlag = true;
// 													stopCat = 'neighborhood';
// 													break;
// 												case 'colloquial_area':
// 													stopFlag = true;
// 													stopCat = 'colloquial_area';
// 													break;
// 												default:
// 											}											
// 										}
// 									});

// 									if(stopFlag){
// 										switch(stopCat){
// 											case 'country':
// 												// loc.country = address_component.long_name;
// 												loc.countryCode = address_component.short_name;
// 												// loc.country = getCountryName(loc.countryCode);
// 												loc.country = ccMap[loc.countryCode].countryName;
// 												break;
// 											case 'locality':
// 												loc.locality = address_component.long_name;
// 												break;
// 											case 'state':
// 												loc.state = address_component.long_name;
// 												break;
// 											case 'city':
// 												loc.city = address_component.long_name;
// 												break;
// 											case 'neighborhood':
// 												loc.neighborhood = address_component.long_name;
// 												break;
// 											case 'colloquial_area':
// 												loc.colloquial_area = address_component.long_name;
// 												break;
// 											default:
// 										}
// 									}

// 								});
// 							}
// 						});
// 						// loc.continent = getContinentName(loc.countryCode);
// 						loc.continent = ccMap[loc.countryCode].continentName;
// 					}

// 					resolve(loc)
// 				}
// 			})
// 		})
// 	}

// 	let reverseGeocodeParams = {
// 	  "latlng": Number(lat)+','+Number(lon),
// 	  //"result_type": "administrative_area_level_4",
// 	  "language": "en"//,
// 	  //"location_type": "APPROXIMATE"
// 	};

// 	loc = await deCoordinates(reverseGeocodeParams)
// 	return loc
// }

let main = async () => {

	//get taxonomy Themes term id
	let themesTermId
	if(themesType !== 'NONE'){
		try{
			themesTermId = await getSingleTxTermsIdAsync(mdbUrl,"57ea19736d0e81454c7b23d0",themesTerm)
		} catch(err){
			console.log('1-find taxonomy Themes term id error!')
		}
	}

	let count = data.length
	let i = 0
	while(i<count){
		let item = data[i]
		let wikiDataObj = {}
		let wikitextObj = {}
		let wikiImages = []
		let content = {}
		let contentDetails = {}

		console.log('wikiData = %s, count = %s', item.wikiData, i+1)

		if(ctnType === 'City'){
			content = JSON.parse(JSON.stringify(cityDocTemplate))
			contentDetails = JSON.parse(JSON.stringify(cityDocTemplate))
			content.typeId = ctnTypeId
			contentDetails.typeId = ctnDetailsTypeId
			delete contentDetails.workspace.taxonomy["57638ca16d0e810758cd2507"] //Tour Destination
			delete contentDetails.workspace.taxonomy["587863e56d0e81fb4014b289"] //Search Selector
		} else if(ctnType === 'Att'){
			content = JSON.parse(JSON.stringify(attDocTemplate))
			contentDetails = JSON.parse(JSON.stringify(attDocTemplate))
			content.typeId = ctnTypeId
			contentDetails.typeId = ctnDetailsTypeId
            delete contentDetails.workspace.taxonomy["57ea19736d0e81454c7b23d0"] //Themes
			delete contentDetails.workspace.taxonomy["57638ca16d0e810758cd2507"] //Tour Destination
			delete contentDetails.workspace.taxonomy["587863e56d0e81fb4014b289"] //Search Selector
		}

		//initiate standard fields
		
		content.text = item.bookurData
		content.workspace.i18n.en.fields.text = item.bookurData
		contentDetails.text = item.bookurData
		contentDetails.workspace.i18n.en.fields.text = item.bookurData

		let loc
		if(themesType ==='WHS'){
			let smy = item.shortDesc.replace(/<.*?>/g,'')
			content.workspace.i18n.en.fields.summary = smy
			contentDetails.workspace.i18n.en.fields.summary = smy

			content.workspace.fields.position.lat = Number(item.lat)
			content.workspace.fields.position.lon = Number(item.lon)
			content.workspace.fields.position.location.coordinates = [Number(item.lon), Number(item.lat)]
			contentDetails.workspace.fields.position = JSON.parse(JSON.stringify(content.workspace.fields.position)) 

			// let cCode = item.countryCode.toUpperCase()
			content.workspace.fields.CountryName = item.loc.country
			content.workspace.fields.CityName = item.loc.city
			contentDetails.workspace.fields.CountryName = item.loc.country
			contentDetails.workspace.fields.CityName = item.loc.city
			 
			// loc = await getInfoByGeoCoordinates(Number(item.lat), Number(item.lon))
			// console.log('loc = %s', JSON.stringify(loc))
		}

		if(ctnType === 'City'){
			content.workspace.fields.position.lat = Number(item.lat)
			content.workspace.fields.position.lon = Number(item.lon)
			content.workspace.fields.position.location.coordinates = [Number(item.lon), Number(item.lat)]
			contentDetails.workspace.fields.position = JSON.parse(JSON.stringify(content.workspace.fields.position)) 

			// let cCode = item.countryCode.toUpperCase()
			content.workspace.fields.CountryName = item.loc.country
			contentDetails.workspace.fields.CountryName = item.loc.country
			 
			// loc = await getInfoByGeoCoordinates(Number(item.lat), Number(item.lon))
			// console.log('loc = %s', JSON.stringify(loc))
		}

		let now = parseInt((Date.now()/1000).toFixed(0))
		content.createTime = now
		contentDetails.createTime = now

		try{
			wikiDataObj = await wikiUtil.getWikiDataById(item.source, item.wikiDataId)
		} catch(err){
			console.log('Get WikiData Error - %s', item.wikiData)
			throw err
		}

		if(wikiDataObj){
			wikitextObj = wikiDataObj.text
			wikiImages = wikiDataObj.images
		}

		if(wikiImages.length){
			content.workspace.fields.wikiImages = wikiImages
			contentDetails.workspace.fields.wikiImages = wikiImages

			content.workspace.fields.PhotoPath = wikiImages[0].thumb
			content.workspace.fields.photoPathOriginal = wikiImages[0].url
			contentDetails.workspace.fields.PhotoPath = wikiImages[0].thumb
			contentDetails.workspace.fields.photoPathOriginal = wikiImages[0].url
		}

		let wikitextKey = []
		let wikitextKeyCount = 0
		if(wikitextObj){
			wikitextKey = Object.keys(wikitextObj)
			wikitextKeyCount = wikitextKey.length
		}

		let j = 0
		let overviewClearFlag = true
		let restaurantClearFlag = true
		while(j < wikitextKeyCount){
			let key = wikitextKey[j]
			let htmlBody = ''
			if(ctnType === 'City'){
				switch(key){
					case 'Intro':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						if(overviewClearFlag){
							content.workspace.fields.Overview = ''
							overviewClearFlag = false
							content.workspace.fields.Overview = htmlBody
							contentDetails.workspace.fields.Overview = htmlBody
						}

						htmlBody = htmlBody.replace(/<.*?>/g,'')
						content.workspace.i18n.en.fields.summary = htmlBody
						contentDetails.workspace.i18n.en.fields.summary = htmlBody

						break;

					case 'Understand':
						if(overviewClearFlag){ //the first time update overview
							if(wikitextObj['Intro']){
								try{
									htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj['Intro'][0])	
								} catch(err){
									console.log('Get html from wikitext "Intro" for wikidata %s Error - %s', item.wikiData, err)
								}

								if(overviewClearFlag){
									content.workspace.fields.Overview = ''
									overviewClearFlag = false
									content.workspace.fields.Overview = htmlBody
									contentDetails.workspace.fields.Overview = htmlBody
								} else{
									content.workspace.fields.Overview += '<br /><h2>Introduction</h2><br />' + htmlBody
									contentDetails.workspace.fields.Overview += '<br /><h2>Introduction</h2><br />' + htmlBody
								}
							}
							
							try{
								htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
							} catch(err){
								console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
							}

							if(overviewClearFlag){
								content.workspace.fields.Overview = ''
								overviewClearFlag = false
								content.workspace.fields.Overview = htmlBody
								contentDetails.workspace.fields.Overview = htmlBody
							} else{
								content.workspace.fields.Overview += '<br /><h2>Understand</h2><br />' + htmlBody
								contentDetails.workspace.fields.Overview += '<br /><h2>Understand</h2><br />' + htmlBody
							}
						} else{ //Not the first time
							try{
								htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
							} catch(err){
								console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
							}

							if(overviewClearFlag){
								content.workspace.fields.Overview = ''
								overviewClearFlag = false
								content.workspace.fields.Overview = htmlBody
								contentDetails.workspace.fields.Overview = htmlBody
							} else{
								content.workspace.fields.Overview += '<br /><h2>Understand</h2><br />' + htmlBody
								contentDetails.workspace.fields.Overview += '<br /><h2>Understand</h2><br />' + htmlBody
							}						
						}

						break;

					case 'Get around':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.GettingAround = htmlBody
						contentDetails.workspace.fields.GettingAround = htmlBody

						break;

					case 'Buy':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.Shopping = htmlBody
						contentDetails.workspace.fields.Shopping = htmlBody

						break;

					case 'See':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.Sightseeing = htmlBody
						contentDetails.workspace.fields.Sightseeing = htmlBody

						break;

					case 'Eat':	
						if(!restaurantClearFlag){
							content.workspace.fields.Restaurant += '<br />'
							contentDetails.workspace.fields.Restaurant += '<br />'
						} else{
							restaurantClearFlag = false
							content.workspace.fields.Restaurant = ''
							contentDetails.workspace.fields.Restaurant = ''
						}

						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.Restaurant += htmlBody
						contentDetails.workspace.fields.Restaurant += htmlBody

						break;

					case 'Drink':	
						if(!restaurantClearFlag){
							content.workspace.fields.Restaurant += '<br />'
							contentDetails.workspace.fields.Restaurant += '<br />'
						} else{
							restaurantClearFlag = false
							content.workspace.fields.Restaurant = ''
							contentDetails.workspace.fields.Restaurant = ''
						}

						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.Restaurant += htmlBody
						contentDetails.workspace.fields.Restaurant += htmlBody

						break;

					case 'Get in':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.getIn = htmlBody
						contentDetails.workspace.fields.getIn = htmlBody

						break;

					case 'Go next':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.goNext = htmlBody
						contentDetails.workspace.fields.goNext = htmlBody

						break;

					case 'Do':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.do = htmlBody
						contentDetails.workspace.fields.do = htmlBody

						break;

					case 'Sleep':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.sleep = htmlBody
						contentDetails.workspace.fields.sleep = htmlBody

						break;

					case 'Stay safe':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.staySafe = htmlBody
						contentDetails.workspace.fields.staySafe = htmlBody

						break;

					case 'Stay healthy':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.stayHealthy = htmlBody
						contentDetails.workspace.fields.stayHealthy = htmlBody

						break;

					case 'Talk':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.talk = htmlBody
						contentDetails.workspace.fields.talk = htmlBody

						break;

					default:
				}
			} else if(ctnType === 'Att'){
				switch(key){
					case 'Intro':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						if(overviewClearFlag){
							content.workspace.fields.Description = ''
							overviewClearFlag = false
							content.workspace.fields.Description = htmlBody
							contentDetails.workspace.fields.Description = htmlBody
						}

						if(themesType !=='WHS'){
							htmlBody = htmlBody.replace(/<.*?>/g,'')
							content.workspace.i18n.en.fields.summary = htmlBody
							contentDetails.workspace.i18n.en.fields.summary = htmlBody
						}

						break;

					case 'Understand':
						if(overviewClearFlag){ //the first time update overview
							if(wikitextObj['Intro']){
								try{
									htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj['Intro'][0])	
								} catch(err){
									console.log('Get html from wikitext "Intro" for wikidata %s Error - %s', item.wikiData, err)
								}

								if(overviewClearFlag){
									content.workspace.fields.Description = ''
									overviewClearFlag = false
									content.workspace.fields.Description = htmlBody
									contentDetails.workspace.fields.Description = htmlBody
								} else{
									content.workspace.fields.Description += '<br /><h2>Introduction</h2><br />' + htmlBody
									contentDetails.workspace.fields.Description += '<br /><h2>Introduction</h2><br />' + htmlBody
								}
							}
							
							try{
								htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
							} catch(err){
								console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
							}

							if(overviewClearFlag){
								content.workspace.fields.Description = ''
								overviewClearFlag = false
								content.workspace.fields.Description = htmlBody
								contentDetails.workspace.fields.Description = htmlBody
							} else{
								content.workspace.fields.Description += '<br /><h2>Understand</h2><br />' + htmlBody
								contentDetails.workspace.fields.Description += '<br /><h2>Understand</h2><br />' + htmlBody
							}
						} else{ //Not the first time
							try{
								htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
							} catch(err){
								console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
							}

							if(overviewClearFlag){
								content.workspace.fields.Description = ''
								overviewClearFlag = false
								content.workspace.fields.Description = htmlBody
								contentDetails.workspace.fields.Description = htmlBody
							} else{
								content.workspace.fields.Description += '<br /><h2>Understand</h2><br />' + htmlBody
								contentDetails.workspace.fields.Description += '<br /><h2>Understand</h2><br />' + htmlBody
							}						
						}

						break;

					case 'Get around':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.getAround = htmlBody
						contentDetails.workspace.fields.getAround = htmlBody

						break;

					case 'Buy':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.buy = htmlBody
						contentDetails.workspace.fields.buy = htmlBody

						break;

					case 'See':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.see = htmlBody
						contentDetails.workspace.fields.see = htmlBody

						break;

					case 'Eat':	
						if(!restaurantClearFlag){
							content.workspace.fields.eatNDrink += '<br />'
							contentDetails.workspace.fields.eatNDrink += '<br />'
						} else{
							restaurantClearFlag = false
							content.workspace.fields.eatNDrink = ''
							contentDetails.workspace.fields.eatNDrink = ''
						}

						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.eatNDrink += htmlBody
						contentDetails.workspace.fields.eatNDrink += htmlBody

						break;

					case 'Drink':	
						if(!restaurantClearFlag){
							content.workspace.fields.eatNDrink += '<br />'
							contentDetails.workspace.fields.eatNDrink += '<br />'
						} else{
							restaurantClearFlag = false
							content.workspace.fields.eatNDrink = ''
							contentDetails.workspace.fields.eatNDrink = ''
						}

						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.eatNDrink += htmlBody
						contentDetails.workspace.fields.eatNDrink += htmlBody

						break;

					case 'Get in':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.getIn = htmlBody
						contentDetails.workspace.fields.getIn = htmlBody

						break;

					case 'Go next':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.goNext = htmlBody
						contentDetails.workspace.fields.goNext = htmlBody

						break;

					case 'Do':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.do = htmlBody
						contentDetails.workspace.fields.do = htmlBody

						break;

					case 'Sleep':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.sleep = htmlBody
						contentDetails.workspace.fields.sleep = htmlBody

						break;

					case 'Stay safe':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.staySafe = htmlBody
						contentDetails.workspace.fields.staySafe = htmlBody

						break;
					default:
				}
			} else if(ctnType === 'Country'){
				switch(key){
					case 'Intro':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						if(overviewClearFlag){
							content.workspace.fields.destination_overview = ''
							overviewClearFlag = false
							content.workspace.fields.destination_overview = htmlBody
							contentDetails.workspace.fields.destination_overview = htmlBody
						}

						htmlBody = htmlBody.replace(/<.*?>/g,'')
						content.workspace.i18n.en.fields.summary = htmlBody
						contentDetails.workspace.i18n.en.fields.summary = htmlBody

						break;

					case 'Understand':
						if(overviewClearFlag){ //the first time update overview
							if(wikitextObj['Intro']){
								try{
									htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj['Intro'][0])	
								} catch(err){
									console.log('Get html from wikitext "Intro" for wikidata %s Error - %s', item.wikiData, err)
								}

								if(overviewClearFlag){
									content.workspace.fields.destination_overview = ''
									overviewClearFlag = false
									content.workspace.fields.destination_overview = htmlBody
									contentDetails.workspace.fields.destination_overview = htmlBody
								} else{
									content.workspace.fields.destination_overview += '<br /><h2>Introduction</h2><br />' + htmlBody
									contentDetails.workspace.fields.destination_overview += '<br /><h2>Introduction</h2><br />' + htmlBody
								}
							}
							
							try{
								htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
							} catch(err){
								console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
							}

							if(overviewClearFlag){
								content.workspace.fields.destination_overview = ''
								overviewClearFlag = false
								content.workspace.fields.destination_overview = htmlBody
								contentDetails.workspace.fields.destination_overview = htmlBody
							} else{
								content.workspace.fields.destination_overview += '<br /><h2>Understand</h2><br />' + htmlBody
								contentDetails.workspace.fields.destination_overview += '<br /><h2>Understand</h2><br />' + htmlBody
							}
						} else{ //Not the first time
							try{
								htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
							} catch(err){
								console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
							}

							if(overviewClearFlag){
								content.workspace.fields.destination_overview = ''
								overviewClearFlag = false
								content.workspace.fields.destination_overview = htmlBody
								contentDetails.workspace.fields.destination_overview = htmlBody
							} else{
								content.workspace.fields.destination_overview += '<br /><h2>Understand</h2><br />' + htmlBody
								contentDetails.workspace.fields.destination_overview += '<br /><h2>Understand</h2><br />' + htmlBody
							}						
						}

						break;

					case 'Get around':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.getAround = htmlBody
						contentDetails.workspace.fields.getAround = htmlBody

						break;

					case 'Buy':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.buy = htmlBody
						contentDetails.workspace.fields.buy = htmlBody

						break;

					case 'See':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.attraction_overview = htmlBody
						contentDetails.workspace.fields.attraction_overview = htmlBody

						break;

					case 'Eat':	
						if(!restaurantClearFlag){
							content.workspace.fields.eatNDrink += '<br />'
							contentDetails.workspace.fields.eatNDrink += '<br />'
						} else{
							restaurantClearFlag = false
							content.workspace.fields.eatNDrink = ''
							contentDetails.workspace.fields.eatNDrink = ''
						}

						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.eatNDrink += htmlBody
						contentDetails.workspace.fields.eatNDrink += htmlBody

						break;

					case 'Drink':	
						if(!restaurantClearFlag){
							content.workspace.fields.eatNDrink += '<br />'
							contentDetails.workspace.fields.eatNDrink += '<br />'
						} else{
							restaurantClearFlag = false
							content.workspace.fields.eatNDrink = ''
							contentDetails.workspace.fields.eatNDrink = ''
						}

						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.eatNDrink += htmlBody
						contentDetails.workspace.fields.eatNDrink += htmlBody

						break;

					case 'Get in':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.getIn = htmlBody
						contentDetails.workspace.fields.getIn = htmlBody

						break;

					case 'Talk':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.talk = htmlBody
						contentDetails.workspace.fields.talk = htmlBody

						break;

					case 'Cities':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.cities = htmlBody
						contentDetails.workspace.fields.cities = htmlBody

						break;

					case 'Do':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.do = htmlBody
						contentDetails.workspace.fields.do = htmlBody

						break;

					case 'Sleep':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.sleep = htmlBody
						contentDetails.workspace.fields.sleep = htmlBody

						break;

					case 'Stay safe':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.safety = htmlBody
						contentDetails.workspace.fields.safety = htmlBody

						break;

					case 'Stay healthy':
						try{
							htmlBody = await wikiUtil.parseWikitext2Html(wikitextObj[key][0])	
						} catch(err){
							console.log('Get html from wikitext %s for wikidata %s Error - %s', key, item.wikiData, err)
						}

						content.workspace.fields.health = htmlBody
						contentDetails.workspace.fields.health = htmlBody

						break;
					default:
				}
			}

			j++
		}

		content.workspace.fields.wikiSource = item.source
		contentDetails.workspace.fields.wikiSource = item.source

		// Deal with Taxonomy
		if(ctnType === 'Att'){
			try{
				let termId = await getSingleTxTermsIdAsync(mdbUrl,"5902ed996d0e819c507b23c8",item.bookurData)
				if(content.workspace.taxonomy["5902ed996d0e819c507b23c8"].indexOf(termId) === -1){
					content.workspace.taxonomy["5902ed996d0e819c507b23c8"].push(termId)
				}
				if(contentDetails.workspace.taxonomy["5902ed996d0e819c507b23c8"].indexOf(termId) === -1){
					contentDetails.workspace.taxonomy["5902ed996d0e819c507b23c8"].push(termId)
				}
			} catch(err){
				console.log('1-find taxonomy Attraction term id error!')
			}
		}

		try{
			let termId = await getSingleTxTermsIdAsync(mdbUrl,"57638ca16d0e810758cd2507",item.bookurData)
			if(content.workspace.taxonomy["57638ca16d0e810758cd2507"].indexOf(termId) === -1){
				content.workspace.taxonomy["57638ca16d0e810758cd2507"].push(termId)
			}
		} catch(err){
			console.log('1-find taxonomy Tour Destination term id error!')
		}

		if(ctnType === 'Att'){
			if(themesType !== 'NONE'){ //taxonomy Themes
				if(content.workspace.taxonomy["57ea19736d0e81454c7b23d0"].indexOf(themesTermId) === -1){
					content.workspace.taxonomy["57ea19736d0e81454c7b23d0"].push(themesTermId)
				}
				if(contentDetails.workspace.taxonomy["57ea19736d0e81454c7b23d0"].indexOf(themesTermId) === -1){
					contentDetails.workspace.taxonomy["57ea19736d0e81454c7b23d0"].push(themesTermId)
				}
			}
		}

		if(themesType === 'WHS' || ctnType === 'City'){
			if(item.loc.continent){
				try{
					let termId = await getSingleTxTermsIdAsync(mdbUrl,"57b18d746d0e81e174c66324",item.loc.continent)
					if(content.workspace.taxonomy["57b18d746d0e81e174c66324"].indexOf(termId) === -1){
						content.workspace.taxonomy["57b18d746d0e81e174c66324"].push(termId)
					}
					if(contentDetails.workspace.taxonomy["57b18d746d0e81e174c66324"].indexOf(termId) === -1){
						contentDetails.workspace.taxonomy["57b18d746d0e81e174c66324"].push(termId)
					}
				} catch(err){
					console.log('1-find taxonomy iso world region term id error!')
				}
			}

			if(item.loc.countryCode){
				try{
					let termId = await getSingleTxTermsIdAsync(mdbUrl,"57b18d746d0e81e174c66322",item.loc.countryCode)
					if(content.workspace.taxonomy["57b18d746d0e81e174c66322"].indexOf(termId) === -1){
						content.workspace.taxonomy["57b18d746d0e81e174c66322"].push(termId)
					}
					if(contentDetails.workspace.taxonomy["57b18d746d0e81e174c66322"].indexOf(termId) === -1){
						contentDetails.workspace.taxonomy["57b18d746d0e81e174c66322"].push(termId)
					}
				} catch(err){
					console.log('1-find taxonomy country code term id error!')
				}
			}

			if(item.loc.city){
				try{
					let termId = await getSingleTxTermsIdAsync(mdbUrl,"589c085b6d0e819e13623adc",item.loc.city)
					if(content.workspace.taxonomy["589c085b6d0e819e13623adc"].indexOf(termId) === -1){
						content.workspace.taxonomy["589c085b6d0e819e13623adc"].push(termId)
					}
					if(contentDetails.workspace.taxonomy["589c085b6d0e819e13623adc"].indexOf(termId) === -1){
						contentDetails.workspace.taxonomy["589c085b6d0e819e13623adc"].push(termId)
					}
				} catch(err){
					console.log('1-find taxonomy City term id error!')
				}
			}
		}

		if(ctnType === 'City'){
			if(item.loc.country){
				try{
					let termId = await getSingleTxTermsIdAsync(mdbUrl,"58a416076d0e81a9466a306b",item.loc.country)
					if(content.workspace.taxonomy["58a416076d0e81a9466a306b"].indexOf(termId) === -1){
						content.workspace.taxonomy["58a416076d0e81a9466a306b"].push(termId)
					}
					if(contentDetails.workspace.taxonomy["58a416076d0e81a9466a306b"].indexOf(termId) === -1){
						contentDetails.workspace.taxonomy["58a416076d0e81a9466a306b"].push(termId)
					}
				} catch(err){
					console.log('1-find taxonomy Country term id error!')
				}
			}			
		}

		content.live = content.workspace
		contentDetails.live = contentDetails.workspace

		if(operateDB){
			let res
			try{
				res = await insertSingleContent(mdbUrl, content)
			} catch(err){
				console.log('Insert master content - %s - Error! err = %s', content.text, err)
			}
			console.log('Insert master content - %s succeeded! res = %s', content.text, JSON.stringify(res))

			try{
				res = await insertSingleContent(mdbUrl, contentDetails)
			} catch(err){
				console.log('Update detail content - %s - Error! err = %s', contentDetails.text, err)
			}
			console.log('Update detail content - %s succeeded! res = %s', contentDetails.text, JSON.stringify(res))			
		} else{
			content4DB.push(content)
			contentDetails4DB.push(contentDetails)
		}

		i++
	}

	if(!operateDB){
		fs.writeFileSync('./log/importListData2DB-' + listFile + '-'+ctnType+'-content.json', JSON.stringify(content4DB));
		fs.writeFileSync('./log/importListData2DB-' + listFile + '-'+ctnType+'-contentDetails.json', JSON.stringify(contentDetails4DB));		
	}

	console.log('****** Import %s Data from %s to %s DONE ******', ctnType, listFile, targetEnv)
}

main()
