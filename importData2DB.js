/*jshint esversion: 6 */

//useage: node importData2DB.js City PRODUCTION OPDB ---> for content type City
//useage: node importData2DB.js Att PRODUCTION OPDB ---> for content type Attraction

const fs = require('fs')
const MongoClient = require('mongodb').MongoClient
const wikiUtil = require('./lib/wikiUtil.js')
const buUtil = require('./lib/bookurUtil.js')

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

var targetEnv = process.argv[3]
var dbOPSwitch = process.argv[4]
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

let data = []
if(fs.existsSync('./mapping/compare' + ctnType + 'Result.json'))
	data = require('./mapping/compare' + ctnType + 'Result.json')
if(fs.existsSync('./mapping/compare' + ctnType + 'Manual.json')){
	let tmp = require('./mapping/compare' + ctnType + 'Manual.json')
	data = data.concat(tmp)
}
if(fs.existsSync('./mapping/compare' + ctnType + 'Correction.json')){
	let tmp = require('./mapping/compare' + ctnType + 'Correction.json')
	data = data.concat(tmp)
}

if(!data){
	console.log('There is no data for imprting! Abort!')
	process.exit(1)
}

let main = async () => {

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

		try{
			wikiDataObj = await wikiUtil.getWikiDataById(item.source, item.wikiDataId)
		} catch(err){
			console.log('Get WikiData Error - %s', item.wikiData)
			throw err
		}

		try{
			content = await buUtil.getSingleContentById(mdbUrl, item.bookurDataId)
		} catch(err){
			console.log('Get Content Error - %s', item.bookurData)
			throw err
		}

		try{
			contentDetails = await buUtil.getSingleContentDetailsByMasterId(mdbUrl, item.bookurDataId)
		} catch(err){
			console.log('Get Content Details Error - %s', item.bookurData)
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
			}

			j++
		}

		content.workspace.fields.wikiSource = item.source
		contentDetails.workspace.fields.wikiSource = item.source

		content.live = content.workspace
		contentDetails.live = contentDetails.workspace

		// content.text = item.bookurData
		// content.workspace.i18n.en.fields.text = item.bookurData
		// contentDetails.text = item.bookurData
		// contentDetails.workspace.i18n.en.fields.text = item.bookurData

		if(operateDB){
			let res
			let filter = {_id: content._id}
			let options = {}
			try{
				res = await buUtil.updateSingleContent(mdbUrl, filter, content, options)
			} catch(err){
				console.log('Update master content - %s - Error! err = %s', content.text, err)
			}
			console.log('Update master content - %s succeeded!', content.text)

			filter = {_id: contentDetails._id}
			try{
				res = await buUtil.updateSingleContent(mdbUrl, filter, contentDetails, options)
			} catch(err){
				console.log('Update detail content - %s - Error! err = %s', contentDetails.text, err)
			}
			console.log('Update detail content - %s succeeded!', contentDetails.text)			
		} else{
			content4DB.push(content)
			contentDetails4DB.push(contentDetails)
		}

		i++
	}

	if(!operateDB){
		fs.writeFileSync('./log/importData2DB-'+ctnType+'-content.json', JSON.stringify(content4DB));
		fs.writeFileSync('./log/importData2DB-'+ctnType+'-contentDetails.json', JSON.stringify(contentDetails4DB));		
	}

	console.log('****** Import %s Data to %s DONE ******', ctnType, targetEnv)
}

main()
