"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// MODULE VARIABLES
// ================================================================================================
exports.MAX_ARRAY_LENGTH = 256;
exports.MAX_MATRIX_COLUMN_LENGTH = 127;
// PUBLIC FUNCTIONS
// ================================================================================================
function sizeOf(proof, fieldElementSize, hashDigestSize) {
    let size = hashDigestSize; // evRoot
    // evProof
    let evProof = sizeOfMerkleProof(proof.evProof);
    size += evProof;
    // ldProof
    let ldProof = 1; // ld component count
    let lcProof = hashDigestSize; // lc root
    lcProof += sizeOfMerkleProof(proof.ldProof.lcProof);
    ldProof += lcProof;
    const ldLevels = [];
    for (let i = 0; i < proof.ldProof.components.length; i++) {
        let component = proof.ldProof.components[i];
        let ldLevel = hashDigestSize; // column root
        ldLevel += sizeOfMerkleProof(component.columnProof);
        ldLevel += sizeOfMerkleProof(component.polyProof);
        ldProof += ldLevel;
        ldLevels.push(ldLevel);
    }
    let ldRemainder = proof.ldProof.remainder.values.length * fieldElementSize;
    ldRemainder += 1; // 1 byte for remainder length
    ldLevels.push(ldRemainder);
    ldProof += ldRemainder;
    size += ldProof;
    return { evProof, ldProof: { lcProof, levels: ldLevels, total: ldProof }, total: size };
}
exports.sizeOf = sizeOf;
function sizeOfMerkleProof(proof) {
    let size = 0;
    size += sizeOfArray(proof.values);
    size += sizeOfMatrix(proof.nodes);
    size += 1; // tree depth
    return size;
}
exports.sizeOfMerkleProof = sizeOfMerkleProof;
// HELPER FUNCTIONS
// ================================================================================================
function sizeOfArray(array) {
    if (array.length === 0) {
        throw new Error(`Array cannot be zero-length`);
    }
    else if (array.length > exports.MAX_ARRAY_LENGTH) {
        throw new Error(`Array length (${array.length}) cannot exceed ${exports.MAX_ARRAY_LENGTH}`);
    }
    let size = 1; // 1 byte for array length
    for (let i = 0; i < array.length; i++) {
        size += array[i].length;
    }
    return size;
}
function sizeOfMatrix(matrix) {
    if (matrix.length > exports.MAX_ARRAY_LENGTH) {
        throw new Error(`Matrix column count (${matrix.length}) cannot exceed ${exports.MAX_ARRAY_LENGTH}`);
    }
    let size = 1; // 1 byte for number of columns
    size += matrix.length; // 1 byte for length and type of each column
    for (let i = 0; i < matrix.length; i++) {
        let column = matrix[i];
        let columnLength = column.length;
        if (columnLength >= exports.MAX_MATRIX_COLUMN_LENGTH) {
            throw new Error(`Matrix column length (${columnLength}) cannot exceed ${exports.MAX_MATRIX_COLUMN_LENGTH}`);
        }
        for (let j = 0; j < columnLength; j++) {
            size += column[j].length;
        }
    }
    return size;
}
//# sourceMappingURL=sizeof.js.map