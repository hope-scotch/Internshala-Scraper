// const request = require('postman-request')
const axios = require('axios')
const { JSDOM } = require('jsdom')
const { DataFrame } = require('dataframe-js')
const yargs = require('yargs')

yargs.version('1.1.0')

const profileList = []
const stipendList = []
const durationList = []
const deadlineList = []
const companyList = []
const locList = []

const find = async i => {
  const url = 'https://internshala.com/internships/page-' + encodeURIComponent(i)
  console.log('Searching ...Page', i)
  
  const { data } = await axios.get(url)
  // console.log(data)
  const dom = new JSDOM(data)

  const { document } = dom.window
  const companies = document.querySelectorAll('.company_name')
  const profiles = document.querySelectorAll('.profile')
  const stipends = document.querySelectorAll('.stipend')
  const loc_names = document.querySelectorAll('.location_names')
  const durations = data.match(/\d\sMonths/g)
  const apply_bys = document.querySelectorAll('.apply_by')

  companies.forEach(company => companyList.push(company.textContent.trim()))
  profiles.forEach(profile => profileList.push(profile.textContent.trim()))
  stipends.forEach(stipend => stipendList.push( parseInt(stipend.textContent.trim() )) )
  loc_names.forEach(loc_names => locList.push(loc_names.textContent.trim()))
  durations.forEach(duration => durationList.push(duration))
  
  apply_bys.forEach((apply_by) => {
    const deadline = apply_by.textContent
    const text = deadline.match(/(\d\d|\d)\s\w\w\w\W\s\d\d/g)
    deadlineList.push(text)
  })

  return { companyList, profileList, stipendList, locList, durationList, deadlineList }
}

const startScraping = async stipend => {
  console.log('Finding number of pages to scrape...')
  const url = 'https://internshala.com/internships'
  const { data } = await axios.get(url)
  const dom = new JSDOM(data)
  const PAGES = parseInt(dom.window.document.querySelector('#total_pages').textContent)
  console.log('Pages found:', PAGES)  

  var resData = {}

  for (let idx = 1; idx <= PAGES; idx++) {
    const res = await find(idx)

    resData = { ...resData, ...res }
  }

  const df = new DataFrame(resData, ['company', 'profile', 'stipend', 'location', 'duration', 'deadline'])
  df.filter(row => row.get('stipend') >= stipend).toTSV(true, './myfile.tsv')
}

yargs.command({
  command: 'stipend',
  describe: 'Add minimum stipend value',
  builder: {
    value: {
      describe: 'Min. Stipend',
      demandOption: true,
      type: 'string'
    }
  },
  handler: (argv) => startScraping(parseInt(argv.value))
})

yargs.parse()