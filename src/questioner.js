const uuid = require('uuid')
const axios = require('axios')
const config = require("./config.js")

module.exports = class questioner {
    constructor() {
        this.questions = []
    }

    ask_question = async (question) => {
        // const body = {
        //     action: "next",
        //     messages: [
        //         {
        //             id: uuid.v4(),
        //             role: 'user',
        //             content: {
        //                 content_type: 'text',
        //                 parts: [question]
        //             }
        //         }
        //     ],
        //     model: 'text-davinci-002-render',
        //     parent_message_id: uuid.v4()
        // }

        const options = {
            method: 'get',
            url: config.urls.chat_page,
            // data: body,
            headers: this.header
        }

        axios(options)
        .then(response => {
            console.log("response", response)
            this.questions.concat({
                "question" : question,
                "answer"   : response
            })
        })
        .catch(err => {
            console.log("error", err)

        })
    }

    prepare_header = (cookies) => {
        this.cookies = cookies
        this.header = {
            ...config.header_info,
            cookie: `cf_clearance=${this.cookies['cf_clearance'].value}; __Secure-next-auth.session-token=${this.cookies['__Secure-next-auth.session-token'].value}`,
        }
    }

}
