const uuid = require('uuid')
const axios = require('axios')
const config = require("./config.js")

module.exports = class questioner {
    constructor() {
        this.questions = []
    }

    ask_question = async (question) => {
        await this.refresh_token()
        console.log("access_token:   ", this.access_token)
        console.log("user:   ", this.user)

        const header = {
            accept: 'text/event-stream',
            'x-openai-assistant-app-id': '',
            authorization: `Bearer ${this.access_token}`,
            'content-type': 'application/json',
            "Cookie": `cf_clearance=${this.cookies['cf_clearance'].value}`
        }

        const action="next"
        const body = {
            action,
            messages: [
                {
                    id: uuid.v4(),
                    role: 'user',
                    content: {
                        content_type: 'text',
                        parts: [question]
                    }
                }
            ],
            model: 'text-davinci-002-render',
            parent_message_id: uuid.v4()
        }

        const options = {
            method: 'post',
            url: config.urls.conversation_url,
            headers: header,
            body: JSON.stringify(body)
        }

        this.page.evaluate(
            axios(options).then(response => {
                console.log(response)
            }).catch(err => {
                console.log("error", err)
            })
        )

    }

    refresh_token = async () => {
        const header = {
            ...config.header_info,
            cookie: `cf_clearance=${this.cookies['cf_clearance'].value}; __Secure-next-auth.session-token=${this.cookies['__Secure-next-auth.session-token'].value}`,
            accept: '*/*'
        }

        const options = {
            method: 'get',
            url: config.urls.session_url,
            headers: header
        }

        const response = await axios(options).then(response => {return response}).catch(err => {
            console.log("error", err)
        })
        this.access_token = response["data"].accessToken
        this.user = response["data"].user
    }

    set_cookie = (cookies) => {
        this.cookies = cookies
    }

    set_page = (page) => {
        this.page = page
    }

}
