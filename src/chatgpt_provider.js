const delay = require('delay')
const axios = require('axios')
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
	constructor({_verifier, _questioner, _url}){
		super(_verifier, _questioner)
		this.url = _url
	}

    authenticate = async () => {
		try {
			delay(500)
			await this.open_browser()
			let page = await this.open_url()
			await this.verifier.verify(page)
			await this.handle_login_page(page)
			this.cookies = await this.get_cookies(page)
			await this.questioner.prepare_header(this.cookies)
			// await this.browser.close()
		} catch (error) {
			// this.authenticate()
			console.log("error:", error)
		}
	}

	ask_question = async (question) => {
		console.log("question:", question)
		await this.questioner.ask_question(question)
		return "answer"
	}

	open_browser = async () => {
		this.browser = await puppeteer.launch({
			headless: false,
			devtools: false,
			args: config.arg_for_browser,
			ignoreDefaultArgs: config.ignoring_args,
			ignoreHTTPSErrors: true,
			executablePath: executablePath(),
		})	
	}

	open_url = async () => {
		const page = await this.browser.newPage()
		page.deleteCookie()
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

	handle_login_page = async(page) => {
		console.log("waiting for login button")
		await page.waitForSelector('#__next .btn-primary', { timeout: config.timeout })
		await delay(config.delay_time)
		await page.click('#__next .btn-primary')
		console.log("clicked login button")
	
		await delay(config.delay_time)
		console.log("waiting for username")
		await page.waitForSelector('#username', { timeout: config.timeout })
	
		await delay(config.delay_time)
		await page.type('#username', config.session.email)
		console.log("entered username")

		await delay(config.delay_time)
		console.log("trying to solve recaptcha")
		await this.verifier.solve_recaptcha(page)
		console.log("solved recaptcha")

		await delay(config.delay_time*20)
		page.click('button[type="submit"]')

		await delay(config.delay_time)
		await page.waitForSelector('#password', { timeout: config.timeout })
		await page.type('#password', config.session.password, { delay: 10 })
		page.click('button[type="submit"]')
	}

	get_cookies = async(page) => {
		await delay(config.delay_time*5)
		const page_cookies = await page.cookies(config.urls.login_page)
		const cookies = page_cookies.reduce(
			(map, cookie) => ({ ...map, [cookie.name]: cookie }),
			{}
		)
		console.log(cookies)

		console.log(cookies['cf_clearance'].value)
		console.log(cookies['__Secure-next-auth.session-token'].value)
		console.log(cookies)

		return cookies
	}
}

