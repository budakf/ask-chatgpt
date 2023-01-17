module.exports = class provider {
    constructor(_verifier, _questioner){
        this.verifier = _verifier
        this.questioner = _questioner
    }
    authenticate = async () => {}
    ask_question = async (question) => {}
}