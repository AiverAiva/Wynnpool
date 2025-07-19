function getMaxGuildMembers(level: number): number {
    if (level === 1) return 4;
    if (level <= 5) return 8;
    if (level <= 14) return 16;
    if (level <= 23) return 26;
    if (level <= 32) return 38;
    if (level <= 41) return 48;
    if (level <= 53) return 60;
    if (level <= 65) return 72;
    if (level <= 74) return 80;
    if (level <= 80) return 86;
    if (level <= 86) return 92;
    if (level <= 92) return 98;
    if (level <= 95) return 102;
    if (level <= 98) return 106;
    if (level <= 100) return 110;
    if (level <= 103) return 114;
    if (level <= 106) return 118;
    if (level <= 109) return 122;
    if (level <= 112) return 126;
    if (level <= 115) return 130;
    if (level <= 118) return 140;
    if (level >= 119) return 150;
    return 0;
}

export { getMaxGuildMembers }