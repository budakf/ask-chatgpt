
const fs = require('fs')
const os = require('os')
const path = require('path')
const uuid = require('uuid')
const vscode = require('vscode')
const config = require('./config.js')
const basic_input = require('./utils.js')
const verifier = require('./verifier.js')
const questioner = require('./questioner.js')
const child_process = require('child_process')
const chatgpt_provider = require('./chatgpt_provider.js')

let is_authenticated = false
let _provider = new chatgpt_provider({
	_verifier: new verifier(),
	_questioner: new questioner(),
	_url: config.urls.login_page
})

function activate(context) {
	console.log('Congratulations, your extension "ask-chatgpt" is now active!');
	create_dir(config.app_name)

	let disposable = vscode.commands.registerCommand('ask-chatgpt.ask', async () => {
		const options= {
			"authenticate to chatgpt": basic_input.show_login_box,
			"ask question to chatgpt": basic_input.show_question_box
		};

		const quickPick = vscode.window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({label}));
		quickPick.onDidChangeSelection( async (selection) => {
			if (selection[0]) {
				if(selection[0].label == "authenticate to chatgpt") {
					if(	config.session.email=="" && 
						config.session.password=="" ) {
						await options[selection[0].label]()
					}
					if( config.session.email != "" &&
						config.session.password != "" ) {
						await authenticate_to_chatgpt()
					}
				}
				else if(selection[0].label == "ask question to chatgpt") {
					options[selection[0].label]()
						.then((question) => { 
					question ? ask_question(question).then((answer) => {
						show_result(question, answer)
					}) :
					vscode.window.showInformationMessage("Please ask a question")
				})
				.catch(console.error);
				}
			}
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
	});

	context.subscriptions.push(disposable);
}

const authenticate_to_chatgpt = async () => {
	if(!is_authenticated) {
		await _provider.authenticate()
		is_authenticated = true
	}
	else {
		vscode.window.showInformationMessage("already authenticated")
	}
}

const ask_question = async (question) => {
	if(is_authenticated) {
		await _provider.ask_question(question)
	}
	else {
		vscode.window.showInformationMessage("first try to authenticate")
	}
}

const show_result = (question, answer) => {
	const uniqueFileName = create_unique_file()
	const result = `Question:\n${question} \n\nAnswer:\n${answer}`

	const fd = fs.openSync(uniqueFileName, "a+")
	fs.writeFileSync(fd, result, {flag:"a+"})
	fs.closeSync(fd)
	child_process.spawn("code", [uniqueFileName]);
} 

const create_unique_file = () => {
	const baseDir = os.tmpdir()
	const uniqueFileName = path.join(baseDir, config.app_name, uuid.v4())
	if (!fs.existsSync(uniqueFileName)) {
		const fd = fs.openSync(uniqueFileName, "a+")
		fs.closeSync(fd)
	}
	console.log(uniqueFileName)
	return uniqueFileName
}

const create_dir = (dirName) => {
	const baseDir = os.tmpdir()
	if (!fs.existsSync(path.join(baseDir, dirName))) {
		fs.mkdirSync(path.join(baseDir, dirName), { recursive: true });
	}
}

const delete_dir = (dirName) => {
	const baseDir = os.tmpdir()
	if (fs.existsSync(path.join(baseDir, dirName))) {
		fs.rmSync(path.join(baseDir, dirName), { recursive: true });
	}
}

function deactivate() {
	console.log("deactivate")
	// delete_dir(config.app_name)
}


module.exports = {
	activate,
	deactivate
}
