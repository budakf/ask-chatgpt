const vscode = require('vscode');

async function show_quick_pick(items) {
	let i = 0;
	const result = await vscode.window.showQuickPick(items, {
		placeHolder: 'select a command',
		onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
	});
	vscode.window.showInformationMessage(`Command: ${result}`);
	return result;
}

async function show_input_box() {
	const result = await vscode.window.showInputBox({
		valueSelection: [2, 4],
		placeHolder: 'please ask question ...',
	});
	if(result != ""){
		vscode.window.showInformationMessage(`Question: ${result}`)
	}
	return result;
}

module.exports = {
	show_quick_pick,
	show_input_box
}
