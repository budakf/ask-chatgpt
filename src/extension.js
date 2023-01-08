
const fs = require('fs');
const os = require('os');
const path = require('path');
const uuid = require('uuid');
const vscode = require('vscode');
const config = require('./config.js');
const verifier = require('./verifier.js')
const child_process = require('child_process');
const basic_input = require('./basic_input.js');
const chatgpt_provider = require('./chatgpt_provider.js');

let is_authenticated = false

function activate(context) {
	console.log('Congratulations, your extension "ask-chatgpt" is now active!');
	create_dir(config.app_name)

	let disposable = vscode.commands.registerCommand('ask-chatgpt.ask', async () => {
		const options= {
			"login" : login,
			"ask question to chatgpt":	basic_input.show_input_box
		};

		const quickPick = vscode.window.createQuickPick();
		quickPick.items = Object.keys(options).map(label => ({label}));
		quickPick.onDidChangeSelection(selection => {
			if (selection[0]) {
				if(selection[0].label == "login") {
					options[selection[0].label]()
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

const login = async () => {
	if(!is_authenticated)
	{
		let _provider = new chatgpt_provider({
			_verifier: new verifier(),
			_url: config.urls.login_page,
			_session: config.session
		})
		await _provider.authenticate()
	}
}

const ask_question = async (question) => {
	//await _provider.ask_question(question)
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
