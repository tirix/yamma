import { TextEdit } from 'vscode-languageserver';
import { BlockStatement } from '../mm/BlockStatement';
import { ProofMode } from '../mm/ConfigurationManager';
import { MmParser } from '../mm/MmParser';
import { MmpUnifier } from '../mmp/MmpUnifier';
import { UCompressedProofStatement } from '../mmp/proofCompression/UCompressedProofStatement';
import { MmpProof } from '../mmp/MmpProof';
import { WorkingVars } from '../mmp/WorkingVars';
import { theoryToTestDjVarViolation } from './DisjointVarsManager.test';
import { eqeq1iMmParser, impbiiMmParser, kindToPrefixMap, mp2Theory, opelcnMmParser, vexTheoryMmParser } from './GlobalForTest.test';
import { ProofStepFirstTokenInfo } from '../mmp/MmpStatements';
import { MmpProofStep } from "../mmp/MmpProofStep";
import { MmToken } from '../grammar/MmLexer';
import { MmpParser } from '../mmp/MmpParser';
import { InternalNode } from '../grammar/ParseNode';
import { UProofStatementStep } from '../mmp/MmpStatement';
import { UProofStatement } from '../mmp/UProofStatement';
import { CreateLabelMapArgs, ILabelMapCreatorForCompressedProof, IMmpCompressedProofCreator, MmpCompressedProofCreatorFromPackedProof } from '../mmp/proofCompression/MmpCompressedProofCreator';
import { MmpHardcodedLabelSequenceCreator } from '../mmp/proofCompression/MmpHardcodedLabelMapCreator';
import { MmpSortedByReferenceLabelMapCreator } from '../mmp/proofCompression/MmpSortedByReferenceLabelMapCreator';
import { MmpPackedProofStatement } from '../mmp/proofCompression/MmpPackedProofStatement';


// const mmFilePath = __dirname.concat("/../mmTestFiles/vex.mm");
// const vexTheory: string = fs.readFileSync(mmFilePath, 'utf-8');
//TODO
// export const vexTheoryParser: MmParser = createMmParser('vex.mm');


test("Build proof for mp2", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		"h50::mp2.1 |- ph\n" +
		"h51::mp2.2 |- ps\n" +
		"h52::mp2.3 |- ( ph -> ( ps -> ch ) )\n" +
		"53:50,52:ax-mp |- ( ps -> ch )\n" +
		"qed:51,53:ax-mp |- ch";
	const parser: MmParser = new MmParser();
	parser.ParseText(mp2Theory);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"h50::mp2.1           |- ph\n" +
		"h51::mp2.2          |- ps\n" +
		"h52::mp2.3           |- ( ph -> ( ps -> ch ) )\n" +
		"53:50,52:ax-mp      |- ( ps -> ch )\n" +
		"qed:51,53:ax-mp    |- ch\n" +
		"\n" +
		"$=    wps wch mp2.2 wph wps wch wi mp2.1 mp2.3 ax-mp ax-mp $.\n\n";
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Remove existing proof and recreate it", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		"h50::mp2.1 |- ph\n" +
		"h51::mp2.2 |- ps\n" +
		"h52::mp2.3 |- ( ph -> ( ps -> ch ) )\n" +
		"53:50,52:ax-mp |- ( ps -> ch )\n" +
		"qed:51,53:ax-mp |- ch\n" +
		"\n" +
		"$=    wps wch mp2.2 wph wps wch wi mp2.1 mp2.3 ax-mp ax-mp $.\n";
	const parser: MmParser = new MmParser();
	parser.ParseText(mp2Theory);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"h50::mp2.1           |- ph\n" +
		"h51::mp2.2          |- ps\n" +
		"h52::mp2.3           |- ( ph -> ( ps -> ch ) )\n" +
		"53:50,52:ax-mp      |- ( ps -> ch )\n" +
		"qed:51,53:ax-mp    |- ch\n" +
		"\n" +
		"$=    wps wch mp2.2 wph wps wch wi mp2.1 mp2.3 ax-mp ax-mp $.\n\n";
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

class TestUCompressedProofStatement extends UCompressedProofStatement {
	constructor() {
		const dummyUProof = new MmpProof(new BlockStatement(), new WorkingVars(kindToPrefixMap));
		// const dummyUProofStep: UProofStep = new UProofStep(dummyUProof, true, true, "", []);
		// jest.spyOn(UProofStep.prototype, 'proofArray').mockImplementation(() => []);
		// dummyUProof.lastUProofStep = dummyUProofStep;
		const refToken: MmToken = new MmToken('dummy', 0, 0);
		const proofStepFirstTokenInfo: ProofStepFirstTokenInfo = new ProofStepFirstTokenInfo(
			new MmToken('dummy::', 0, 0), false, refToken);
		const dummyMmpProofStep: MmpProofStep = new MmpProofStep(dummyUProof,
			proofStepFirstTokenInfo, true, true, refToken, []);
		jest.spyOn(MmpProofStep.prototype, 'proofArray').mockImplementation(() => []);
		dummyUProof.lastMmpProofStep = dummyMmpProofStep;
		super(dummyUProof, 0, 80);
	}

	public upperCaseLettersFromNumber(givenNumber: number) {
		return super.upperCaseLettersFromNumber(givenNumber);
	}

	public base5base20representation(givenNumber: number): number[] {
		return super.base5base20representation(givenNumber);
	}
}

test("upperCaseLettersFromNumber", () => {

	const uCompressedProofStatement: TestUCompressedProofStatement = new TestUCompressedProofStatement();

	expect(uCompressedProofStatement.base5base20representation(22)).toEqual([1, 2]);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(1)).toEqual(['A']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(2)).toEqual(['B']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(20)).toEqual(['T']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(21)).toEqual(['U', 'A']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(22)).toEqual(['U', 'B']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(40)).toEqual(['U', 'T']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(41)).toEqual(['V', 'A']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(42)).toEqual(['V', 'B']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(120)).toEqual(['Y', 'T']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(121)).toEqual(['U', 'U', 'A']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(620)).toEqual(['Y', 'Y', 'T']);
	expect(uCompressedProofStatement.upperCaseLettersFromNumber(621)).toEqual(['U', 'U', 'U', 'A']);
	jest.restoreAllMocks();
});

test("Build Compressed proof for mp2", () => {
	//in mmj2
	//$=    wps wch mp2.2 wph wps wch wi mp2.1 mp2.3 ax-mp ax-mp $.
	//in metamath.exe :   show proof mp2 /normal
	//      wps wch mp2.2 wph wps wch wi mp2.1 mp2.3 ax-mp ax-mp $.
	//in metamath.exe :   show proof mp2 /compressed
	//      ( wi ax-mp ) BCEABCGDFHH $.

	//h50::mp2.1         |- ph
	//h51::mp2.2         |- ps
	//h52::mp2.3         |- ( ph -> ( ps -> ch ) )
	// 53:50,52:ax-mp     |- ( ps -> ch )
	// qed:51,53:ax-mp    |- ch

	const mmpSource =
		'\n* test comment\n\n' +
		"h50::mp2.1 |- ph\n" +
		"h51::mp2.2 |- ps\n" +
		"h52::mp2.3 |- ( ph -> ( ps -> ch ) )\n" +
		"53:50,52:ax-mp |- ( ps -> ch )\n" +
		"qed:51,53:ax-mp |- ch";
	const parser: MmParser = new MmParser();
	parser.ParseText(mp2Theory);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.compressed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"h50::mp2.1           |- ph\n" +
		"h51::mp2.2          |- ps\n" +
		"h52::mp2.3           |- ( ph -> ( ps -> ch ) )\n" +
		"53:50,52:ax-mp      |- ( ps -> ch )\n" +
		"qed:51,53:ax-mp    |- ch\n" +
		'\n' +
		"$= ( wi ax-mp ) BCEABCGDFHH $.\n" +
		'\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

const idTheory = "$c ( $. $c ) $. $c -> $. $c wff $. $c |- $.\n" +
	"$v ph $. $v ps $. $v ch $.\n" +
	"wph $f wff ph $. wps $f wff ps $. wch $f wff ch $.\n" +
	"wi $a wff ( ph -> ps ) $.\n" +
	"${ min $e |- ph $. maj $e |- ( ph -> ps ) $. ax-mp $a |- ps $. $}\n" +
	"ax-1 $a |- ( ph -> ( ps -> ph ) ) $.\n" +
	"ax-2 $a |- ( ( ph -> ( ps -> ch ) ) -> ( ( ph -> ps ) -> ( ph -> ch ) ) ) $.\n" +
	"${ a2i.1 $e |- ( ph -> ( ps -> ch ) ) $. a2i $p |- ( ( ph -> ps ) -> ( ph -> ch ) ) $=\n" +
	"( wi ax-2 ax-mp ) ABCEEABEACEEDABCFG $. $}\n" +
	"${ mpd.1 $e |- ( ph -> ps ) $. mpd.2 $e |- ( ph -> ( ps -> ch ) ) $.\n" +
	"mpd $p |- ( ph -> ch ) $= ( wi a2i ax-mp ) ABFACFDABCEGH $. $}\n" +
	"id $p |- ( ph -> ph ) $= ( wi ax-1 mpd ) AAABZAAACAECD $.";

test("id - Build Compressed proof for id", () => {
	//in mmj2
	//$=  ( wi ax-1 mpd ) AAABZAAACAECD $.
	//in metamath.exe :   show proof id /normal
	//      wph wph wph wi wph wph wph ax-1 wph wph wph wi ax-1 mpd $.
	//in metamath.exe :   show proof id /compressed
	//      ( wi ax-1 mpd ) AAABZAAACAECD $.

	// 50::ax-1           |- ( ph -> ( ph -> ph ) )
	// 51::ax-1           |- ( ph -> ( ( ph -> ph ) -> ph ) )
	// qed:50,51:mpd      |- ( ph -> ph )

	const mmpSource =
		'\n* test comment\n\n' +
		"50::ax-1 |- ( ph -> ( ph -> ph ) )\n" +
		"51::ax-1 |- ( ph -> ( ( ph -> ph ) -> ph ) )\n" +
		"qed:50,51:mpd |- ( ph -> ph )";
	const parser: MmParser = new MmParser();
	parser.ParseText(idTheory);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.compressed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"50::ax-1            |- ( ph -> ( ph -> ph ) )\n" +
		"51::ax-1            |- ( ph -> ( ( ph -> ph ) -> ph ) )\n" +
		"qed:50,51:mpd      |- ( ph -> ph )\n" +
		'\n' +
		"$= ( wi ax-1 mpd ) AAABZAAACAECD $.\n" +
		'\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("alnex - Build normal proof for alnex", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		"50::df-ex |- ( E. x ph <-> -. A. x -. ph )\n" +
		"qed:50:con2bii |- ( A. x -. ph <-> -. E. x ph )";
	const mmpParser: MmpParser = new MmpParser(mmpSource, vexTheoryMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"50::df-ex           |- ( E. x ph <-> -. A. x -. ph )\n" +
		"qed:50:con2bii     |- ( A. x -. ph <-> -. E. x ph )\n" +
		"\n" +
		"$=    wph vx wex wph wn vx wal wph vx df-ex con2bii $.\n\n";
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("vex - Build normal proof for vex", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		"50::equid |- x = x\n" +
		"51::df-v |- _V = { x | x = x }\n" +
		"52:51:abeq2i |- ( x e. _V <-> x = x )\n" +
		"qed:50,52:mpbir |- x e. _V";
	const mmpParser: MmpParser = new MmpParser(mmpSource, vexTheoryMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"50::equid           |- x = x\n" +
		"51::df-v             |- _V = { x | x = x }\n" +
		"52:51:abeq2i        |- ( x e. _V <-> x = x )\n" +
		"qed:50,52:mpbir    |- x e. _V\n" +
		"\n" +
		'$=    vx cv cvv wcel vx cv vx cv wceq vx equid vx cv vx cv wceq vx cvv vx df-v\n' +
		'      abeq2i mpbir $.\n\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("vex - Build Compressed proof for vex", () => {
	//in mmj2
	//$=  ( cv cvv wcel wceq equid df-v abeq2i mpbir ) ABZCDJJEZAFKACAGHI $.
	//in metamath.exe :   show proof id /normal
	//      wph wph wph wi wph wph wph ax-1 wph wph wph wi ax-1 mpd $.
	//in metamath.exe :   show proof id /compressed
	//      ( wi ax-1 mpd ) AAABZAAACAECD $.

	// const mmFilePath = __dirname.concat("/../mmTestFiles/vex.mm");
	// const vexTheory: string = fs.readFileSync(mmFilePath, 'utf-8');
	// const vexTheoryParser: MmParser = new MmParser();
	// vexTheoryParser.ParseText(vexTheory);

	const mmpSource =
		'\n* test comment\n\n' +
		"50::equid |- x = x\n" +
		"51::df-v |- _V = { x | x = x }\n" +
		"52:51:abeq2i |- ( x e. _V <-> x = x )\n" +
		"qed:50,52:mpbir |- x e. _V";
	const mmpParser: MmpParser = new MmpParser(mmpSource, vexTheoryMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.compressed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"50::equid           |- x = x\n" +
		"51::df-v             |- _V = { x | x = x }\n" +
		"52:51:abeq2i        |- ( x e. _V <-> x = x )\n" +
		"qed:50,52:mpbir    |- x e. _V\n" +
		'\n' +
		"$= ( cv cvv wcel wceq equid df-v abeq2i mpbir ) ABZCDJJEZAFKACAGHI $.\n" +
		'\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Build normal proof for use of ax-5", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		"qed::ax-5 |- ( x e. A -> A. y x e. A )\n" +
		"$d x y\n" +
		"$d A y\n";
	const parser: MmParser = new MmParser();
	parser.ParseText(theoryToTestDjVarViolation);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"qed::ax-5          |- ( x e. A -> A. y x e. A )\n" +
		"\n" +
		"$=    vx cv cA wcel vy ax-5 $.\n\n" +
		"$d x y\n" +
		"$d A y\n";
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Expect proof not to be produced for Disj Var Violation", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'qed::ax-5 |- ( y e. A -> A. y y e. A )\n';
	const parser: MmParser = new MmParser();
	parser.ParseText(theoryToTestDjVarViolation);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	// const mmpUnifier: MmpUnifier = new MmpUnifier(parser.labelToStatementMap, parser.outermostBlock,
	// 	parser.grammar, new WorkingVars(kindToPrefixMap), ProofMode.normal);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	// const newTextExpected =
	// "qed::ax-5 |- ( x e. A -> A. x x e. A )\n";
	const textEdit: TextEdit = textEditArray[0];
	const expectedText =
		'\n* test comment\n\n' +
		'qed::ax-5          |- ( y e. A -> A. y y e. A )\n';
	expect(textEdit.newText).toEqual(expectedText);
});

test("Expect 2 proof not to be produced for missing Disj Var statement", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		"qed::ax-5 |- ( x e. A -> A. y x e. A )\n";
	const parser: MmParser = new MmParser();
	parser.ParseText(theoryToTestDjVarViolation);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.compressed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const textEdit: TextEdit = textEditArray[0];
	const expectedText =
		'\n* test comment\n\n' +
		"qed::ax-5          |- ( x e. A -> A. y x e. A )\n";
	expect(textEdit.newText).toEqual(expectedText);
});

test("Build compressed proof for use of ax-5", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		"qed::ax-5 |- ( x e. A -> A. y x e. A )\n" +
		"$d x y\n" +
		"$d A y\n";
	const parser: MmParser = new MmParser();
	parser.ParseText(theoryToTestDjVarViolation);
	const mmpParser: MmpParser = new MmpParser(mmpSource, parser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.compressed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		"qed::ax-5          |- ( x e. A -> A. y x e. A )\n" +
		'\n' +
		"$= ( cv wcel ax-5 ) ADCEBF $.\n" +
		'\n' +
		"$d x y\n" +
		"$d A y\n";
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Format equvinv compressed proof", () => {
	const mmpSource =
		'$theorem equvinv\n' +
		'\n* test comment\n\n' +
		'50::ax6ev            |- E. z z = x\n' +
		'51::equtrr             |- ( x = y -> ( z = x -> z = y ) )\n' +
		'52:51:ancld           |- ( x = y -> ( z = x -> ( z = x /\\ z = y ) ) )\n' +
		'53:52:eximdv         |- ( x = y -> ( E. z z = x -> E. z ( z = x /\\ z = y ) ) )\n' +
		'54:50,53:mpi        |- ( x = y -> E. z ( z = x /\\ z = y ) )\n' +
		'55::ax7               |- ( z = x -> ( z = y -> x = y ) )\n' +
		'56:55:imp            |- ( ( z = x /\\ z = y ) -> x = y )\n' +
		'57:56:exlimiv       |- ( E. z ( z = x /\\ z = y ) -> x = y )\n' +
		'qed:54,57:impbii   |- ( x = y <-> E. z ( z = x /\\ z = y ) )\n' +
		'$d x z\n' +
		'$d y z\n';
	const mmpParser: MmpParser = new MmpParser(mmpSource, vexTheoryMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.compressed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'$theorem equvinv\n' +
		'\n* test comment\n\n' +
		'50::ax6ev            |- E. z z = x\n' +
		'51::equtrr             |- ( x = y -> ( z = x -> z = y ) )\n' +
		'52:51:ancld           |- ( x = y -> ( z = x -> ( z = x /\\ z = y ) ) )\n' +
		'53:52:eximdv         |- ( x = y -> ( E. z z = x -> E. z ( z = x /\\ z = y ) ) )\n' +
		'54:50,53:mpi        |- ( x = y -> E. z ( z = x /\\ z = y ) )\n' +
		'55::ax7               |- ( z = x -> ( z = y -> x = y ) )\n' +
		'56:55:imp            |- ( ( z = x /\\ z = y ) -> x = y )\n' +
		'57:56:exlimiv       |- ( E. z ( z = x /\\ z = y ) -> x = y )\n' +
		'qed:54,57:impbii   |- ( x = y <-> E. z ( z = x /\\ z = y ) )\n' +
		'\n' +
		'$= ( cv wceq wa wex ax6ev equtrr ancld eximdv mpi ax7 imp exlimiv impbii ) ADZB\n' +
		'   DZEZCDZQEZTREZFZCGZSUACGUDCAHSUAUCCSUAUBABCIJKLUCSCUAUBSCABMNOP $.\n' +
		'\n' +
		'$d x z\n' +
		'$d y z\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);

	const mmpParser2: MmpParser = new MmpParser(mmpSource, vexTheoryMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser2.parse();

	const mmpUnifier2 = new MmpUnifier(mmpParser2, ProofMode.compressed, 0, false, undefined,
		undefined, 30);
	mmpUnifier2.unify();

	const newTextExpected2 =
		'$theorem equvinv\n' +
		'\n* test comment\n\n' +
		'50::ax6ev            |- E. z z = x\n' +
		'51::equtrr             |- ( x = y -> ( z = x -> z = y ) )\n' +
		'52:51:ancld           |- ( x = y -> ( z = x -> ( z = x /\\ z = y ) ) )\n' +
		'53:52:eximdv         |- ( x = y -> ( E. z z = x -> E. z ( z = x /\\ z = y ) ) )\n' +
		'54:50,53:mpi        |- ( x = y -> E. z ( z = x /\\ z = y ) )\n' +
		'55::ax7               |- ( z = x -> ( z = y -> x = y ) )\n' +
		'56:55:imp            |- ( ( z = x /\\ z = y ) -> x = y )\n' +
		'57:56:exlimiv       |- ( E. z ( z = x /\\ z = y ) -> x = y )\n' +
		'qed:54,57:impbii   |- ( x = y <-> E. z ( z = x /\\ z = y ) )\n' +
		'\n' +
		'$= ( cv wceq wa wex ax6ev\n' +
		'   equtrr ancld eximdv mpi ax7\n' +
		'   imp exlimiv impbii ) ADZBDZ\n' +
		'   EZCDZQEZTREZFZCGZSUACGUDCAH\n' +
		'   SUAUCCSUAUBABCIJKLUCSCUAUBS\n' +
		'   CABMNOP $.\n' +
		'\n' +
		'$d x z\n' +
		'$d y z\n';
	expect(mmpUnifier2.textEditArray[0].newText).toEqual(newTextExpected2);

	// Parameters.defaultRightMarginForCompressedProofs = defaultRightMargin;

});

test("Format equvinv uncompressed proof", () => {
	const mmpSource =
		'$theorem equvinv\n' +
		'\n* test comment\n\n' +
		'50::ax6ev            |- E. z z = x\n' +
		'51::equtrr             |- ( x = y -> ( z = x -> z = y ) )\n' +
		'52:51:ancld           |- ( x = y -> ( z = x -> ( z = x /\\ z = y ) ) )\n' +
		'53:52:eximdv         |- ( x = y -> ( E. z z = x -> E. z ( z = x /\\ z = y ) ) )\n' +
		'54:50,53:mpi        |- ( x = y -> E. z ( z = x /\\ z = y ) )\n' +
		'55::ax7               |- ( z = x -> ( z = y -> x = y ) )\n' +
		'56:55:imp            |- ( ( z = x /\\ z = y ) -> x = y )\n' +
		'57:56:exlimiv       |- ( E. z ( z = x /\\ z = y ) -> x = y )\n' +
		'qed:54,57:impbii   |- ( x = y <-> E. z ( z = x /\\ z = y ) )\n' +
		'$d x z\n' +
		'$d y z\n';
	const mmpParser: MmpParser = new MmpParser(mmpSource, vexTheoryMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'$theorem equvinv\n' +
		'\n* test comment\n\n' +
		'50::ax6ev            |- E. z z = x\n' +
		'51::equtrr             |- ( x = y -> ( z = x -> z = y ) )\n' +
		'52:51:ancld           |- ( x = y -> ( z = x -> ( z = x /\\ z = y ) ) )\n' +
		'53:52:eximdv         |- ( x = y -> ( E. z z = x -> E. z ( z = x /\\ z = y ) ) )\n' +
		'54:50,53:mpi        |- ( x = y -> E. z ( z = x /\\ z = y ) )\n' +
		'55::ax7               |- ( z = x -> ( z = y -> x = y ) )\n' +
		'56:55:imp            |- ( ( z = x /\\ z = y ) -> x = y )\n' +
		'57:56:exlimiv       |- ( E. z ( z = x /\\ z = y ) -> x = y )\n' +
		'qed:54,57:impbii   |- ( x = y <-> E. z ( z = x /\\ z = y ) )\n' +
		'\n' +
		//character per line = 79
		'$=    vx cv vy cv wceq vz cv vx cv wceq vz cv vy cv wceq wa vz wex vx cv vy cv\n' +
		'      wceq vz cv vx cv wceq vz wex vz cv vx cv wceq vz cv vy cv wceq wa vz wex\n' +
		'      vz vx ax6ev vx cv vy cv wceq vz cv vx cv wceq vz cv vx cv wceq vz cv vy\n' +
		'      cv wceq wa vz vx cv vy cv wceq vz cv vx cv wceq vz cv vy cv wceq vx vy vz\n' +
		'      equtrr ancld eximdv mpi vz cv vx cv wceq vz cv vy cv wceq wa vx cv vy cv\n' +
		'      wceq vz vz cv vx cv wceq vz cv vy cv wceq vx cv vy cv wceq vz vx vy ax7\n' +
		'      imp exlimiv impbii $.\n' +
		'\n' +
		'$d x z\n' +
		'$d y z\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);

	// const defaultRightMargin: number = Parameters.defaultRightMarginForNormalProofs;
	// Parameters.defaultRightMarginForNormalProofs = 30;


	const mmpParser2: MmpParser = new MmpParser(mmpSource, vexTheoryMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser2.parse();

	const mmpUnifier2 = new MmpUnifier(mmpParser2, ProofMode.normal, 0, undefined, undefined, undefined, 29);
	mmpUnifier2.unify();

	const newTextExpected2 =
		'$theorem equvinv\n' +
		'\n* test comment\n\n' +
		'50::ax6ev            |- E. z z = x\n' +
		'51::equtrr             |- ( x = y -> ( z = x -> z = y ) )\n' +
		'52:51:ancld           |- ( x = y -> ( z = x -> ( z = x /\\ z = y ) ) )\n' +
		'53:52:eximdv         |- ( x = y -> ( E. z z = x -> E. z ( z = x /\\ z = y ) ) )\n' +
		'54:50,53:mpi        |- ( x = y -> E. z ( z = x /\\ z = y ) )\n' +
		'55::ax7               |- ( z = x -> ( z = y -> x = y ) )\n' +
		'56:55:imp            |- ( ( z = x /\\ z = y ) -> x = y )\n' +
		'57:56:exlimiv       |- ( E. z ( z = x /\\ z = y ) -> x = y )\n' +
		'qed:54,57:impbii   |- ( x = y <-> E. z ( z = x /\\ z = y ) )\n' +
		'\n' +
		'$=    vx cv vy cv wceq vz cv\n' +
		'      vx cv wceq vz cv vy cv\n' +
		'      wceq wa vz wex vx cv vy\n' +
		'      cv wceq vz cv vx cv\n' +
		'      wceq vz wex vz cv vx cv\n' +
		'      wceq vz cv vy cv wceq\n' +
		'      wa vz wex vz vx ax6ev\n' +
		'      vx cv vy cv wceq vz cv\n' +
		'      vx cv wceq vz cv vx cv\n' +
		'      wceq vz cv vy cv wceq\n' +
		'      wa vz vx cv vy cv wceq\n' +
		'      vz cv vx cv wceq vz cv\n' +
		'      vy cv wceq vx vy vz\n' +
		'      equtrr ancld eximdv mpi\n' +
		'      vz cv vx cv wceq vz cv\n' +
		'      vy cv wceq wa vx cv vy\n' +
		'      cv wceq vz vz cv vx cv\n' +
		'      wceq vz cv vy cv wceq\n' +
		'      vx cv vy cv wceq vz vx\n' +
		'      vy ax7 imp exlimiv\n' +
		'      impbii $.\n' +
		'\n' +
		'$d x z\n' +
		'$d y z\n';
	expect(mmpUnifier2.textEditArray[0].newText).toEqual(newTextExpected2);

	// Parameters.defaultRightMarginForNormalProofs = defaultRightMargin;

});

// this test needs the class cab that has x and ph exchanged w.r.t.
// the rpn order; thus it tests that yamma's proof generation
// handles properly syntax axioms with variables that don't appear
// in rpn order
test("Build proof for abid", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'50::df-clab         |- ( x e. { x | ph } <-> [ x / x ] ph )\n' +
		'51::sbid            |- ( [ x / x ] ph <-> ph )\n' +
		'qed:50,51:bitri    |- ( x e. { x | ph } <-> ph )\n';
	const mmpParser: MmpParser = new MmpParser(mmpSource, opelcnMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const qedProofStep: MmpProofStep = <MmpProofStep>mmpParser.mmpProof!.mmpStatements[3];
	const qedParseNode: InternalNode = qedProofStep.parseNode!;
	const phParseNode: InternalNode = <InternalNode>(<InternalNode>qedParseNode.parseNodes[1]).parseNodes[1];
	expect(phParseNode.label).toBe('wcel');
	const proofArray: UProofStatementStep[] = phParseNode.proofArray(mmpParser.outermostBlock, mmpParser.grammar);
	const proofString: string[] = UProofStatement.labelsArray(proofArray);
	expect(proofString).toEqual(["vx", "cv", "wph", "vx", "cab", "wcel"]);
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.normal, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		'50::df-clab         |- ( x e. { x | ph } <-> [ x / x ] ph )\n' +
		'51::sbid            |- ( [ x / x ] ph <-> ph )\n' +
		'qed:50,51:bitri    |- ( x e. { x | ph } <-> ph )\n' +
		'\n' +
		'$=    vx cv wph vx cab wcel wph vx vx wsb wph wph vx vx df-clab wph vx sbid\n' +
		'      bitri $.\n\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Packed proof for eqeq1", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'1::id              |- ( A = B -> A = B )\n' +
		'qed:1:eqeq1d      |- ( A = B -> ( A = C <-> B = C ) )';
	const mmpParser: MmpParser = new MmpParser(mmpSource, eqeq1iMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.packed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		'1::id               |- ( A = B -> A = B )\n' +
		'qed:1:eqeq1d       |- ( A = B -> ( A = C <-> B = C ) )\n' +
		'\n' +
		'$=  cA cB 1:wceq cA cB cC 1 id eqeq1d $.\n\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Packed proof for id", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'50::ax-1            |- ( ph -> ( ph -> ph ) )\n' +
		'51::ax-1            |- ( ph -> ( ( ph -> ph ) -> ph ) )\n' +
		'qed:50,51:mpd      |- ( ph -> ph )';
	const mmpParser: MmpParser = new MmpParser(mmpSource, impbiiMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.packed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		'50::ax-1            |- ( ph -> ( ph -> ph ) )\n' +
		'51::ax-1            |- ( ph -> ( ( ph -> ph ) -> ph ) )\n' +
		'qed:50,51:mpd      |- ( ph -> ph )\n' +
		'\n' +
		'$=  wph wph wph 1:wi wph wph wph ax-1 wph 1 ax-1 mpd $.\n\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Packet proof for elabgf", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'h50::elabgf.1         |- F/_ x A\n' +
		'h51::elabgf.2        |- F/ x ps\n' +
		'h52::elabgf.3        |- ( x = A -> ( ph <-> ps ) )\n' +
		'53::nfab1             |- F/_ x { x | ph }\n' +
		'54:50,53:nfel        |- F/ x A e. { x | ph }\n' +
		'55:54,51:nfbi       |- F/ x ( A e. { x | ph } <-> ps )\n' +
		'56::eleq1            |- ( x = A -> ( x e. { x | ph } <-> A e. { x | ph } ) )\n' +
		'57:56,52:bibi12d    |- ( x = A -> ( ( x e. { x | ph } <-> ph ) <-> ( A e. { x | ph } <-> ps ) ) )\n' +
		'58::abid            |- ( x e. { x | ph } <-> ph )\n' +
		'qed:50,55,57,58:vtoclgf\n' +
		'				    |- ( A e. B -> ( A e. { x | ph } <-> ps ) )';
	const mmpParser: MmpParser = new MmpParser(mmpSource, opelcnMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.packed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		'h50::elabgf.1         |- F/_ x A\n' +
		'h51::elabgf.2        |- F/ x ps\n' +
		'h52::elabgf.3        |- ( x = A -> ( ph <-> ps ) )\n' +
		'53::nfab1             |- F/_ x { x | ph }\n' +
		'54:50,53:nfel        |- F/ x A e. { x | ph }\n' +
		'55:54,51:nfbi       |- F/ x ( A e. { x | ph } <-> ps )\n' +
		'56::eleq1            |- ( x = A -> ( x e. { x | ph } <-> A e. { x | ph } ) )\n' +
		'57:56,52:bibi12d    |- ( x = A -> ( ( x e. { x | ph } <-> ph ) <-> ( A e. { x | ph } <-> ps ) ) )\n' +
		'58::abid            |- ( x e. { x | ph } <-> ph )\n' +
		'qed:50,55,57,58:vtoclgf\n' +
		'                   |- ( A e. B -> ( A e. { x | ph } <-> ps ) )\n' +
		'\n' +
		'$=  vx 1:cv wph vx 2:cab 3:wcel wph wb cA 2 4:wcel wps wb vx cA cB elabgf.1 4\n' +
		'    wps vx vx cA 2 elabgf.1 wph vx nfab1 nfel elabgf.2 nfbi 1 cA wceq 3 4 wph\n' +
		'    wps 1 cA 2 eleq1 elabgf.3 bibi12d wph vx abid vtoclgf $.\n\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("Packed proof for opelcn", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'1::df-c             |- CC = ( R. X. R. )\n' +
		'2:1:eleq2i        |- ( <. A , B >. e. CC <-> <. A , B >. e. ( R. X. R. ) )\n' +
		'3::opelxp          |- ( <. A , B >. e. ( R. X. R. ) <-> ( A e. R. /\\ B e. R. ) )\n' +
		'qed:2,3:bitri    |- ( <. A , B >. e. CC <-> ( A e. R. /\\ B e. R. ) )';
	const mmpParser: MmpParser = new MmpParser(mmpSource, opelcnMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.packed, 0);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		'1::df-c              |- CC = ( R. X. R. )\n' +
		'2:1:eleq2i          |- ( <. A , B >. e. CC <-> <. A , B >. e. ( R. X. R. ) )\n' +
		'3::opelxp           |- ( <. A , B >. e. ( R. X. R. ) <-> ( A e. R. /\\ B e. R. ) )\n' +
		'qed:2,3:bitri      |- ( <. A , B >. e. CC <-> ( A e. R. /\\ B e. R. ) )\n' +
		'\n' +
		'$=  cA cB 1:cop cc wcel 1 cnr cnr 2:cxp wcel cA cnr wcel cB cnr wcel wa cc 2 1\n' +
		'    df-c eleq2i cA cB cnr cnr opelxp bitri $.\n\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});

test("MmpSortedByReferenceLabelMapCreator", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'1::df-c             |- CC = ( R. X. R. )\n' +
		'2:1:eleq2i        |- ( <. A , B >. e. CC <-> <. A , B >. e. ( R. X. R. ) )\n' +
		'3::opelxp          |- ( <. A , B >. e. ( R. X. R. ) <-> ( A e. R. /\\ B e. R. ) )\n' +
		'qed:2,3:bitri    |- ( <. A , B >. e. CC <-> ( A e. R. /\\ B e. R. ) )';
	const mmpParser: MmpParser = new MmpParser(mmpSource, opelcnMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.packed, 0);
	mmpUnifier.unify();
	const labelMapCreator: ILabelMapCreatorForCompressedProof =
		new MmpSortedByReferenceLabelMapCreator();
	const createLabelMapArgs: CreateLabelMapArgs = {
		mmpPackedProofStatement: <MmpPackedProofStatement>(mmpUnifier.uProof?.proofStatement)
	};
	const labelMap: Map<string, number> = labelMapCreator.createLabelMap(createLabelMapArgs);

	// const newTextExpected =
	// 	'\n* test comment\n\n' +
	// 	'1::df-c              |- CC = ( R. X. R. )\n' +
	// 	'2:1:eleq2i          |- ( <. A , B >. e. CC <-> <. A , B >. e. ( R. X. R. ) )\n' +
	// 	'3::opelxp           |- ( <. A , B >. e. ( R. X. R. ) <-> ( A e. R. /\\ B e. R. ) )\n' +
	// 	'qed:2,3:bitri      |- ( <. A , B >. e. CC <-> ( A e. R. /\\ B e. R. ) )\n' +
	// 	'\n' +
	// 	'$=  cA cB 1:cop cc wcel 1 cnr cnr 2:cxp wcel cA cnr wcel cB cnr wcel wa cc 2 1\n' +
	// 	'    df-c eleq2i cA cB cnr cnr opelxp bitri $.\n\n';

	// ["cnr", 4],
	// ["wcel", 4],
	// ["cA", 3],
	// ["cB", 3],
	// ["cop", 3],
	// ["cc", 2],
	// ["cxp", 2],
	// ["wa", 1]
	// ["df-c", 1],
	// ["eleq2i", 1],
	// ["opelxp", 1],
	// ["bitri", 1],

	const expectedEntries: [string, number][] = [
		["cnr", 1],
		["wcel", 2],
		["cA", 3],
		["cB", 4],
		["cop", 5],
		["cc", 6],
		["cxp", 7],
		["wa", 8],
		["df-c", 9],
		["eleq2i", 10],
		["opelxp", 11],
		["bitri", 12],
	];

	expect(labelMap.size).toBe(12);

	const entries: Iterable<[string, number]> = labelMap.entries();

	let i = 0;
	for (const [key, value] of entries) {
		expect(key).toBe(expectedEntries[i][0]);
		expect(value).toBe(expectedEntries[i][1]);
		i++;
	}
});

test("Compressed proof for opth", () => {
	const mmpSource =
		'\n* test comment\n\n' +
		'h1::opth.1                    |- A e. _V\n' +
		'h2::opth.2                    |- B e. _V\n' +
		'3:1,2:opth1                |- ( <. A , B >. = <. C , D >. -> A = C )\n' +
		'4:1,2:opi1                   |- { A } e. <. A , B >.\n' +
		'5::id                        |- ( <. A , B >. = <. C , D >. -> <. A , B >. = <. C , D >. )\n' +
		'6:4,5:syl5eleq              |- ( <. A , B >. = <. C , D >. -> { A } e. <. C , D >. )\n' +
		'7::oprcl                    |- ( { A } e. <. C , D >. -> ( C e. _V /\\ D e. _V ) )\n' +
		'8:6,7:syl                  |- ( <. A , B >. = <. C , D >. -> ( C e. _V /\\ D e. _V ) )\n' +
		'9:8:simprd            |- ( <. A , B >. = <. C , D >. -> D e. _V )\n' +
		'10:3:opeq1d               |- ( <. A , B >. = <. C , D >. -> <. A , B >. = <. C , B >. )\n' +
		'11:10,5:eqtr3d           |- ( <. A , B >. = <. C , D >. -> <. C , B >. = <. C , D >. )\n' +
		'12:8:simpld               |- ( <. A , B >. = <. C , D >. -> C e. _V )\n' +
		'13::dfopg                 |- ( ( C e. _V /\\ B e. _V ) -> <. C , B >. = { { C } , { C , B } } )\n' +
		'14:12,2,13:sylancl       |- ( <. A , B >. = <. C , D >. -> <. C , B >. = { { C } , { C , B } } )\n' +
		'15:11,14:eqtr3d         |- ( <. A , B >. = <. C , D >. -> <. C , D >. = { { C } , { C , B } } )\n' +
		'16::dfopg                |- ( ( C e. _V /\\ D e. _V ) -> <. C , D >. = { { C } , { C , D } } )\n' +
		'17:8,16:syl             |- ( <. A , B >. = <. C , D >. -> <. C , D >. = { { C } , { C , D } } )\n' +
		'18:15,17:eqtr3d        |- ( <. A , B >. = <. C , D >. -> { { C } , { C , B } } = { { C } , { C , D } } )\n' +
		'19::prex                |- { C , B } e. _V\n' +
		'20::prex                |- { C , D } e. _V\n' +
		'21:19,20:preqr2        |- ( { { C } , { C , B } } = { { C } , { C , D } } -> { C , B } = { C , D } )\n' +
		'22:18,21:syl          |- ( <. A , B >. = <. C , D >. -> { C , B } = { C , D } )\n' +  // ok
		'23::preq2                |- ( x = D -> { C , x } = { C , D } )\n' +
		'24:23:eqeq2d            |- ( x = D -> ( { C , B } = { C , x } <-> { C , B } = { C , D } ) )\n' +
		'25::eqeq2               |- ( x = D -> ( B = x <-> B = D ) )\n' +
		'26:24,25:imbi12d       |- ( x = D -> ( ( { C , B } = { C , x } -> B = x ) <-> ( { C , B } = { C , D } -> B = D ) ) )\n' +   // ok
		'27::vex                 |- x e. _V\n' +
		'28:2,27:preqr2         |- ( { C , B } = { C , x } -> B = x )\n' +   // ok
		'29:26,28:vtoclg       |- ( D e. _V -> ( { C , B } = { C , D } -> B = D ) )\n' +  // KO!!!!
		'30:9,22,29:sylc      |- ( <. A , B >. = <. C , D >. -> B = D )\n' +
		'31:3,30:jca         |- ( <. A , B >. = <. C , D >. -> ( A = C /\\ B = D ) )\n' +   // KO!!!!
		'32::opeq12          |- ( ( A = C /\\ B = D ) -> <. A , B >. = <. C , D >. )\n' +
		'qed:31,32:impbii   |- ( <. A , B >. = <. C , D >. <-> ( A = C /\\ B = D ) )\n' +
		'$d B x\n' +
		'$d C x\n' +
		'$d D x';
	const mmpParser: MmpParser = new MmpParser(mmpSource, opelcnMmParser, new WorkingVars(kindToPrefixMap));
	mmpParser.parse();
	const labels: string[] = [
		'vx', 'cop', 'wceq', 'wa', 'cvv', 'wcel', 'cpr', 'csn', 'syl', 'eqtr3d',
		'dfopg', 'prex', 'preqr2', 'wi', 'id', 'simprd', 'opth1', 'opi1', 'syl5eleq',
		'oprcl', 'opeq1d', 'simpld', 'sylancl', 'cv', 'preq2', 'eqeq2d', 'imbi12d',
		'vex', 'eqeq2', 'vtoclg', 'sylc', 'jca', 'opeq12', 'impbii'
	];
	const labelMapCreator: ILabelMapCreatorForCompressedProof =
		new MmpHardcodedLabelSequenceCreator(labels);
	// const compressedProofCreator: IMmpCompressedProofCreator =
	// 	new MmpCompressedProofCreatorFromUncompressedProof(labelSequenceCreator);
	const compressedProofCreator: IMmpCompressedProofCreator =
		new MmpCompressedProofCreatorFromPackedProof(labelMapCreator);
	const mmpUnifier: MmpUnifier = new MmpUnifier(mmpParser, ProofMode.compressed, 0,
		undefined, undefined, undefined, undefined, compressedProofCreator);
	mmpUnifier.unify();
	const textEditArray: TextEdit[] = mmpUnifier.textEditArray;
	expect(textEditArray.length).toBe(1);
	const newTextExpected =
		'\n* test comment\n\n' +
		'h1::opth.1                    |- A e. _V\n' +
		'h2::opth.2                    |- B e. _V\n' +
		'3:1,2:opth1                |- ( <. A , B >. = <. C , D >. -> A = C )\n' +
		'4:1,2:opi1                   |- { A } e. <. A , B >.\n' +
		'5::id                        |- ( <. A , B >. = <. C , D >. -> <. A , B >. = <. C , D >. )\n' +
		'6:4,5:syl5eleq              |- ( <. A , B >. = <. C , D >. -> { A } e. <. C , D >. )\n' +
		'7::oprcl                    |- ( { A } e. <. C , D >. -> ( C e. _V /\\ D e. _V ) )\n' +
		'8:6,7:syl                  |- ( <. A , B >. = <. C , D >. -> ( C e. _V /\\ D e. _V ) )\n' +
		'9:8:simprd            |- ( <. A , B >. = <. C , D >. -> D e. _V )\n' +
		'10:3:opeq1d               |- ( <. A , B >. = <. C , D >. -> <. A , B >. = <. C , B >. )\n' +
		'11:10,5:eqtr3d           |- ( <. A , B >. = <. C , D >. -> <. C , B >. = <. C , D >. )\n' +
		'12:8:simpld               |- ( <. A , B >. = <. C , D >. -> C e. _V )\n' +
		'13::dfopg                 |- ( ( C e. _V /\\ B e. _V ) -> <. C , B >. = { { C } , { C , B } } )\n' +
		'14:12,2,13:sylancl       |- ( <. A , B >. = <. C , D >. -> <. C , B >. = { { C } , { C , B } } )\n' +
		'15:11,14:eqtr3d         |- ( <. A , B >. = <. C , D >. -> <. C , D >. = { { C } , { C , B } } )\n' +
		'16::dfopg                |- ( ( C e. _V /\\ D e. _V ) -> <. C , D >. = { { C } , { C , D } } )\n' +
		'17:8,16:syl             |- ( <. A , B >. = <. C , D >. -> <. C , D >. = { { C } , { C , D } } )\n' +
		'18:15,17:eqtr3d        |- ( <. A , B >. = <. C , D >. -> { { C } , { C , B } } = { { C } , { C , D } } )\n' +
		'19::prex                |- { C , B } e. _V\n' +
		'20::prex                |- { C , D } e. _V\n' +
		'21:19,20:preqr2        |- ( { { C } , { C , B } } = { { C } , { C , D } } -> { C , B } = { C , D } )\n' +
		'22:18,21:syl          |- ( <. A , B >. = <. C , D >. -> { C , B } = { C , D } )\n' +
		'23::preq2                |- ( x = D -> { C , x } = { C , D } )\n' +
		'24:23:eqeq2d            |- ( x = D -> ( { C , B } = { C , x } <-> { C , B } = { C , D } ) )\n' +
		'25::eqeq2               |- ( x = D -> ( B = x <-> B = D ) )\n' +
		'26:24,25:imbi12d       |- ( x = D -> ( ( { C , B } = { C , x } -> B = x ) <-> ( { C , B } = { C , D } -> B = D ) ) )\n' +
		'27::vex                 |- x e. _V\n' +
		'28:2,27:preqr2         |- ( { C , B } = { C , x } -> B = x )\n' +
		'29:26,28:vtoclg       |- ( D e. _V -> ( { C , B } = { C , D } -> B = D ) )\n' +
		'30:9,22,29:sylc      |- ( <. A , B >. = <. C , D >. -> B = D )\n' +
		'31:3,30:jca         |- ( <. A , B >. = <. C , D >. -> ( A = C /\\ B = D ) )\n' +
		'32::opeq12          |- ( ( A = C /\\ B = D ) -> <. A , B >. = <. C , D >. )\n' +
		'qed:31,32:impbii   |- ( <. A , B >. = <. C , D >. <-> ( A = C /\\ B = D ) )\n' +
		'\n' +
		'$= ( vx cop wceq wa cvv wcel cpr csn syl eqtr3d dfopg prex preqr2 wi id simprd\n' +
		'   opth1 opi1 syl5eleq oprcl opeq1d simpld sylancl cv preq2 eqeq2d imbi12d vex\n' +
		'   eqeq2 vtoclg sylc jca opeq12 impbii ) ABHZCDHZIZACIZBDIZJVCVDVEABCDEFUCZVCDK\n' +
		'   LZCBMZCDMZIZVEVCCKLZVGVCANZVBLVKVGJZVCVLVAVBABEFUDVCUAZUECDVLUFOZUBVCCNZVHMZ\n' +
		'   VPVIMZIVJVCVBVQVRVCCBHZVBVQVCVAVSVBVCACBVFUGVNPVCVKBKLVSVQIVCVKVGVOUHFCBKKQU\n' +
		'   IPVCVMVBVRIVOCDKKQOPVHVIVPCBRCDRSOVHCGUJZMZIZBVTIZTVJVETGDKVTDIZWBVJWCVEWDWA\n' +
		'   VIVHVTDCUKULVTDBUOUMBVTCFGUNSUPUQURABCDUSUT $.\n\n' +
		'$d B x\n' +
		'$d C x\n' +
		'$d D x\n';
	const textEdit: TextEdit = textEditArray[0];
	expect(textEdit.newText).toEqual(newTextExpected);
});
