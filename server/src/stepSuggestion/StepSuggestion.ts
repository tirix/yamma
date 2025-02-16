import { Command, CompletionItem, CompletionItemKind, InsertReplaceEdit, Range } from 'vscode-languageserver';
import { Parameters } from '../general/Parameters';
import { InternalNode } from '../grammar/ParseNode';
import { CursorContext } from "../mmp/CursorContext";
import { MmParser } from '../mm/MmParser';
import { LabeledStatement } from "../mm/LabeledStatement";
import { AssertionStatement } from "../mm/AssertionStatement";
import { range } from '../mm/Utils';
import { MmpProofStep } from "../mmp/MmpProofStep";
import { SubstitutionResult, MmpSubstitutionBuilder } from '../mmp/MmpSubstitutionBuilder';
import { IStepSuggestion } from './ModelBuilder';
import { GrammarManager } from '../grammar/GrammarManager';
import { IFormulaClassifier } from './IFormulaClassifier';
import { StepSuggestionMap } from './StepSuggestionMap';


export class StepSuggestion {
	cursorContext: CursorContext;
	// stepSuggestionMap: Map<string, IStepSuggestion[]>;
	stepSuggestionMap: StepSuggestionMap;
	formulaClassifiers: IFormulaClassifier[];
	mmpProofStep: MmpProofStep;
	mmParser: MmParser;
	private command: Command = Command.create('Completion item selected', 'yamma.completionitemselected');

	private completionItemKindOrder: Map<CompletionItemKind, string>;
	//TODO this is a parameter: you mught want to move it to the Paramter class
	private completionItemKindForPartialLabel: CompletionItemKind;
	constructor(cursorContext: CursorContext, stepSuggestionMap: StepSuggestionMap,
		formulaClassifiers: IFormulaClassifier[], mmpProofStep: MmpProofStep, mmParser: MmParser) {
		this.cursorContext = cursorContext;
		this.stepSuggestionMap = stepSuggestionMap;
		this.formulaClassifiers = formulaClassifiers;
		this.mmpProofStep = mmpProofStep;
		this.mmParser = mmParser;

		this.completionItemKindOrder = new Map<CompletionItemKind, string>();
		this.completionItemKindForPartialLabel = CompletionItemKind.Text;
		this.initializeCompletionItemKindOrder();
	}

	private initializeCompletionItemKindOrder(): void {
		this.completionItemKindOrder.set(CompletionItemKind.Event, '0');
		this.completionItemKindOrder.set(CompletionItemKind.Interface, '1');
		// completion items from partial label should be displayed after
		// completion items from models
		this.completionItemKindOrder.set(this.completionItemKindForPartialLabel, '9');

	}

	//#region completionItems

	classifyProofStepFormula(formulaClassifier: IFormulaClassifier): string | undefined {
		let rpnSyntaxTree: string | undefined;
		const mmpProofStep: MmpProofStep = <MmpProofStep>this.cursorContext.mmpStatement!;
		const parseNode: InternalNode | undefined = mmpProofStep.parseNode;
		if (parseNode != undefined) {
			// const rpnSyntaxTreeBuilder: RpnSyntaxTreeBuilder = new RpnSyntaxTreeBuilder();
			// rpnSyntaxTreeBuilder.setMmParser(this.mmParser);
			// rpnSyntaxTree = syntaxTreeClassifierFull.buildRpnSyntaxTreeFromParseNode(parseNode, this.mmParser, 0, 3);
			rpnSyntaxTree = formulaClassifier.classify(parseNode, this.mmParser);
		}
		return rpnSyntaxTree;
	}

	//#region isUnifiable

	isUnifiable(stepSuggestionLabel: string) {
		let hasBeenFoundSubstitution = false;
		// const assertionStatement: LabeledStatement | undefined = this.mmParser.labelToStatementMap.get(stepSuggestion.label);
		const assertionStatement: LabeledStatement | undefined = this.mmParser.labelToStatementMap.get(stepSuggestionLabel);
		if (assertionStatement instanceof AssertionStatement && !GrammarManager.isSyntaxAxiom2(assertionStatement)) {
			const uSubstitutionBuilder: MmpSubstitutionBuilder = new MmpSubstitutionBuilder(
				this.mmpProofStep, assertionStatement, this.mmParser.outermostBlock,
				this.mmParser.workingVars, this.mmParser.grammar, []);
			const substitutionResult: SubstitutionResult =
				uSubstitutionBuilder.buildSubstitutionForExistingParseNodes();
			hasBeenFoundSubstitution = substitutionResult.hasBeenFound;
		} else
			// console.log(`label ${stepSuggestionLabel.label} is not a label for an assertion, this is not expected. ` +
			// 	`May be that assertion was removed from the theory, after the model was built.`);
			console.log(`label ${stepSuggestionLabel} is not a label for an assertion, this is not expected. ` +
				`May be that assertion was removed from the theory, after the model was built.`);
		return hasBeenFoundSubstitution;
	}
	//#region isUnifiable


	//#region getCompletionItemsFromModels

	//#region completionItemsFromClassifier

	//#region getCompletionItemsFromStepSuggestions

	//#region getUnifiableStepSuggestions


	private getUnifiableStepSuggestions(stepSuggestions: IStepSuggestion[]): IStepSuggestion[] {
		const unifiableStepSuggestions: IStepSuggestion[] = [];
		stepSuggestions.forEach((stepSuggestion: IStepSuggestion) => {
			// if (this.isUnifiable(stepSuggestion))
			if (this.isUnifiable(stepSuggestion.label))
				unifiableStepSuggestions.push(stepSuggestion);
		});
		return unifiableStepSuggestions;
	}
	//#endregion getUnifiableStepSuggestions

	//#region addCompletionItem
	private insertReplaceEdit(stepSuggestionLabel: string): InsertReplaceEdit | undefined {
		let insertReplaceEdit: InsertReplaceEdit | undefined;
		if (this.mmpProofStep != undefined && this.mmpProofStep.label != undefined) {
			const insertRange: Range = this.mmpProofStep!.label!.range;
			const replaceRange: Range = range(stepSuggestionLabel, insertRange.start.line, insertRange.start.character);
			insertReplaceEdit = {
				insert: insertRange,
				replace: replaceRange,
				newText: stepSuggestionLabel
			};
		}
		return insertReplaceEdit;
	}
	sortText(completionItemKind: CompletionItemKind, index: number): string {
		const completionItemKindOrder: string = this.completionItemKindOrder.get(completionItemKind)!;
		const result: string = completionItemKindOrder + String(index).padStart(3, '0');
		return result;
	}



	private addCompletionItemFromModel(stepSuggestion: IStepSuggestion, index: number, totalMultiplicity: number,
		completionItems: CompletionItem[]) {
		const relativeMultiplicity: number = stepSuggestion.multiplicity / totalMultiplicity;
		const detail = `${relativeMultiplicity.toFixed(2)} relative weight   -    ${stepSuggestion.multiplicity}  total`;
		const insertReplaceEdit: InsertReplaceEdit | undefined = this.insertReplaceEdit(stepSuggestion.label);
		const completionItem: CompletionItem = {
			label: stepSuggestion.label,
			command: this.command,
			detail: detail,
			//TODO see if LSP supports a way to disable client side sorting
			// sortText: String(index).padStart(3, '0'),
			sortText: this.sortText(stepSuggestion.completionItemKind, index),
			textEdit: insertReplaceEdit,
			kind: stepSuggestion.completionItemKind
			// data: symbol
		};
		completionItems.push(completionItem);
	}
	//#endregion addCompletionItem
	private getCompletionItemsFromStepSuggestions(stepSuggestions: IStepSuggestion[]): CompletionItem[] {
		const completionItems: CompletionItem[] = [];
		const unifiableStepSuggestions: IStepSuggestion[] = this.getUnifiableStepSuggestions(stepSuggestions);
		const totalMultiplicity: number =
			unifiableStepSuggestions.reduce((sum: number, current: IStepSuggestion) => sum + current.multiplicity, 0);
		unifiableStepSuggestions.forEach((stepSuggestion: IStepSuggestion, i: number) => {
			this.addCompletionItemFromModel(stepSuggestion, i, totalMultiplicity, completionItems);
		});
		return completionItems;
	}
	//#endregion getCompletionItemsFromStepSuggestions
	completionItemsFromClassifier(formulaClassifier: IFormulaClassifier): CompletionItem[] {
		let completionItemsFromClassifier: CompletionItem[] = [];
		const formulaClusterId: string | undefined = this.classifyProofStepFormula(formulaClassifier);
		if (formulaClusterId != undefined) {
			// the cursor is on a proof step that has a valid parse node
			const stepSuggestions: IStepSuggestion[] | undefined =
				this.stepSuggestionMap.getStepSuggestions(formulaClassifier.id, formulaClusterId);
			if (stepSuggestions != undefined)
				// the model does not have step suggestions, for this classifier and this parse node
				completionItemsFromClassifier = this.getCompletionItemsFromStepSuggestions(stepSuggestions);
		}
		return completionItemsFromClassifier;
	}
	//#endregion completionItemsFromClassifier

	private getCompletionItemsFromModels(): CompletionItem[] {
		//TODO this is an example to add a snippet, you will use it later
		// const testSnippet: CompletionItem = {
		// 	label: "func",
		// 	kind: CompletionItemKind.Snippet,
		// 	insertText: [
		// 		"function ${1:Name}(${2}) ${3:abort}",
		// 		"\t${0}",
		// 		"endfunction",
		// 	].join("\n"),
		// 	insertTextFormat: InsertTextFormat.Snippet,
		// };
		// const completionItemsFromModels: CompletionItem[] = [testSnippet];

		const completionItemsFromModels: CompletionItem[] = [];
		this.formulaClassifiers.forEach((formulaClassifier: IFormulaClassifier) => {
			const completionItemsFromClassifier: CompletionItem[] =
				this.completionItemsFromClassifier(formulaClassifier);
			completionItemsFromModels.push(...completionItemsFromClassifier);

		});
		return completionItemsFromModels;
	}
	//#endregion getCompletionItemsFromModels

	//#region addCompletionItemsFromPartialLabel
	public static buildRegExp(partialLabel: string): RegExp {
		const c0: string = partialLabel[0];
		let strReg = `.*${c0}.*`;
		if (partialLabel.length > 1)
			strReg += `${partialLabel[1]}.*`;
		if (partialLabel.length > 2)
			strReg += `${partialLabel[2]}.*`;
		// const c1: string = partialLabel[1];
		// const c2: string = partialLabel[2];
		// const regExp = new RegExp(`.*${c0}.*${c1}.*${c2}.*`);

		const regExp = new RegExp(strReg);

		return regExp;
	}
	createAndAddItemFromPartialLabel(label: string, i: number, completionItems: CompletionItem[]) {
		const insertReplaceEdit: InsertReplaceEdit | undefined = this.insertReplaceEdit(label);
		const completionItem: CompletionItem = {
			label: label,
			command: this.command,
			sortText: this.sortText(this.completionItemKindForPartialLabel, i),
			textEdit: insertReplaceEdit,
			kind: this.completionItemKindForPartialLabel
		};
		completionItems.push(completionItem);
	}
	private addCompletionItemsFromPartialLabelActually(partialLabel: string, completionItems: CompletionItem[]) {
		const regExp: RegExp = StepSuggestion.buildRegExp(partialLabel);
		let i = 0;
		this.mmParser.labelToNonSyntaxAssertionMap.forEach((_assertion: AssertionStatement, label: string) => {
			if (regExp.test(label) && (this.mmpProofStep.formula == undefined || this.isUnifiable(label))) {
				// the current assertion's label contains the partial label input by the user
				// and either the proof step has no formula, or the current assertion is unifiable with
				// the current mmp statement
				this.createAndAddItemFromPartialLabel(label, i++, completionItems);
			}
		});
	}
	/** when the user inputs some characters, then this method adds more CompletionItem(s), using
	 * a general algorithm that does not depend on a trained model: all 'matching' assertions
	 * are returned
	 */
	private addCompletionItemsFromPartialLabel(completionItems: CompletionItem[]) {
		if (this.mmpProofStep != undefined && this.mmpProofStep.label != undefined &&
			this.mmpProofStep.label.value.length >= Parameters.numberOfCharsTriggeringCompletionItemsFromPartialLabel)
			this.addCompletionItemsFromPartialLabelActually(this.mmpProofStep.label.value, completionItems);
	}
	//#endregion addCompletionItemsFromPartialLabel

	completionItems(): CompletionItem[] {
		const completionItems = this.getCompletionItemsFromModels();
		this.addCompletionItemsFromPartialLabel(completionItems);

		return completionItems;
	}
	//#endregion completionItems

}