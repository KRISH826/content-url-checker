import { diffWordsWithSpace, Change } from 'diff';

export interface diffContent {
    score: number;
    isExactMatch: boolean;
    removeWords: number;
    addwords: number;
    parts: Change[]
}

export function compareText(oldText: string, newText: string) {
    const parts = diffWordsWithSpace(oldText, newText);
    let addwords = 0;
    let removewords = 0;
    let equalwords = 0;

    for (const part of parts) {
        const count = part.value.trim().split(/\s+/).filter(Boolean).length;
        if (part.added) {
            addwords += count;
        } else if (part.removed) {
            removewords += count;
        } else {
            equalwords += count;
        }
    }

    const total = equalwords + Math.max(addwords, removewords)
    const score = total === 0 ? 100 : Math.round(equalwords / total * 100)

    return {
        score,
        isExactMatch: oldText === newText,
        removeWords: removewords,
        addwords: addwords,
        parts,
    };

}