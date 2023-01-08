module.exports = class provider {
    constructor(_verifier){
        this.verifier = _verifier
    }
    authenticate = async () => {}
    ask_question = async (question) => {}
}