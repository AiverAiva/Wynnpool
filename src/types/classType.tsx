export interface ClassInfo {
    displayName: string;
}

const classMap: Record<string, ClassInfo> = {
    "assassin": { displayName: "Assassin/Ninja" },
    "mage": { displayName: "Mage/Dark Wizard" },
    "warrior": { displayName: "Warrior/Knight" },
    "shaman": { displayName: "Shaman/Skyseer" },
    "archer": { displayName: "Archer/Hunter" },
}

export function getClassInfo(className: string): ClassInfo | undefined {
    return classMap[className];
}