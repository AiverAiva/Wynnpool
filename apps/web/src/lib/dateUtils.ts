const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const REFERENCE_FRIDAY_UTC = Date.UTC(2024, 0, 5, 18, 0, 0)

function getFirstFriday18UTC(year: number): number {
    const jan1 = new Date(Date.UTC(year, 0, 1, 18, 0, 0))
    const day = jan1.getUTCDay()
    const diffToFriday = (5 - day + 7) % 7
    jan1.setUTCDate(jan1.getUTCDate() + diffToFriday)
    return jan1.getTime()
}

function getRaidpoolYearWeek(date: Date): { year: number; week: number } {
    const diffWeeks = Math.floor(
        (date.getTime() - REFERENCE_FRIDAY_UTC) / WEEK_MS
    )

    const weekStart = REFERENCE_FRIDAY_UTC + diffWeeks * WEEK_MS
    const weekDate = new Date(weekStart)

    const year = weekDate.getUTCFullYear()
    const firstFriday = getFirstFriday18UTC(year)
    const week = Math.floor((weekStart - firstFriday) / WEEK_MS) + 1

    return { year, week }
}

export { WEEK_MS, getFirstFriday18UTC, getRaidpoolYearWeek }