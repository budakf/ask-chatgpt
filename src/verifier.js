const delay = require('delay');
const config = require('./config.js');

// const verifier_state = {
//     start : 0,
//     handling_browser_out_of_date : 1,
//     handling_being_human_check,
//     handling_full_capacity,
//     handling_username,
//     handling_captcha_after_username,
//     handling_click_continue,
//     handling_password,
//     handling_click_continue_last,
//     ready_to_ask
// }

module.exports = class verifier {
    constructor(){
        this.keywords = {
            "capacity" : "//div[contains(., 'ChatGPT is at capacity')]",
            "human_button_text":"text=Verify you are human",
            "human_checkbox_text": ".hcaptcha-box",
            "browser_out_of_date": "",
            "":"",
            "after_login" : ["Next", "Next", "Done"]
            // probably, to be added more
        }
    }

    verify = async (page) => {
        try {
            await this.verify_being_human(page)
            await this.verify_capacity(page)
        } catch (error) {
            console.log(error)
        }
    }

    verify_being_human = async (page) => {
        console.log("start in verify_being_human")
        try {
            await delay(15000)
            const verif_human_button = await page.$(this.keywords["human_button_text"])
            if (verif_human_button) {
                await verif_human_button.click({
                    delay: 100
                })
            }
            await delay(1000)
            const cloudfare_checkbox = await page.$(this.keywords["human_checkbox_text"])
            if (cloudfare_checkbox) {
                await delay(1000)
                await cloudfare_checkbox.click({
                    delay: 100
                })
                await delay(1000)
            }
        } catch (err) {
            console.error(err)
        }
        console.log("stop in verify_being_human")
    }

    verify_capacity = async (page) => {
        console.log("start waiting in check_for_capacity")
        let still_wait_for_capacity = true
        do {
            console.log("waiting in check_for_capacity")
            const response = await page.$x(this.keywords["capacity"])
            still_wait_for_capacity = response.length > 0 ? true : false
            if (still_wait_for_capacity) {
                await page.reload({
                    waitUntil: 'networkidle2',
                    timeout: config.timeout
                })
            }
            await delay(config.delay_time)
        } while(still_wait_for_capacity)
        console.log("stop waiting in check_for_capacity")
    }

    solve_recaptcha = async (page) => {
        console.log("start in solve_recaptcha")
        const retries = 5
        try {
            for (let i = 0; i < retries; i++) {
                console.log("solving recaptcha")
                const res = await page.solveRecaptchas()
                if (res.solved[0]?.isSolved && res.err==None) {
                    console.log('captchas result', res)
                } else {
                    console.log('no captchas found')
                    await delay(500)
                }
            }
        } catch (err) {
                console.log(err)
        }
    }

}