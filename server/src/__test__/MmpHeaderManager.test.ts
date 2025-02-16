import { TextEdit } from 'vscode-languageserver';
import { ProofMode } from '../mm/ConfigurationManager';
import { MmpParser } from '../mmp/MmpParser';
import { MmpUnifier } from '../mmp/MmpUnifier';
import { WorkingVars } from '../mmp/WorkingVars';
import { impbiiMmParser, kindToPrefixMap } from './GlobalForTest.test';

test('expect default comment to be added', () => {
	const mmpSource =
		'h50: |- ps\n' +
		'a::a1i |- &W1\n' +
		'qed:: |- ch';
	const mmpParser: MmpParser = new MmpParser(mmpSource, impbiiMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0, true);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* MissingComment\n\n' +
		'h1::               |- ps\n' +
		'2::                 |- &W2\n' +
		'3:2:a1i            |- ( &W3 -> &W2 )\n' +
		'qed::              |- ch\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test('expect $theorem example to be added', () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'1: |- ps\n' +
		'2::a1i |- &W1\n' +
		'qed:: |- ch';
	const mmpParser: MmpParser = new MmpParser(mmpSource, impbiiMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0, false, "example");
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'$theorem example\n' +
		'\n* test comment\n\n' +
		'1::                |- ps\n' +
		'd1::                |- &W2\n' +
		'2:d1:a1i           |- ( &W3 -> &W2 )\n' +
		'qed::              |- ch\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});