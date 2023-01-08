const delay = require('delay')
const config = require('./config.js')
const provider = require('./provider.js')
const puppeteer = require('puppeteer-extra')
const {executablePath} = require('puppeteer')
const user_agent = require('random-useragent')
const stealth_plugin = require("puppeteer-extra-plugin-stealth")
const recaptcha_plugin = require('puppeteer-extra-plugin-recaptcha')

puppeteer.use(
	recaptcha_plugin({
		provider: {
			id: '2captcha',
			token: config.captcha_token
		},
		visualFeedback: true
	})
)

puppeteer.use(stealth_plugin())

module.exports = class chatgpt_provider extends provider {
	constructor({_verifier,_url,_session}){
		super(_verifier)
		this.questions = []
		this.url = _url
		this.session = _session		
	}

    authenticate = async () => {
		try {
			delay(500)
			await this.open_browser()
			let page = await this.open_url()
			await this.verifier.verify(page)
			await this.handle_username_page(page)
			this.tokens = await get_tokens(page)
			await browser.close()
			return tokens
		} catch (error) {
			
		}
	}

	ask_question = async (question) => {
		// send request using this.tokens
		console.log("question:", question)
		const answer = ""
		this.questions.concat({question:answer})
		return answer
	}

	open_browser = async () => {
		this.browser = await puppeteer.launch({
			headless: false,
			devtools: false,
			args: config.arg_for_browser,
			ignoreDefaultArgs: config.ignoring_args,
			ignoreHTTPSErrors: true,
			executablePath: executablePath(),
			// product: config.product_name
		})	
	}

	open_url = async () => {
		const page = await this.browser.newPage()
		page.setDefaultTimeout(config.timeout)
		// await this.minimize_page(page)
		await page.goto(this.url, {
			waitUntil: 'networkidle2'
		})
		await page.setUserAgent(config.user_agent)
		return page
	}

	minimize_page = async (page) => {
		const session = await page.target().createCDPSession()
		const goods = await session.send('Browser.getWindowForTarget')
		const { windowId } = goods
		await session.send('Browser.setWindowBounds', {
		  windowId, bounds: { windowState: 'minimized' }
		})
	}

	handle_username_page = async(page) => {
		console.log("waiting for login button")
		await page.waitForSelector('#__next .btn-primary', { timeout: config.timeout })
		await delay(config.delay_time)
		await page.click('#__next .btn-primary')
		console.log("clicked login button")
	
		await delay(config.delay_time)
		console.log("waiting for username")
		await page.waitForSelector('#username', { timeout: config.timeout })
	
		await delay(config.delay_time)
		await page.type('#username', this.session.email)
		console.log("entered username")

		await delay(config.delay_time)
		console.log("trying to solve recaptcha")
		await this.verifier.solve_recaptcha(page)
		console.log("solved recaptcha")

		await delay(config.delay_time)
		const frame = page.mainFrame()
		const submit = await page.waitForSelector('button[type="submit"]', {
		  timeout: config.timeout
		})
	
		await frame.focus('button[type="submit"]')
		await submit.focus()
		await submit.click()
	}

	get_tokens = async(page) => {
		const page_cookies = await page.cookies()
		const cookies = page_cookies.reduce(
		  (map, cookie) => ({ ...map, [cookie.name]: cookie }),
		  {}
		)
		console.log("cookies:", cookies)
		return {
			clearanceToken: cookies['cf_clearance']?.value,
			sessionToken: cookies['__Secure-next-auth.session-token']?.value,
		}
	}
}

// const authenticate_to_chatgpt = async (session) => {

	// await page.waitForSelector('#password', { timeout: config.timeout })
	// await page.type('#password', session.password, { delay: 10 })
	// submitP = () => page.click('button[type="submit"]')

	// await page.waitForNavigation({
	// 	waitUntil: 'networkidle2',
	// 	timeout: timeoutMs
	// })

	// submitP()

	//await browser.close()
// }
