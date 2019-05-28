// IMPORTS
// ================================================================================================
import * as assert from 'assert';
import { Stark, PrimeField } from '../index';
import { ExecutionFrame, EvaluationFrame } from '@guildofweavers/genstark';

// STARK DEFINITION
// ================================================================================================
// define a filed in which we'll be working
const modulus = 2n**32n - 3n * 2n**25n + 1n;
const field = new PrimeField(modulus);

// define state transition function for Fibonacci sequence:
// each step advances Fibonacci sequence by 2 values
function fibTransition(frame: ExecutionFrame) {
    const v0 = frame.getValue(0);
    const v1 = frame.getValue(1);
    const v2 = frame.add(v0, v1);
    const v3 = frame.add(v1, v2);

    frame.setNextValue(0, v2);
    frame.setNextValue(1, v3);
}

// make sure register 0 is updated correctly
function fibConstraint1(frame: EvaluationFrame) {
    const v0 = frame.getValue(0);
    const v1 = frame.getValue(1);
    const v2 = frame.getNextValue(0);
    return frame.sub(v2, frame.add(v0, v1));
}

// make sure register 1 is updated correctly
function fibConstraint2(frame: EvaluationFrame) {
    const v0 = frame.getValue(0);
    const v1 = frame.getValue(1);
    const v2 = frame.add(v0, v1);
    const v3 = frame.getNextValue(1);
    return frame.sub(v3, frame.add(v1, v2));
}

// create the STARK for Fibonacci calculation
const fibStark = new Stark({
    field               : field,
    registerCount       : 2,                            // we are working with 2 registers
    tFunction           : fibTransition,
    tConstraints        : [fibConstraint1, fibConstraint2],
    tConstraintDegree   : 1                             // max degree of our constraints is 1
});

// TESTING
// ================================================================================================
let steps = 2**13, result = 203257732n;             // ~3 seconds to prove, ~215 KB proof size
//let steps = 2**17, result = 2391373091n;          // ~60 seconds to prove, ~388 KB proof size

// set up inputs and assertions
const inputs = [1n, 1n];                            // step 0 and 1 in Fibonacci sequence are 1
const assertions = [
    { step: 0, register: 0, value: 1n },            // value at the first step is 1
    { step: 0, register: 1, value: 1n },            // value at the second step is 1
    { step: steps-1, register: 1, value: result }   // value at the last step is equal to result
];

// prove that the assertions hold if we execute Fibonacci computation for the given number of steps
let proof = fibStark.prove(assertions, steps, inputs);
console.log('-'.repeat(20));

// serialize the proof, should be about 215KB
let start = Date.now();
const buf = fibStark.serialize(proof);
console.log(`Proof serialized in ${Date.now() - start} ms`);
console.log(`Proof size: ${Math.round(buf.byteLength / 1024 * 100) / 100} KB`);
assert(buf.byteLength === fibStark.sizeOf(proof));
console.log('-'.repeat(20));

// deserialize the proof to make sure everything serialized correctly
start = Date.now();
proof = fibStark.parse(buf);
console.log(`Proof parsed in ${Date.now() - start} ms`);
console.log('-'.repeat(20));

// verify the proof
fibStark.verify(assertions, proof, steps);
console.log('-'.repeat(20));