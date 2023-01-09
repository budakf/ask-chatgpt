const vscode = require('vscode');
const config = require('./config.js');

async function show_quick_pick(items) {
	let i = 0;
	const result = await vscode.window.showQuickPick(items, {
		placeHolder: 'select a command',
		onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
	});
	vscode.window.showInformationMessage(`Command: ${result}`);
	return result;
}

async function show_question_box() {
	const result = await vscode.window.showInputBox({
		valueSelection: [2, 4],
		placeHolder: 'please ask question ...',
	});
	if(result != ""){
		vscode.window.showInformationMessage(`Question: ${result}`)
	}
	return result;
}

async function show_login_box() {
	const email = await vscode.window.showInputBox({
		placeHolder: 'please enter email',
	});

	if(validate_email(email))
	{
		const password = await vscode.window.showInputBox({
			placeHolder: 'please enter password',
			password:true
		});
		if(password != "") {
			config.session = {
				email,
				password
			}
			vscode.window.showInformationMessage(`session informaiton saved: ${config.session}`)
		}
	}
	else {
		vscode.window.showInformationMessage(`please write valid email and password`)
	}
	return null 
}
const validate_email = (email) => {
	return String(email)
	  .toLowerCase()
	  .match(
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	  );
};

module.exports = {
	show_login_box,
	show_quick_pick,
	show_question_box
}
