import { Connection, Position, TextEditChange, WorkspaceChange } from 'vscode-languageserver/node';
import { MmpProofStep } from '../mmp/MmpStatements';

//TODO you are defining this interface both on the client and on the server:
//see if there's a way to define it in a single place
export interface ISearchCommandParameters {
	uri: string;
	cursorLine: number;
}

export class SearchCommandHandler {
	searchCommandParameter: ISearchCommandParameters;
	connection: Connection;
	constructor(searchCommandParameter: ISearchCommandParameters, connection: Connection) {
		this.searchCommandParameter = searchCommandParameter;
		this.connection = connection;
	}

	//#region insertSearchStatement

	//TODO1
	private getCurrentProofStep(): MmpProofStep | undefined {
		// getMmpProofStep
		return undefined;
	}

	//#region insertSearchStatementBeforeStep
	// insertSearchStatementBeforeStep(insertPosition: Position) {

	//#region positionForInsertionOfTheSearchStatement
	/** if the cursor is on a MmpProofStep, it returns the line where the step begins (it could be
	 * multine); otherwise, it returns the first line after the main comment */
	private positionForInsertionOfTheSearchStatement(currentMmpProofStep?: MmpProofStep): Position {
		let line: number = this.searchCommandParameter.cursorLine;
		if (currentMmpProofStep != undefined)
			line = currentMmpProofStep.range.start.line;
		const insertPosition: Position = { line: line, character: 0 };
		return insertPosition;
	}
	//#endregion positionForInsertionOfTheSearchStatement

	insertSearchStatementBeforeStep(currentMmpProofStep?: MmpProofStep) {
		const insertPosition: Position = this.positionForInsertionOfTheSearchStatement(currentMmpProofStep);
		const workspaceChange: WorkspaceChange = new WorkspaceChange();
		const textEditChange: TextEditChange = workspaceChange.getTextEditChange(
			this.searchCommandParameter.uri);
		textEditChange.insert(insertPosition, 'AAAAAAAAAA\n');
		this.connection.workspace.applyEdit(workspaceChange.edit);
	}
	//#endregion insertSearchStatementBeforeStep

	public insertSearchStatement() {
		const mmpProofStep: MmpProofStep | undefined = this.getCurrentProofStep();
		this.insertSearchStatementBeforeStep(mmpProofStep);
	}
	//#endregion insertSearchStatement
}
